import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/jwt';
import { prisma } from '../../../../lib/prisma';
import { sendPackageArrivedEmail } from '../../../../lib/email';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, что пользователь админ
    if (!dbUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    // Парсим форму с файлами
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'packages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const orderItemId = Array.isArray(fields.orderItemId) ? fields.orderItemId[0] : fields.orderItemId;
    const trackingNumber = Array.isArray(fields.trackingNumber) ? fields.trackingNumber[0] : fields.trackingNumber;
    const weight = Array.isArray(fields.weight) ? fields.weight[0] : fields.weight;
    const shippingCost = Array.isArray(fields.shippingCost) ? fields.shippingCost[0] : fields.shippingCost;
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;
    const shippingMethod = Array.isArray(fields.shippingMethod) ? fields.shippingMethod[0] : fields.shippingMethod;

    if (!orderItemId) {
      return res.status(400).json({ error: 'Order Item ID required' });
    }

    // Проверяем, что товар заказа существует
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            user: true,
            items: {
              include: {
                package: true
              }
            }
          }
        },
        package: true
      }
    });

    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    // Проверяем, что для этого товара еще не создана посылка
    if (orderItem.package) {
      return res.status(400).json({ error: 'Package already exists for this item' });
    }

    // Проверяем сколько items в этом заказе
    const itemsInOrder = orderItem.order.items;
    const itemsWithoutPackages = itemsInOrder.filter(item => !item.package);

    
    // Обрабатываем загруженное фото
    let packagePhotoUrl = null;
    if (files.packagePhoto) {
      const photoFile = Array.isArray(files.packagePhoto) ? files.packagePhoto[0] : files.packagePhoto;
      const filename = path.basename(photoFile.filepath);
      packagePhotoUrl = `/uploads/packages/${filename}`;
    }

    // АВТО-КОНСОЛИДАЦИЯ: Если в заказе несколько items (одинаковый товар с разными вариантами)
    if (itemsInOrder.length > 1) {
      
      // Создаем dummy OrderItem для консолидированного пакета
      const consolidatedTitle = `${itemsInOrder[0].title.split(/[(\[{]/)[0].trim()} (${itemsInOrder.length} variants)`;
      const totalPrice = itemsInOrder.reduce((sum, item) => sum + item.price, 0);
      // Берем domestic shipping cost от первого товара (общая стоимость, не умножаем)
      const totalDomesticShippingCost = itemsInOrder[0].domesticShippingCost || 0;

      const dummyOrderItem = await prisma.orderItem.create({
        data: {
          orderId: orderItem.orderId,
          itemCode: 'AUTO_CONSOLIDATED',
          title: consolidatedTitle,
          price: totalPrice,
          quantity: itemsInOrder.length,
          image: itemsInOrder[0].image,
          marketplace: 'consolidated'
        }
      });

      // Создаем консолидированный package
      const packageRecord = await prisma.package.create({
        data: {
          userId: orderItem.order.userId,
          orderItemId: dummyOrderItem.id,
          trackingNumber: trackingNumber || null,
          weight: weight ? parseFloat(weight) : null,
          shippingCost: shippingCost ? parseInt(shippingCost) : 0,
          domesticShippingCost: totalDomesticShippingCost,
          domesticShippingPaid: false, // Пользователь должен оплатить общую сумму
          notes: notes || `Auto-consolidated from ${itemsInOrder.length} items`,
          shippingMethod: shippingMethod || 'ems',
          shippingAddressId: orderItem.order.addressId || null, // Copy address from order
          packagePhoto: packagePhotoUrl,
          status: 'pending_shipping',
          autoConsolidated: true,
          consolidated: true, // Помечаем как консолидированный
          originalOrderItemIds: JSON.stringify(itemsInOrder.map(item => item.id))
        }
      });

      // Создаем уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: orderItem.order.userId,
          type: 'package_ready',
          title: '📦 Consolidated Package Ready',
          message: `Your ${itemsInOrder.length} items have been automatically consolidated into one package and are ready for shipping.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
          read: false
        }
      });

      // Email уведомление о прибытии посылки на склад
      try {
        await sendPackageArrivedEmail({
          email: orderItem.order.user.email,
          name: orderItem.order.user.name || '',
          itemTitle: consolidatedTitle,
          weight: weight ? parseFloat(weight) : null,
          trackingNumber: trackingNumber || null,
        });
      } catch (e) {
        console.error('[Email] Failed to send package arrived email:', e);
      }

      return res.status(200).json({
        success: true,
        package: packageRecord,
        autoConsolidated: true,
        itemsCount: itemsInOrder.length
      });
    }

    // Обычное создание package для одного item

    // Проверяем, была ли уже оплачена domestic shipping в этой группе
    let domesticShippingAlreadyPaid = false;
    if (orderItem.sharedDomesticShippingGroup) {
      const existingGroupPackages = await prisma.package.findFirst({
        where: {
          sharedDomesticShippingGroup: orderItem.sharedDomesticShippingGroup,
          domesticShippingPaid: true
        }
      });

      if (existingGroupPackages) {
        domesticShippingAlreadyPaid = true;
              }
    }

    const packageRecord = await prisma.package.create({
      data: {
        userId: orderItem.order.userId,
        orderItemId: orderItemId,
        trackingNumber: trackingNumber || null,
        weight: weight ? parseFloat(weight) : null,
        shippingCost: shippingCost ? parseInt(shippingCost) : 0,
        domesticShippingCost: orderItem.domesticShippingCost || 0,
        domesticShippingPaid: domesticShippingAlreadyPaid, // Автоматически помечаем как оплаченное, если группа уже оплатила
        sharedDomesticShippingGroup: orderItem.sharedDomesticShippingGroup || null,
        shippingAddressId: orderItem.order.addressId || null, // Copy address from order
        notes: notes || null,
        shippingMethod: shippingMethod || 'ems',
        packagePhoto: packagePhotoUrl,
        status: 'pending_shipping'
      }
    });

    // Создаем уведомление для пользователя
    const notificationMessage = domesticShippingAlreadyPaid
      ? `Ваш товар "${orderItem.title}" прибыл на склад и готов к отправке. Domestic shipping уже оплачена для группы.${trackingNumber ? ` Трек-номер: ${trackingNumber}` : ''}`
      : `Ваш товар "${orderItem.title}" прибыл на склад и готов к отправке.${trackingNumber ? ` Трек-номер: ${trackingNumber}` : ''}`;

    await prisma.notification.create({
      data: {
        userId: orderItem.order.userId,
        type: 'package_ready',
        title: domesticShippingAlreadyPaid ? '✅ Посылка готова (оплачена)' : 'Посылка готова к отправке',
        message: notificationMessage,
        read: false
      }
    });

    // Email уведомление о прибытии посылки на склад
    try {
      await sendPackageArrivedEmail({
        email: orderItem.order.user.email,
        name: orderItem.order.user.name || '',
        itemTitle: orderItem.title,
        weight: weight ? parseFloat(weight) : null,
        trackingNumber: trackingNumber || null,
      });
    } catch (e) {
      console.error('[Email] Failed to send package arrived email:', e);
    }

    res.status(200).json({
      success: true,
      package: packageRecord
    });

  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
