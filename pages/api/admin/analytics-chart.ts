import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    const { days = '30' } = req.query;
    const numDays = parseInt(days as string);

    // Generate dates for the last N days
    const chartData = [];
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get visits for this day
      const visits = await prisma.visit.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      // Get orders (people bought) for this day
      const ordersData = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        select: {
          total: true,
        },
      });

      const ordersCount = ordersData.length;
      const revenue = ordersData.reduce((sum, order) => sum + order.total, 0);

      chartData.push({
        date: date.toISOString().split('T')[0],
        visits,
        bought: ordersCount,
        revenue: Math.round(revenue),
      });
    }

    return res.status(200).json({ data: chartData });
  } catch (error) {
    console.error('Analytics chart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
