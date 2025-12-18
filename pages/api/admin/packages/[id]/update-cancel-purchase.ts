import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  const { status, refundAmount } = req.body; // 'approved' or 'rejected', refundAmount for approved

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

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Получаем посылку
    const pkg = await prisma.package.findUnique({
      where: { id: id as string },
      include: {
        user: true,
        orderItem: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Если отмена одобрена и есть сумма возврата, создаем транзакцию возврата
    if (status === 'approved' && refundAmount && refundAmount > 0) {
      // Создаем транзакцию возврата
      await prisma.transaction.create({
        data: {
          userId: pkg.userId,
          amount: refundAmount,
          type: 'refund',
          status: 'completed',
          description: `Refund for cancelled purchase: ${pkg.orderItem.title}`
        }
      });

      // Обновляем баланс пользователя
      await prisma.user.update({
        where: { id: pkg.userId },
        data: {
          balance: {
            increment: refundAmount
          }
        }
      });

      // Удаляем пакет из базы данных
      await prisma.package.delete({
        where: { id: id as string }
      });

      // Создаем уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: pkg.userId,
          type: 'cancel_purchase_approved',
          title: '✅ Cancellation Completed',
          message: `✅ Your purchase cancellation has been completed. ¥${refundAmount} has been refunded to your balance. The package has been removed.`
        }
      });
    } else if (status === 'rejected') {
      // Обновляем статус отмены покупки на rejected
      await prisma.package.update({
        where: { id: id as string },
        data: {
          cancelPurchaseStatus: status
        }
      });

      // Создаем уведомление для пользователя
      await prisma.notification.create({
        data: {
          userId: pkg.userId,
          type: 'cancel_purchase_rejected',
          title: '❌ Cancellation Rejected',
          message: '❌ Your purchase cancellation request was rejected by the seller.'
        }
      });
    } else {
      // Обновляем статус отмены покупки
      await prisma.package.update({
        where: { id: id as string },
        data: {
          cancelPurchaseStatus: status
        }
      });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error updating cancel purchase status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
