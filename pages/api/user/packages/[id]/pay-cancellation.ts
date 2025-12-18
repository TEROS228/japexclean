import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';
import { sendTelegramNotification } from '../../../../../lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Отключаем кеширование
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

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

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем баланс
    if (dbUser.balance < 900) {
      return res.status(400).json({ error: 'Insufficient balance. You need ¥900.' });
    }

    // Получаем посылку
    const pkg = await prisma.package.findUnique({
      where: {
        id: id as string,
        userId: dbUser.id
      },
      include: {
        orderItem: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.cancelPurchaseStatus !== 'awaiting_payment') {
      return res.status(400).json({ error: 'Payment not required for this package' });
    }

    // Списываем 900 иен
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { balance: { decrement: 900 } }
    });

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        amount: -900,
        type: 'service',
        status: 'completed',
        description: 'Purchase cancellation fee'
      }
    });

    // Обновляем статус посылки
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        cancelPurchaseStatus: 'paid',
        cancelPurchasePaid: true
      },
      include: {
        orderItem: true
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
          type: 'cancel_purchase_paid',
          title: '✅ Cancellation Fee Paid',
          message: `${dbUser.email} paid ¥900 cancellation fee. You can now proceed with cancellation.`
        }
      });
    }

    // Уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'cancel_purchase_payment_confirmed',
        title: '✅ Payment Confirmed',
        message: 'Your cancellation fee (¥900) has been paid. We will complete the cancellation process.'
      }
    });

    // Отправляем уведомление в Telegram
    const telegramMessage = `
✅ <b>CANCELLATION FEE PAID</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Product:</b> ${pkg.orderItem.title}
💰 <b>Paid:</b> ¥900
📋 <b>Order:</b> #${pkg.orderItem.orderId.slice(0, 8)}

<i>User has paid the cancellation fee. Please complete cancellation with seller.</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({
      success: true,
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error processing cancellation payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
