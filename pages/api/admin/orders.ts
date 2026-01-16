import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';
import { createRewardCoupon } from '../../../lib/coupons';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // GET - получить все заказы
    if (req.method === 'GET') {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          items: {
            include: {
              package: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Парсим JSON options для каждого item
      const ordersWithParsedOptions = orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          options: item.options ? JSON.parse(item.options as string) : {}
        }))
      }));

      return res.status(200).json({ orders: ordersWithParsedOptions });
    }

    // PUT - подтвердить заказ
    if (req.method === 'PUT') {
      const { orderId } = req.query;

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { confirmed: true },
        include: {
          items: true
        }
      });

      // Считаем сумму ТОЛЬКО товаров (без комиссии)
      const itemsTotal = updatedOrder.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Если товары на сумму >= 5000 иен (без учёта комиссии), создаем купон на скидку 800 иен
      if (itemsTotal >= 5000) {
        try {
          const coupon = await createRewardCoupon(updatedOrder.userId);

          // Создаем уведомление о новом купоне
          await prisma.notification.create({
            data: {
              userId: updatedOrder.userId,
              type: 'coupon_reward',
              title: 'New Coupon Available!',
              message: `Congratulations! You've earned a ¥800 discount coupon for your order over ¥5,000. Use code ${coupon.code} on your next purchase.`,
              read: false
            }
          });

          console.log(`✅ Created reward coupon ${coupon.code} for user ${updatedOrder.userId} (items total: ¥${itemsTotal})`);
        } catch (error) {
          console.error('Error creating reward coupon:', error);
          // Не падаем, даже если купон не создался
        }
      }

      return res.status(200).json({ success: true, order: updatedOrder });
    }

    // DELETE - удалить заказ
    if (req.method === 'DELETE') {
      const { orderId } = req.query;

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Сначала удаляем все order items
      await prisma.orderItem.deleteMany({
        where: { orderId }
      });

      // Затем удаляем сам заказ
      await prisma.order.delete({
        where: { id: orderId }
      });

      return res.status(200).json({ success: true, message: 'Order deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in admin orders API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
