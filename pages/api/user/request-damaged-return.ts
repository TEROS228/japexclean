import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const { packageId, description } = req.body;

    if (!packageId || !description) {
      return res.status(400).json({ error: 'Package ID and description are required' });
    }

    // Find user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify package belongs to user
    const pkg = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: dbUser.id
      },
      include: {
        orderItem: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Check if photo service was completed
    if (pkg.photoServiceStatus !== 'completed') {
      return res.status(400).json({ error: 'Photo service must be completed before reporting damage' });
    }

    // Check if package has photos from photo service
    if (!pkg.photos) {
      return res.status(400).json({ error: 'No photos available from photo service' });
    }

    // Check if there's already a damaged item request for this package
    const existingRequest = await prisma.damagedItemRequest.findFirst({
      where: {
        packageId: pkg.id
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'A damage report has already been submitted for this item' });
    }

    // Use existing photos from photo service
    const photoUrls = pkg.photos;

    // Create damaged item request
    const damagedRequest = await prisma.damagedItemRequest.create({
      data: {
        userId: dbUser.id,
        packageId: pkg.id,
        description,
        photos: photoUrls, // Use photos from package photo service
        status: 'pending'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Damage report submitted successfully. Our team will review it shortly.',
      requestId: damagedRequest.id
    });

  } catch (error) {
    console.error('Error processing damaged item request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
