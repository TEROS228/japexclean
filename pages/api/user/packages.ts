import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';
import { calculateStorageInfo } from '../../../lib/storage-calculator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Отключаем кеширование
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Получаем все посылки пользователя (кроме объединенных в другие и утилизированных)
    const packages = await prisma.package.findMany({
      where: {
        userId: dbUser.id,
        status: { not: 'consolidated' }, // Скрываем пакеты, которые были объединены
        disposed: false // Скрываем утилизированные пакеты
      },
      include: {
        orderItem: {
          include: {
            order: true // Включаем Order чтобы получить addressId заказа
          }
        },
        shippingAddress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Для каждого consolidated пакета получаем объединенные в него пакеты
    // И добавляем информацию о хранении
    const packagesWithConsolidated = await Promise.all(
      packages.map(async (pkg) => {
        let consolidatedPackages: any[] = [];

        if (pkg.consolidated) {
          // Обычная консолидация - получаем пакеты объединенные в этот
          consolidatedPackages = await prisma.package.findMany({
            where: {
              consolidatedInto: pkg.id
            },
            include: {
              orderItem: true
            }
          });
        }

        // Для автоконсолидированных посылок получаем оригинальные OrderItems
        let originalItems: any[] = [];
        if (pkg.autoConsolidated && pkg.originalOrderItemIds) {
          try {
            const originalItemIds = JSON.parse(pkg.originalOrderItemIds);
            originalItems = await prisma.orderItem.findMany({
              where: {
                id: { in: originalItemIds }
              }
            });
          } catch (e) {
            console.error('Error parsing originalOrderItemIds:', e);
          }
        }

        // Рассчитываем информацию о хранении
        const storageInfo = calculateStorageInfo(pkg.arrivedAt, pkg.lastStoragePayment);

        return {
          ...pkg,
          consolidatedPackages,
          originalItems, // Добавляем оригинальные items для автоконсолидированных посылок
          storageInfo
        };
      })
    );

    res.status(200).json({ packages: packagesWithConsolidated });

  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
