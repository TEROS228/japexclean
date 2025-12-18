import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { itemId } = req.query;
    const { domesticShippingCost } = req.body;

    if (typeof domesticShippingCost !== 'number' || domesticShippingCost < 0) {
      return res.status(400).json({ error: 'Invalid domestic shipping cost' });
    }

    // Обновляем domesticShippingCost в OrderItem
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId as string },
      data: {
        domesticShippingCost
      }
    });

    res.status(200).json({ success: true, item: updatedItem });

  } catch (error) {
    console.error('Error updating domestic shipping cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
