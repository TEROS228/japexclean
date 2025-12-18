import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Получаем все посылки с запрошенной доставкой (без активных сервисов в обработке)
    const allPackages = await prisma.package.findMany({
      where: {
        shippingRequested: true,
        // Нет активной фото услуги в обработке
        OR: [
          { photoService: false },
          { photoServiceStatus: { not: 'pending' } }
        ],
        // Нет активной консолидации
        consolidation: false
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        orderItem: {
          select: {
            orderId: true,
            title: true,
            image: true,
            quantity: true,
            price: true,
            marketplace: true,
            itemUrl: true,
            order: {
              select: {
                orderNumber: true
              }
            }
          }
        },
        shippingAddress: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Для консолидированных пакетов получаем объединенные товары
    const packagesWithConsolidated = await Promise.all(
      allPackages.map(async (pkg) => {
        if (pkg.consolidated) {
          const consolidatedPackages = await prisma.package.findMany({
            where: {
              consolidatedInto: pkg.id
            },
            include: {
              orderItem: {
                select: {
                  orderId: true,
                  title: true,
                  image: true,
                  quantity: true,
                  price: true,
                  marketplace: true,
                  itemUrl: true,
                  order: {
                    select: {
                      orderNumber: true
                    }
                  }
                }
              }
            }
          });
          return { ...pkg, consolidatedPackages };
        }
        return { ...pkg, consolidatedPackages: [] };
      })
    );

    // Фильтруем пакеты, которые не являются частью чужой консолидации
    const packagesInConsolidation = new Set<string>();

    // Собираем все ID пакетов, которые участвуют в консолидации
    for (const pkg of packagesWithConsolidated) {
      if (pkg.consolidateWith) {
        try {
          const ids = JSON.parse(pkg.consolidateWith);
          ids.forEach((id: string) => packagesInConsolidation.add(id));
        } catch (e) {
          // Игнорируем ошибки парсинга
        }
      }
    }

    // Исключаем пакеты, которые находятся в чужой консолидации
    const packages = packagesWithConsolidated.filter(pkg => !packagesInConsolidation.has(pkg.id));

    res.status(200).json({ packages });

  } catch (error) {
    console.error('Error fetching shipping requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
