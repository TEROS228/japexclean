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
      where: { id: id as string }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Сбрасываем настройки консолидации
    await prisma.package.update({
      where: { id: id as string },
      data: {
        consolidation: false,
        consolidateWith: null
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'consolidation_cancelled',
        title: 'Consolidation request cancelled',
        message: 'Your consolidation request has been cancelled by admin. Your packages remain ready for individual shipping.'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Consolidation request cancelled'
    });

  } catch (error) {
    console.error('Error cancelling consolidation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
