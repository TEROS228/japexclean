import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/jwt';
import { prisma } from '../../../../lib/prisma';

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

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    // Получаем Order со всеми items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            package: true
          }
        },
        user: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Проверяем, что у товаров еще нет packages
    const hasPackages = order.items.some(item => item.package !== null);
    if (hasPackages) {
      return res.status(400).json({ error: 'Cannot deconsolidate: some items already have packages' });
    }

    // Проверяем, что в заказе больше одного товара
    if (order.items.length <= 1) {
      return res.status(400).json({ error: 'Order has only one item, nothing to deconsolidate' });
    }

    console.log(`Deconsolidating order ${orderId} with ${order.items.length} items`);

    // Создаем уникальный ID группы для shared domestic shipping
    const sharedGroup = `shared_${Date.now()}_${orderId}`;

    // Получаем максимальный orderNumber
    const maxOrderNumber = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true }
    });

    let nextOrderNumber = (maxOrderNumber?.orderNumber || 0) + 1;

    // Оставляем первый товар в текущем Order, остальные переносим в новые Orders
    const [firstItem, ...restItems] = order.items;

    // Обновляем total для первого Order и добавляем sharedDomesticShippingGroup первому item
    await prisma.order.update({
      where: { id: orderId },
      data: {
        total: firstItem.price * firstItem.quantity
      }
    });

    // Присваиваем группу первому товару
    await prisma.orderItem.update({
      where: { id: firstItem.id },
      data: {
        sharedDomesticShippingGroup: sharedGroup
      }
    });

    // Создаем новые Orders для остальных товаров
    const newOrders = [];
    for (const item of restItems) {
      const newOrder = await prisma.order.create({
        data: {
          userId: order.userId,
          orderNumber: nextOrderNumber,
          total: item.price * item.quantity,
          status: order.status,
          confirmed: order.confirmed,
          shippingCountry: order.shippingCountry
        }
      });

      // Переносим item в новый Order и присваиваем группу
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          orderId: newOrder.id,
          sharedDomesticShippingGroup: sharedGroup
        }
      });

      newOrders.push(newOrder);
      nextOrderNumber++;
    }

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_update',
        title: '📦 Order Items Separated',
        message: `Your order items have been separated by admin. Each item now has its own order number.`,
        read: false
      }
    });

    res.status(200).json({
      success: true,
      message: `Order deconsolidated into ${newOrders.length + 1} separate orders`,
      originalOrder: orderId,
      newOrders: newOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber
      }))
    });

  } catch (error) {
    console.error('Error deconsolidating order items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
