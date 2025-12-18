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

    // Получаем посылку
    const pkg = await prisma.package.findUnique({
      where: { id: id as string }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.userId !== dbUser.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (pkg.disposalRequested) {
      return res.status(400).json({ error: 'Disposal already requested' });
    }

    if (pkg.disposed) {
      return res.status(400).json({ error: 'Package already disposed' });
    }

    if (!pkg.weight) {
      return res.status(400).json({ error: 'Package weight not set. Please contact admin.' });
    }

    // Рассчитываем стоимость утилизации: ¥300 за 1кг = ¥30 за 100г = ¥0.3 за 1г
    // weight в килограммах, умножаем на 300
    const disposalCost = Math.ceil(pkg.weight * 300);

    // Проверяем баланс
    if (dbUser.balance < disposalCost) {
      return res.status(400).json({
        error: 'Insufficient balance',
        required: disposalCost,
        current: dbUser.balance
      });
    }

    // Списываем с баланса
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        balance: dbUser.balance - disposalCost
      }
    });

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        amount: -disposalCost,
        type: 'disposal',
        status: 'completed',
        description: `Disposal service for package ${pkg.id}`
      }
    });

    // Обновляем посылку
    const updatedPackage = await prisma.package.update({
      where: { id: pkg.id },
      data: {
        disposalRequested: true,
        disposalCost: disposalCost
      },
      include: {
        orderItem: true
      }
    });

    // Создаем уведомление
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'disposal_requested',
        title: '♻️ Disposal requested',
        message: `Disposal service requested for your package. Cost: ¥${disposalCost}`
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
          type: 'disposal_request',
          title: '♻️ New Disposal Request',
          message: `${dbUser.email} requested disposal for package. Cost: ¥${disposalCost}`
        }
      });
    }

    // Отправляем уведомление в Telegram
    const telegramMessage = `
♻️ <b>NEW DISPOSAL REQUEST</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Package:</b> ${updatedPackage.orderItem.title}
⚖️ <b>Weight:</b> ${pkg.weight}kg
💰 <b>Cost:</b> ¥${disposalCost} (charged)

<i>Please dispose of this package.</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({
      success: true,
      disposalCost,
      newBalance: dbUser.balance - disposalCost,
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error requesting disposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
