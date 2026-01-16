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
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        adminPermissions: true,
      }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    // Parse permissions
    let permissions = {};
    if (dbUser.adminPermissions) {
      try {
        permissions = JSON.parse(dbUser.adminPermissions);
      } catch (error) {
        permissions = {};
      }
    }

    return res.status(200).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isAdmin: dbUser.isAdmin,
        adminPermissions: dbUser.adminPermissions,
        permissions,
      }
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
