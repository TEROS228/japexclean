import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

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

    // Получаем все заказы пользователя с товарами и их пакетами
    const orders = await prisma.order.findMany({
      where: {
        userId: dbUser.id
      },
      include: {
        items: {
          include: {
            package: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ orders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
