import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

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
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.query;
    const { additionalShippingCost, additionalShippingReason } = req.body;

    if (!additionalShippingCost || additionalShippingCost <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    if (!additionalShippingReason || additionalShippingReason.trim() === '') {
      return res.status(400).json({ error: 'Reason required' });
    }

    // Update package with additional shipping costs
    const pkg = await prisma.package.update({
      where: { id: id as string },
      data: {
        additionalShippingCost: Number(additionalShippingCost),
        additionalShippingReason,
        additionalShippingPaid: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        orderItem: {
          select: {
            title: true,
            order: {
              select: {
                orderNumber: true
              }
            }
          }
        }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: pkg.userId,
        type: 'additional_shipping_cost',
        title: 'Additional Shipping Cost Required',
        message: `Additional shipping cost of ¥${additionalShippingCost.toLocaleString()} is required for your package. Reason: ${additionalShippingReason}`,
        read: false
      }
    });

    res.status(200).json({ success: true, package: pkg });

  } catch (error) {
    console.error('Error charging additional shipping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
