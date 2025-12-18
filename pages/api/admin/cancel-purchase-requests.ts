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

    // Получаем все посылки с запросом на отмену покупки (кроме approved и rejected)
    const packages = await prisma.package.findMany({
      where: {
        cancelPurchase: true,
        cancelPurchaseStatus: {
          in: ['pending', 'awaiting_payment', 'paid']
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
            marketplace: true,
            itemUrl: true,
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

    res.status(200).json({ packages });

  } catch (error) {
    console.error('Error fetching cancel purchase requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
