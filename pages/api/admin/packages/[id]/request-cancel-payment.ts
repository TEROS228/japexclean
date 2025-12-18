import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';
import { sendTelegramNotification } from '../../../../../lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    // Обновляем статус на awaiting_payment
    await prisma.package.update({
      where: { id: id as string },
      data: {
        cancelPurchaseStatus: 'awaiting_payment'
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'cancel_purchase_payment_required',
        title: '💳 Payment Required for Cancellation',
        message: `The seller agreed to cancel your purchase. Please pay ¥900 cancellation fee to proceed.`
      }
    });

    // Отправляем уведомление в Telegram
    const telegramMessage = `
💳 <b>CANCELLATION PAYMENT REQUESTED</b>

👤 <b>User:</b> ${pkg.user.email}
📦 <b>Product:</b> ${pkg.orderItem.title}
💰 <b>Fee:</b> ¥900

<i>User has been notified to pay the cancellation fee.</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error requesting cancel payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
