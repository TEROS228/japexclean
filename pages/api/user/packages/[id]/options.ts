import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';
import { sendTelegramNotification } from '../../../../../lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Отключаем кеширование
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { shippingMethod, consolidation, photoService, reinforcement, cancelReturn, cancelPurchase, consolidateWith, additionalInsurance } = req.body;

    console.log('Received options:', { shippingMethod, consolidation, photoService, reinforcement, cancelReturn, cancelPurchase, consolidateWith, additionalInsurance });

    // Получаем текущую посылку
    const currentPackage = await prisma.package.findUnique({
      where: { id: id as string }
    });

    if (!currentPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Проверяем оплату domestic shipping
    if (currentPackage.domesticShippingCost > 0 && !currentPackage.domesticShippingPaid) {
      return res.status(400).json({ error: 'Please pay domestic shipping fee before configuring services' });
    }

    let charged = false;

    // Если включена фото услуга и она еще не оплачена
    if (photoService && !currentPackage.photoServicePaid) {
      // Проверяем баланс
      if (dbUser.balance < 500) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Списываем 500 иен
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { balance: { decrement: 500 } }
      });

      // Создаем транзакцию
      await prisma.transaction.create({
        data: {
          userId: dbUser.id,
          amount: -500,
          type: 'service',
          status: 'completed',
          description: 'Photo service for package'
        }
      });

      // Создаем уведомление для админа
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'photo_request',
            title: '📸 New Photo Service Request',
            message: `${dbUser.email} requested photos for package. Upload up to 3 photos.`
          }
        });
      }

      // Уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: dbUser.id,
          type: 'photo_service_paid',
          title: '✅ Photo service activated',
          message: 'Your photo service request has been received. ¥500 has been charged. Photos will be uploaded soon!'
        }
      });

      // Отправляем уведомление в Telegram
      const pkg = await prisma.package.findUnique({
        where: { id: id as string },
        include: {
          orderItem: {
            include: {
              order: true
            }
          }
        }
      });

      if (pkg) {
        const telegramMessage = `
📸 <b>NEW PHOTO SERVICE REQUEST</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Order:</b> #${pkg.orderItem.order.orderNumber || 'N/A'}
📦 <b>Item:</b> ${pkg.orderItem.title}
💰 <b>Cost:</b> ¥500 (charged)

<i>Send photos with caption: #${pkg.orderItem.order.orderNumber}</i>
        `.trim();

        await sendTelegramNotification(telegramMessage);
      }

      charged = true;
    }

    // Если включена услуга укрепления и она еще не оплачена
    if (reinforcement && !currentPackage.reinforcementPaid) {
      // Проверяем баланс
      if (dbUser.balance < 1000) {
        return res.status(400).json({ error: 'Insufficient balance for reinforcement service' });
      }

      // Списываем 1000 иен
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { balance: { decrement: 1000 } }
      });

      // Создаем транзакцию
      await prisma.transaction.create({
        data: {
          userId: dbUser.id,
          amount: -1000,
          type: 'service',
          status: 'completed',
          description: 'Package reinforcement service'
        }
      });

      // Создаем уведомление для админа
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'reinforcement_request',
            title: '📦 New Reinforcement Service Request',
            message: `${dbUser.email} requested package reinforcement. Strengthen corners and add bubble wrap for fragile items.`
          }
        });
      }

      // Уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: dbUser.id,
          type: 'reinforcement_service_paid',
          title: '✅ Reinforcement service activated',
          message: 'Your reinforcement service request has been received. ¥1000 has been charged. Your package will be reinforced before shipping!'
        }
      });

      // Отправляем уведомление в Telegram
      const pkg = await prisma.package.findUnique({
        where: { id: id as string },
        include: { orderItem: true }
      });

      if (pkg) {
        const telegramMessage = `
📦 <b>NEW REINFORCEMENT SERVICE REQUEST</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Package:</b> ${pkg.orderItem.title}
💰 <b>Cost:</b> ¥1000 (charged)

<i>Please reinforce corners and add bubble wrap for fragile items.</i>
        `.trim();

        await sendTelegramNotification(telegramMessage);
      }

      charged = true;
    }

    // Если изменена дополнительная страховка
    const insuranceCost = additionalInsurance > 0 ? Math.ceil(additionalInsurance / 20000) * 50 : 0;
    const currentInsuranceCost = currentPackage.additionalInsurance > 0 ? Math.ceil(currentPackage.additionalInsurance / 20000) * 50 : 0;
    const insuranceDifference = insuranceCost - currentInsuranceCost;

    if (insuranceDifference > 0) {
      // Нужно доплатить
      if (dbUser.balance < insuranceDifference) {
        return res.status(400).json({ error: 'Insufficient balance for additional insurance' });
      }

      // Списываем разницу
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { balance: { decrement: insuranceDifference } }
      });

      // Создаем транзакцию
      await prisma.transaction.create({
        data: {
          userId: dbUser.id,
          amount: -insuranceDifference,
          type: 'service',
          status: 'completed',
          description: `Additional insurance coverage: ¥${additionalInsurance.toLocaleString()} (¥${insuranceDifference} charged)`
        }
      });

      // Уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: dbUser.id,
          type: 'insurance_purchased',
          title: '✅ Insurance Coverage Increased',
          message: `Your package is now insured for ¥${(20000 + additionalInsurance).toLocaleString()}. ¥${insuranceDifference} has been charged.`
        }
      });

      charged = true;
    }

    // Если запрошена отмена покупки
    if (cancelPurchase && !currentPackage.cancelPurchase) {
      // Создаем уведомление для админа
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'cancel_purchase_request',
            title: '❌ Purchase Cancellation Request',
            message: `${dbUser.email} requested to cancel purchase. Check admin panel.`
          }
        });
      }

      // Уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: dbUser.id,
          type: 'cancel_purchase_requested',
          title: '✅ Cancellation Request Sent',
          message: 'Your cancellation request has been received. We will contact the seller. You will need to pay ¥900 if seller approves.'
        }
      });
    }

    // Генерируем новый ID для будущей консолидированной посылки если включена консолидация
    let futureConsolidatedId = currentPackage.futureConsolidatedId;
    const shouldSendNotification = (consolidation || consolidateWith) && !currentPackage.consolidation && !currentPackage.consolidateWith;

    console.log('📧 [NOTIFICATION CHECK]:', {
      consolidation,
      consolidateWith,
      currentPackageConsolidation: currentPackage.consolidation,
      currentPackageConsolidateWith: currentPackage.consolidateWith,
      shouldSendNotification
    });

    if (consolidation && !futureConsolidatedId) {
      // Генерируем читаемый ID для консолидации
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // Получаем количество консолидаций за сегодня для уникального номера
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayConsolidations = await prisma.package.count({
        where: {
          consolidation: true,
          createdAt: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      });

      const sequenceNum = String(todayConsolidations + 1).padStart(3, '0');
      futureConsolidatedId = `CONS-${dateStr}-${sequenceNum}`;
      console.log('Generated future consolidated package ID:', futureConsolidatedId);
    }

    // Отправляем уведомление только если это НОВЫЙ запрос на консолидацию
    if (shouldSendNotification) {
      console.log('✅ [NOTIFICATION] Sending consolidation notification...');
      // Получаем информацию о пакетах для консолидации
      const pkg = await prisma.package.findUnique({
        where: { id: id as string },
        include: { orderItem: true }
      });

      let consolidateWithPackages: any[] = [];
      if (consolidateWith) {
        try {
          const packageIds = JSON.parse(consolidateWith);
          consolidateWithPackages = await prisma.package.findMany({
            where: { id: { in: packageIds } },
            include: { orderItem: true }
          });
        } catch (e) {
          console.error('Error parsing consolidateWith:', e);
        }
      }

      if (pkg) {
        const consolidateWithTitles = consolidateWithPackages.map(p => `  - ${p.orderItem?.title || 'Package'}`).join('\n');

        const telegramMessage = `
🎁 <b>NEW CONSOLIDATION REQUEST</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Main Package:</b> ${pkg.orderItem.title}
${consolidateWithTitles ? `📦 <b>Consolidate with:</b>\n${consolidateWithTitles}` : ''}
${futureConsolidatedId ? `🔗 <b>Consolidated ID:</b> ${futureConsolidatedId}` : ''}

<i>This package will be consolidated with ${consolidateWithPackages.length || 'other'} package(s).</i>
        `.trim();

        await sendTelegramNotification(telegramMessage);
        console.log('✅ [NOTIFICATION] Telegram notification sent');
      }

      // Создаем уведомление для админа
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      console.log(`✅ [NOTIFICATION] Found ${adminUsers.length} admin users`);

      const packageTitle = pkg?.orderItem?.title || 'Package';
      const consolidateCount = consolidateWithPackages.length;

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'consolidation_request',
            title: '🎁 New Consolidation Request',
            message: `${dbUser.email} requested consolidation for "${packageTitle}"${consolidateCount > 0 ? ` with ${consolidateCount} other package(s)` : ''}`
          }
        });
        console.log(`✅ [NOTIFICATION] Created notification for admin: ${admin.email}`);
      }
    } else {
      console.log('❌ [NOTIFICATION] Notification NOT sent - shouldSendNotification is false');
    }

    // DEBUG: Логируем данные консолидации
    console.log('🔍 [OPTIONS API] Package update:', {
      packageId: id,
      consolidation,
      consolidateWith,
      willSetConsolidation: consolidation || (consolidateWith ? true : false),
      autoConsolidated: currentPackage.autoConsolidated
    });

    // Обновляем настройки посылки
    const updatedPackage = await prisma.package.update({
      where: {
        id: id as string,
        userId: dbUser.id
      },
      data: {
        shippingMethod,
        // Если есть consolidateWith - автоматически включаем consolidation
        consolidation: consolidation || (consolidateWith ? true : false),
        futureConsolidatedId: consolidation ? futureConsolidatedId : null,
        // Photo service - НЕ обновляем если уже completed
        photoService: currentPackage.photoServiceStatus === 'completed' ? currentPackage.photoService : photoService,
        photoServicePaid: currentPackage.photoServiceStatus === 'completed'
          ? currentPackage.photoServicePaid
          : (photoService ? (currentPackage.photoServicePaid || charged) : false),
        photoServiceStatus: currentPackage.photoServiceStatus === 'completed'
          ? 'completed'
          : (photoService ? (charged ? 'pending' : currentPackage.photoServiceStatus) : currentPackage.photoServiceStatus),
        // Reinforcement - НЕ обновляем если уже completed
        reinforcement: currentPackage.reinforcementStatus === 'completed' ? currentPackage.reinforcement : reinforcement,
        reinforcementPaid: currentPackage.reinforcementStatus === 'completed'
          ? currentPackage.reinforcementPaid
          : (reinforcement ? (currentPackage.reinforcementPaid || charged) : false),
        reinforcementStatus: currentPackage.reinforcementStatus === 'completed'
          ? 'completed'
          : (reinforcement ? (charged ? 'pending' : currentPackage.reinforcementStatus) : currentPackage.reinforcementStatus),
        // Additional Insurance
        additionalInsurance: additionalInsurance !== undefined ? additionalInsurance : currentPackage.additionalInsurance,
        additionalInsurancePaid: insuranceDifference > 0 ? true : currentPackage.additionalInsurancePaid,
        cancelReturn,
        cancelPurchase: cancelPurchase || false,
        cancelPurchaseStatus: cancelPurchase && !currentPackage.cancelPurchase ? 'pending' : currentPackage.cancelPurchaseStatus,
        consolidateWith
      },
      include: {
        orderItem: true
      }
    });

    console.log('Updated package:', updatedPackage);

    res.status(200).json({ package: updatedPackage, charged });

  } catch (error) {
    console.error('Error updating package options:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
