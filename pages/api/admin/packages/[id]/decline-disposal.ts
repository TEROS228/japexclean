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
  const { reason } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Decline reason is required' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Получаем пакет
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

    // Возвращаем деньги пользователю (disposal cost)
    if (pkg.disposalCost) {
      await prisma.user.update({
        where: { id: pkg.userId },
        data: { balance: { increment: pkg.disposalCost } }
      });

      // Создаем транзакцию возврата
      await prisma.transaction.create({
        data: {
          userId: pkg.userId,
          amount: pkg.disposalCost,
          type: 'refund',
          status: 'completed',
          description: `Disposal request declined - refund of ¥${pkg.disposalCost}`
        }
      });
    }

    // Обновляем пакет - отменяем disposal request и сохраняем причину
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        disposalRequested: false,
        disposalCost: null,
        disposalDeclineReason: reason
      },
      include: {
        orderItem: true,
        user: true
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'disposal_declined',
        title: '❌ Disposal Request Declined',
        message: `Your disposal request for "${pkg.orderItem.title}" has been declined. Reason: ${reason}. Your payment of ¥${pkg.disposalCost || 0} has been refunded.`
      }
    });

    // Отправляем уведомление в Telegram
    const telegramMessage = `
❌ <b>DISPOSAL REQUEST DECLINED</b>

👤 <b>User:</b> ${pkg.user.email}
📦 <b>Package:</b> ${pkg.orderItem.title}
💰 <b>Refunded:</b> ¥${pkg.disposalCost || 0}

<b>Decline Reason:</b>
${reason}
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({
      success: true,
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error declining disposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
