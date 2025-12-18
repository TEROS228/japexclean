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
  const { trackingNumber } = req.body;

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

    // Обновляем статус на shipped и добавляем трекинг номер если есть
    await prisma.package.update({
      where: { id: id as string },
      data: {
        status: 'shipped',
        shippedAt: new Date(),
        shippingRequested: false, // Сбрасываем флаг запроса
        ...(trackingNumber && { trackingNumber })
      }
    });

    // Если это консолидированная посылка, обновляем статус всех включенных в нее пакетов
    if (pkg.consolidated) {
      await prisma.package.updateMany({
        where: {
          consolidatedInto: id as string
        },
        data: {
          status: 'shipped',
          shippedAt: new Date(),
          shippingRequested: false,
          ...(trackingNumber && { trackingNumber })
        }
      });
    }

    // Уведомляем пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'package_shipped',
        title: '🚀 Your package has been shipped!',
        message: trackingNumber
          ? `Your package "${pkg.orderItem.title}" has been shipped! Tracking: ${trackingNumber}`
          : `Your package "${pkg.orderItem.title}" has been shipped and is on its way to you!`
      }
    });

    // Отправляем уведомление в Telegram
    const telegramMessage = `
✅ <b>PACKAGE SHIPPED</b>

👤 <b>User:</b> ${pkg.user.email}
📦 <b>Package:</b> ${pkg.orderItem.title}
${trackingNumber ? `🔢 <b>Tracking:</b> <code>${trackingNumber}</code>` : ''}

<i>Package has been shipped successfully!</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({
      success: true,
      message: 'Package marked as shipped'
    });

  } catch (error) {
    console.error('Error marking package as shipped:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
