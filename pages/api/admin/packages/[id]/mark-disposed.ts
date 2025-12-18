import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;

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

    // Получаем посылку
    const pkg = await prisma.package.findUnique({
      where: { id: id as string },
      include: {
        user: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (!pkg.disposalRequested) {
      return res.status(400).json({ error: 'Disposal not requested for this package' });
    }

    if (pkg.disposed) {
      return res.status(400).json({ error: 'Package already disposed' });
    }

    // Помечаем как утилизированный
    await prisma.package.update({
      where: { id: pkg.id },
      data: {
        disposed: true
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'package_disposed',
        title: '♻️ Package Disposed',
        message: `Your package has been disposed of as requested.`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Package marked as disposed'
    });

  } catch (error) {
    console.error('Error marking package as disposed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
