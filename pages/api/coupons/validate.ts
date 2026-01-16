import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';
import { validateAndApplyCoupon } from '@/lib/coupons';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { couponCode, orderTotal } = req.body;

  if (!couponCode || typeof orderTotal !== 'number') {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const result = await validateAndApplyCoupon(couponCode, user.id, orderTotal);

    if (result.valid) {
      return res.status(200).json({
        valid: true,
        discount: result.discount,
        message: result.message,
        newTotal: orderTotal - result.discount
      });
    } else {
      return res.status(400).json({
        valid: false,
        discount: 0,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
