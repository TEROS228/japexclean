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
    // Find user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all damaged requests for this user
    const requests = await prisma.damagedItemRequest.findMany({
      where: {
        userId: dbUser.id
      },
      select: {
        id: true,
        packageId: true,
        status: true,
        adminNotes: true,
        refundRequested: true,
        refundMethod: true,
        refundProcessed: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching damaged requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
