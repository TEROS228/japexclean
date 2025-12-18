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

    // Получаем все посылки где consolidation = true
    const packages = await prisma.package.findMany({
      where: {
        consolidation: true,
        status: {
          in: ['pending_shipping', 'ready'] // Показываем как новые запросы, так и готовые
        }
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
            title: true,
            image: true,
            quantity: true,
            orderId: true,
            order: {
              select: {
                orderNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Для каждой посылки получаем связанные посылки
    const packagesWithRelated = await Promise.all(
      packages.map(async (pkg) => {
        let consolidateWithIds: string[] = [];
        if (pkg.consolidateWith) {
          try {
            consolidateWithIds = JSON.parse(pkg.consolidateWith);
          } catch (e) {
            console.error('Error parsing consolidateWith:', e);
          }
        }

        const relatedPackages = await prisma.package.findMany({
          where: {
            id: {
              in: consolidateWithIds
            }
          },
          include: {
            orderItem: {
              select: {
                title: true,
                image: true,
                quantity: true,
                orderId: true,
                order: {
                  select: {
                    orderNumber: true
                  }
                }
              }
            }
          }
        });

        return {
          ...pkg,
          consolidateWithPackages: relatedPackages
        };
      })
    );

    // Фильтруем пакеты - показываем только те, где выбраны пакеты для консолидации
    const validPackages = packagesWithRelated.filter(pkg => {
      if (!pkg.consolidateWith) return false;
      try {
        const ids = JSON.parse(pkg.consolidateWith);
        return Array.isArray(ids) && ids.length > 0;
      } catch {
        return false;
      }
    });

    res.status(200).json({ packages: validPackages });

  } catch (error) {
    console.error('Error fetching consolidation requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
