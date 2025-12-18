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

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id } = req.query;

    // Get package with additional shipping cost
    const pkg = await prisma.package.findUnique({
      where: { id: id as string },
      include: {
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

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Verify package belongs to user
    if (pkg.userId !== dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already paid
    if (pkg.additionalShippingPaid) {
      return res.status(400).json({ error: 'Additional shipping already paid' });
    }

    // Check if there's an additional cost to pay
    if (!pkg.additionalShippingCost || pkg.additionalShippingCost <= 0) {
      return res.status(400).json({ error: 'No additional shipping cost to pay' });
    }

    // Check user balance
    if (dbUser.balance < pkg.additionalShippingCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update user balance and package status in a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct from user balance
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          balance: dbUser.balance - pkg.additionalShippingCost
        }
      });

      // Mark additional shipping as paid
      await tx.package.update({
        where: { id: id as string },
        data: {
          additionalShippingPaid: true
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: dbUser.id,
          amount: -pkg.additionalShippingCost,
          type: 'additional_shipping',
          status: 'completed',
          description: `Additional shipping payment for package ${pkg.orderItem.order.orderNumber || pkg.id}`
        }
      });

      // Create notification for user
      await tx.notification.create({
        data: {
          userId: dbUser.id,
          type: 'payment_success',
          title: 'Additional Shipping Paid',
          message: `You have successfully paid ¥${pkg.additionalShippingCost.toLocaleString()} for additional shipping. Admin will proceed with shipment.`,
          read: false
        }
      });

      // Create notification for admin (all admins)
      const admins = await tx.user.findMany({
        where: { isAdmin: true }
      });

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            type: 'additional_shipping_paid',
            title: 'Additional Shipping Paid',
            message: `Customer has paid ¥${pkg.additionalShippingCost.toLocaleString()} for additional shipping on package ${pkg.orderItem.order.orderNumber || pkg.id}. You can now confirm shipment.`,
            read: false
          }
        });
      }
    });

    res.status(200).json({ success: true, message: 'Additional shipping paid successfully' });

  } catch (error) {
    console.error('Error paying additional shipping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
