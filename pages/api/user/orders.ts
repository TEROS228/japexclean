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
  console.log('Orders API - Token received:', token ? 'YES' : 'NO');

  if (!token) {
    console.log('Orders API - No token provided');
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  console.log('Orders API - User from token:', user);

  if (!user) {
    console.log('Orders API - Invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    console.log('Fetching orders for user:', user.email);

    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    console.log('DB User found:', dbUser ? dbUser.id : 'NOT FOUND');

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

    console.log('Orders found:', orders.length);
    console.log('Orders data:', JSON.stringify(orders, null, 2));

    res.status(200).json({ orders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
