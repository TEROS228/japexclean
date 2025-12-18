import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  const { photos } = req.body;

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

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Photos array required' });
    }

    if (photos.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 photos allowed' });
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

    // Обновляем посылку с фотографиями и меняем статус на completed
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        photos: JSON.stringify(photos),
        photoServiceStatus: 'completed'
      },
      include: {
        orderItem: true
      }
    });

    // Уведомляем пользователя
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'photos_uploaded',
        title: '📸 Your package photos are ready!',
        message: `We've uploaded ${photos.length} photo(s) of your package. Check them out in your profile!`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
