// pages/api/order.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/jwt';
import { sendTelegramNotification } from '../../lib/telegram';
import { formatOrderNotification } from '../../lib/order-notification';
import { prisma } from '../../lib/prisma';
import { markCouponAsUsed } from '../../lib/coupons';

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

  const { cart, total, shippingCountry, preferredShippingCarrier, addressId, couponCode } = req.body;

  // Проверяем что корзина не пустая
  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Логируем полученную корзину для отладки
  console.log('Cart received:', JSON.stringify(cart, null, 2));

  try {
    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Группируем товары по базовому itemCode (убираем варианты)
    const getBaseItemCode = (itemCode: string) => {
      // Убираем части с вариантами (например "shop:12345_color_red" -> "shop:12345")
      return itemCode.split('_')[0];
    };

    // Группируем товары
    const groupedItems: { [baseCode: string]: typeof cart } = {};
    for (const item of cart) {
      const baseCode = getBaseItemCode(item.id);
      if (!groupedItems[baseCode]) {
        groupedItems[baseCode] = [];
      }
      groupedItems[baseCode].push(item);
    }

    console.log('Grouped items:', Object.keys(groupedItems).length, 'groups');

    // Создаем заказ для каждой группы товаров
    const orders = [];

    for (const [baseCode, items] of Object.entries(groupedItems)) {
      // Суммируем стоимость всех товаров в группе
      const groupTotal = items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);

      // Генерируем следующий orderNumber
      const lastOrder = await prisma.order.findFirst({
        where: { orderNumber: { not: null } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true }
      });
      const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

      // Создаем отдельные OrderItems для каждого товара
      // Если quantity > 1, создаем несколько одинаковых OrderItems
      const orderItemsToCreate = [];

      for (const item of items) {
        const quantity = item.quantity || 1;

        // Создаем отдельный OrderItem для каждой единицы товара
        for (let i = 0; i < quantity; i++) {
          orderItemsToCreate.push({
            itemCode: item.id,
            title: item.title,
            price: item.price,
            quantity: 1, // Каждый OrderItem имеет quantity = 1
            image: item.image || null,
            marketplace: item.marketplace || null,
            itemUrl: item.itemUrl || null,
            options: item.options ? JSON.stringify(item.options) : null,
          });
        }
      }

      // Создаем один Order с несколькими OrderItems
      const order = await prisma.order.create({
        data: {
          userId: dbUser.id,
          orderNumber: nextOrderNumber,
          total: groupTotal,
          status: 'completed',
          shippingCountry: shippingCountry || null,
          preferredShippingCarrier: preferredShippingCarrier || null,
          addressId: addressId || null,
          items: {
            create: orderItemsToCreate
          }
        },
        include: {
          items: true
        }
      });

      orders.push(order);
      console.log(`Order #${nextOrderNumber} created with ${orderItemsToCreate.length} order items from ${items.length} cart items (group: ${baseCode})`);
    }

    // Формируем и отправляем уведомление в Telegram для всех заказов
    const telegramMessage = formatOrderNotification(orders[0], user.email, cart);
    const telegramSent = await sendTelegramNotification(telegramMessage);

    if (telegramSent) {
      console.log('Telegram notification sent successfully');
    } else {
      console.warn('Telegram notification failed, but order was created');
    }

    // Помечаем купон как использованный, если он был применён
    if (couponCode) {
      try {
        await markCouponAsUsed(couponCode);
        console.log(`✅ Coupon ${couponCode} marked as used`);
      } catch (error) {
        console.error('Error marking coupon as used:', error);
        // Не падаем, если не удалось пометить купон
      }
    }

    res.status(200).json({
      success: true,
      orderIds: orders.map(o => o.id),
      telegramSent: telegramSent,
      newBalance: dbUser.balance - total
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}