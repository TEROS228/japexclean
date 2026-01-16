import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const userFromToken = verifyToken(token);

  if (!userFromToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userFromToken.email }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    console.log(`[Coupons API] Fetching coupons for user ${user.id} (${user.email})`);

    // Получить все купоны пользователя
    const coupons = await prisma.coupon.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[Coupons API] Found ${coupons.length} coupons`);

    // Обновляем статус истекших купонов
    const now = new Date();
    for (const coupon of coupons) {
      if (coupon.status === 'active' && coupon.expiresAt < now) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { status: 'expired' }
        });
      }
    }

    // Получаем обновленные купоны
    const updatedCoupons = await prisma.coupon.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[Coupons API] Returning ${updatedCoupons.length} coupons`);
    return res.status(200).json({ coupons: updatedCoupons });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
