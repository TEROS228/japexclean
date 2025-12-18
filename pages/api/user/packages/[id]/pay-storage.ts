import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';
import { calculateStorageInfo } from '../../../../../lib/storage-calculator';

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

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем посылку
    const pkg = await prisma.package.findUnique({
      where: {
        id: id as string,
        userId: dbUser.id
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Проверяем что посылка еще на складе
    if (pkg.status !== 'ready') {
      return res.status(400).json({ error: 'Package is not in warehouse' });
    }

    // Рассчитываем текущие сборы за хранение
    const storageInfo = calculateStorageInfo(pkg.arrivedAt, pkg.lastStoragePayment);

    // Если хранение бесплатное или нет неоплаченных дней
    if (storageInfo.currentFee === 0) {
      return res.status(400).json({ error: 'No storage fees to pay' });
    }

    // Если срок хранения истек (10 дней без оплаты) - нельзя оплатить
    if (storageInfo.isExpired) {
      return res.status(400).json({ error: 'Storage period expired (10 days without payment). Package will be disposed.' });
    }

    // Проверяем баланс
    if (dbUser.balance < storageInfo.currentFee) {
      return res.status(400).json({
        error: 'Insufficient balance',
        required: storageInfo.currentFee,
        current: dbUser.balance
      });
    }

    // Списываем деньги
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { balance: { decrement: storageInfo.currentFee } }
    });

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        amount: -storageInfo.currentFee,
        type: 'storage',
        status: 'completed',
        description: `Storage fees: ${storageInfo.unpaidDays} days × ¥30`
      }
    });

    // Обновляем посылку - устанавливаем дату последней оплаты на СЕЙЧАС
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        lastStoragePayment: new Date(), // Обнуляем счетчик неоплаченных дней
        storageFeesAmount: { increment: storageInfo.currentFee }, // Добавляем к общей сумме
        lastStorageFeeCheck: new Date()
      }
    });

    // Создаем уведомление
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'storage_paid',
        title: '✅ Storage Fees Paid',
        message: `You paid ¥${storageInfo.currentFee} for ${storageInfo.unpaidDays} days of storage. You can now request shipping or continue storing for ¥30/day.`
      }
    });

    console.log(`[Storage] User ${dbUser.email} paid ¥${storageInfo.currentFee} for package ${id}`);

    return res.status(200).json({
      success: true,
      package: updatedPackage,
      paid: storageInfo.currentFee
    });

  } catch (error) {
    console.error('Error paying storage fees:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
