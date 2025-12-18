import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

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
      },
      include: {
        orderItem: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Проверяем, что есть стоимость domestic shipping
    if (pkg.domesticShippingCost === 0) {
      return res.status(400).json({ error: 'No domestic shipping cost for this package' });
    }

    // Проверяем, что еще не оплачено
    if (pkg.domesticShippingPaid) {
      return res.status(400).json({ error: 'Domestic shipping already paid' });
    }

    // Если есть sharedDomesticShippingGroup, получаем все пакеты в группе
    let groupPackages = [pkg];
    let groupCount = 1;

    if (pkg.sharedDomesticShippingGroup) {
      groupPackages = await prisma.package.findMany({
        where: {
          sharedDomesticShippingGroup: pkg.sharedDomesticShippingGroup,
          userId: dbUser.id
        },
        include: {
          orderItem: true
        }
      });
      groupCount = groupPackages.length;

      // Проверяем, что никто в группе еще не оплатил
      const anyPaid = groupPackages.some(p => p.domesticShippingPaid);
      if (anyPaid) {
        return res.status(400).json({ error: 'Domestic shipping already paid for this group' });
      }
    }

    // Проверяем баланс (платим только один раз за группу)
    if (dbUser.balance < pkg.domesticShippingCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Списываем стоимость (один раз)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { balance: { decrement: pkg.domesticShippingCost } }
    });

    // Создаем транзакцию
    const transactionDescription = pkg.sharedDomesticShippingGroup
      ? `Domestic shipping for ${groupCount} packages (shared group)`
      : `Domestic shipping for "${pkg.orderItem.title}"`;

    await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        amount: -pkg.domesticShippingCost,
        type: 'shipping',
        status: 'completed',
        description: transactionDescription
      }
    });

    // Обновляем статус оплаты для всех пакетов в группе
    await prisma.package.updateMany({
      where: {
        id: { in: groupPackages.map(p => p.id) }
      },
      data: { domesticShippingPaid: true }
    });

    const updatedPackage = await prisma.package.findUnique({
      where: { id: id as string },
      include: { orderItem: true }
    });

    // Создаем уведомление для пользователя
    const notificationMessage = pkg.sharedDomesticShippingGroup
      ? `Domestic shipping (¥${pkg.domesticShippingCost}) has been paid for ${groupCount} packages in shared group. You can now select services or request shipping for all of them.`
      : `Domestic shipping (¥${pkg.domesticShippingCost}) has been paid for "${pkg.orderItem.title}". You can now select services or request shipping.`;

    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'payment',
        title: '✅ Domestic Shipping Paid',
        message: notificationMessage
      }
    });

    res.status(200).json({
      success: true,
      message: 'Domestic shipping paid successfully',
      package: updatedPackage
    });

  } catch (error: any) {
    console.error('Error paying domestic shipping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
