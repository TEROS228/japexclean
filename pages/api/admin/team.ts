import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // GET - Get all admin users
    if (req.method === 'GET') {
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true },
        select: {
          id: true,
          email: true,
          name: true,
          secondName: true,
          adminPermissions: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ admins: adminUsers });
    }

    // POST - Add new admin
    if (req.method === 'POST') {
      const { email, permissions } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found. They must register first.' });
      }

      if (targetUser.isAdmin) {
        return res.status(400).json({ error: 'User is already an admin' });
      }

      // Update user to admin with permissions
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          adminPermissions: JSON.stringify(permissions || {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          secondName: true,
          adminPermissions: true,
        },
      });

      return res.status(200).json({ admin: updatedUser });
    }

    // PATCH - Update admin permissions
    if (req.method === 'PATCH') {
      const { userId, permissions } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          adminPermissions: JSON.stringify(permissions || {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          secondName: true,
          adminPermissions: true,
        },
      });

      return res.status(200).json({ admin: updatedUser });
    }

    // DELETE - Remove admin access
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Prevent removing yourself
      if (userId === dbUser.id) {
        return res.status(400).json({ error: 'Cannot remove your own admin access' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isAdmin: false,
          adminPermissions: null,
        },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Team management error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
