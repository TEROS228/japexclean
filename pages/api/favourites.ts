import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      where: { email: user.email },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      // Get all favourites for user
      const favourites = await prisma.favourite.findMany({
        where: { userId: dbUser.id },
        orderBy: { addedAt: 'desc' },
      });

      return res.status(200).json({ favourites });
    }

    if (req.method === 'POST') {
      // Add to favourites
      const { itemCode, itemName, itemPrice, itemUrl, imageUrl, _source } = req.body;

      if (!itemCode || !itemName || itemPrice === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if already exists
      const existing = await prisma.favourite.findFirst({
        where: {
          userId: dbUser.id,
          itemCode,
        },
      });

      if (existing) {
        return res.status(200).json({ favourite: existing });
      }

      // Create new favourite
      const favourite = await prisma.favourite.create({
        data: {
          userId: dbUser.id,
          itemCode,
          itemName,
          itemPrice,
          itemUrl,
          imageUrl,
          source: _source || 'rakuten',
        },
      });

      return res.status(201).json({ favourite });
    }

    if (req.method === 'DELETE') {
      // Remove from favourites
      const { itemCode } = req.query;

      if (!itemCode || typeof itemCode !== 'string') {
        return res.status(400).json({ error: 'Item code required' });
      }

      await prisma.favourite.deleteMany({
        where: {
          userId: dbUser.id,
          itemCode,
        },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Favourites API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
