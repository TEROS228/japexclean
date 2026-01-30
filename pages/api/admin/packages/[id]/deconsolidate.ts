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

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Получаем консолидированный package
    const consolidatedPackage = await prisma.package.findUnique({
      where: { id: id as string },
      include: {
        orderItem: true,
        user: true
      }
    });

    if (!consolidatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (!consolidatedPackage.autoConsolidated) {
      return res.status(400).json({ error: 'This package is not auto-consolidated' });
    }

    // Получаем ID оригинальных OrderItems
    let originalItemIds: string[] = [];
    try {
      originalItemIds = JSON.parse(consolidatedPackage.originalOrderItemIds || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid originalOrderItemIds data' });
    }

    if (originalItemIds.length === 0) {
      return res.status(400).json({ error: 'No original items found' });
    }

    // Получаем оригинальные OrderItems
    const originalItems = await prisma.orderItem.findMany({
      where: {
        id: { in: originalItemIds }
      }
    });

    if (originalItems.length === 0) {
      return res.status(404).json({ error: 'Original order items not found' });
    }

    
    // Создаем отдельный package для каждого оригинального item
    const newPackages = [];
    for (const item of originalItems) {
      const newPackage = await prisma.package.create({
        data: {
          userId: consolidatedPackage.userId,
          orderItemId: item.id,
          trackingNumber: consolidatedPackage.trackingNumber,
          weight: consolidatedPackage.weight ? consolidatedPackage.weight / originalItems.length : null,
          shippingCost: Math.round((consolidatedPackage.shippingCost || 0) / originalItems.length),
          domesticShippingCost: item.domesticShippingCost || 0,
          domesticShippingPaid: false,
          notes: `Deconsolidated from package ${consolidatedPackage.id.slice(0, 8)}`,
          shippingMethod: consolidatedPackage.shippingMethod,
          packagePhoto: consolidatedPackage.packagePhoto,
          status: 'ready'
        }
      });

      newPackages.push(newPackage);
    }

    // Удаляем dummy OrderItem
    await prisma.orderItem.delete({
      where: { id: consolidatedPackage.orderItemId }
    });

    // Удаляем консолидированный package (каскадно удалится через onDelete)
    await prisma.package.delete({
      where: { id: id as string }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: consolidatedPackage.userId,
        type: 'package_update',
        title: '📦 Package Deconsolidated',
        message: `Your consolidated package has been separated into ${newPackages.length} individual packages by admin.`,
        read: false
      }
    });

    res.status(200).json({
      success: true,
      message: `Package deconsolidated into ${newPackages.length} separate packages`,
      newPackages: newPackages.map(p => p.id)
    });

  } catch (error) {
    console.error('Error deconsolidating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
