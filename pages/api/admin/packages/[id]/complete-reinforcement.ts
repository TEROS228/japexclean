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

    // Обновляем статус укрепления на completed
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        reinforcementStatus: 'completed'
      },
      include: {
        orderItem: true
      }
    });

    // Уведомляем пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'reinforcement_completed',
        title: '📦 Package Reinforcement Completed!',
        message: 'Your package has been reinforced with strengthened corners and bubble wrap. It\'s ready for shipping!'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reinforcement completed successfully',
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error completing reinforcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
