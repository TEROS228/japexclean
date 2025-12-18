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

    // Получаем все order items из подтвержденных заказов, у которых еще нет package
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          confirmed: true
        },
        package: null
      },
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
            },
            items: {
              include: {
                package: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Фильтруем items: исключаем те, для которых уже создан автоконсолидированный package
    const filteredItems = items.filter(item => {
      // Проверяем, есть ли в этом Order автоконсолидированный package
      const hasAutoConsolidatedPackage = item.order.items.some(orderItem =>
        orderItem.package?.autoConsolidated === true
      );

      // Если есть автоконсолидированный package, исключаем этот item
      return !hasAutoConsolidatedPackage;
    });

    // Парсим JSON options и определяем метод доставки на основе страны
    const itemsWithDetails = filteredItems.map(item => {
      const shippingCountry = item.order.shippingCountry || 'Unknown';
      const userAddress = item.order.user.addresses?.[0];
      const shippingCity = userAddress?.city || 'Unknown';
      const shippingPostalCode = userAddress?.postalCode || '';

      // Определяем метод доставки на основе страны
      // Для некоторых стран EMS недоступен - используем FedEx
      const emsRestrictedCountries = ['united states', 'usa', 'us', 'iceland', 'serbia', 'moldova', 'georgia'];
      const countryLower = shippingCountry.toLowerCase();
      const isEMSRestricted = emsRestrictedCountries.some(restricted => countryLower.includes(restricted));

      // Определяем является ли страна США
      const usaCountries = ['united states', 'usa', 'us'];
      const isUSA = usaCountries.some(usa => countryLower.includes(usa));

      const recommendedShippingMethod = isEMSRestricted ? 'fedex' : 'ems';

      return {
        ...item,
        options: item.options ? JSON.parse(item.options as string) : {},
        shippingCountry: shippingCountry,
        shippingCity: shippingCity,
        shippingPostalCode: shippingPostalCode,
        recommendedShippingMethod: recommendedShippingMethod,
        isUSA: isUSA
      };
    });

    res.status(200).json({ items: itemsWithDetails });

  } catch (error) {
    console.error('Error fetching warehouse items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
