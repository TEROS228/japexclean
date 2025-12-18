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
    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, что пользователь админ
    if (!dbUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    // Получаем все автоконсолидированные packages в статусе ready
    const packages = await prisma.package.findMany({
      where: {
        autoConsolidated: true,
        status: 'ready'
      },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    addresses: {
                      orderBy: {
                        updatedAt: 'desc'
                      },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Добавляем информацию о стране доставки
    const packagesWithDetails = packages.map(pkg => {
      const shippingCountry = pkg.orderItem.order.shippingCountry || 'Unknown';
      const userAddress = pkg.orderItem.order.user.addresses?.[0];

      // Для некоторых стран EMS недоступен - используем FedEx
      const emsRestrictedCountries = ['united states', 'usa', 'us', 'iceland', 'serbia', 'moldova', 'georgia'];
      const countryLower = shippingCountry.toLowerCase();
      const isEMSRestricted = emsRestrictedCountries.some(restricted => countryLower.includes(restricted));

      return {
        ...pkg,
        shippingCountry,
        recommendedShippingMethod: isEMSRestricted ? 'fedex' : 'ems',
        isUSA: countryLower.includes('united states') || countryLower.includes('usa') || countryLower === 'us'
      };
    });

    res.status(200).json({ packages: packagesWithDetails });

  } catch (error) {
    console.error('Error fetching warehouse packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
