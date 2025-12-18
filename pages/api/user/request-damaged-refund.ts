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
    const { damagedRequestId, refundMethod, paymentEmail, cardLast4 } = req.body;

    if (!damagedRequestId || !refundMethod) {
      return res.status(400).json({ error: 'Damaged request ID and refund method are required' });
    }

    // Find user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify damaged request belongs to user and is approved
    const damagedRequest = await prisma.damagedItemRequest.findFirst({
      where: {
        id: damagedRequestId,
        userId: dbUser.id
      },
      include: {
        package: {
          include: {
            orderItem: true
          }
        }
      }
    });

    if (!damagedRequest) {
      return res.status(404).json({ error: 'Damaged request not found' });
    }

    if (damagedRequest.status !== 'approved') {
      return res.status(400).json({ error: 'Damage report must be approved before requesting refund' });
    }

    if (damagedRequest.refundRequested) {
      return res.status(400).json({ error: 'Refund has already been requested for this item' });
    }

    // Validate payment details for non-balance and non-replace refunds
    if (refundMethod !== 'balance' && refundMethod !== 'replace') {
      if (!paymentEmail || !cardLast4) {
        return res.status(400).json({ error: 'Payment email and card last 4 digits are required' });
      }
      if (cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
        return res.status(400).json({ error: 'Card last 4 digits must be exactly 4 numbers' });
      }
    }

    // Update damaged request with refund information
    const updatedRequest = await prisma.damagedItemRequest.update({
      where: { id: damagedRequest.id },
      data: {
        refundRequested: true,
        refundMethod,
        refundEmail: refundMethod !== 'balance' && refundMethod !== 'replace' ? paymentEmail : null,
        refundCardLast4: refundMethod !== 'balance' && refundMethod !== 'replace' ? cardLast4 : null,
        // Auto-process balance and replace refunds
        refundProcessed: refundMethod === 'balance' || refundMethod === 'replace',
        updatedAt: new Date()
      }
    });

    // If balance refund, immediately add money to user account
    if (refundMethod === 'balance' && damagedRequest.package?.orderItem?.price) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          balance: {
            increment: damagedRequest.package.orderItem.price
          }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: dbUser.id,
          amount: damagedRequest.package.orderItem.price,
          type: 'refund',
          status: 'completed',
          description: `Refund for damaged item: ${damagedRequest.package.orderItem.title}`
        }
      });
    }

    // If replace, create a new order with the same item
    if (refundMethod === 'replace' && damagedRequest.package?.orderItem) {
      const originalItem = damagedRequest.package.orderItem;

      // First delete the damaged item request to avoid foreign key constraint
      await prisma.damagedItemRequest.delete({
        where: { id: damagedRequest.id }
      });

      // Get the orderItemId before deleting package
      const orderItemId = damagedRequest.package.orderItemId;

      // Delete the damaged package
      await prisma.package.delete({
        where: { id: damagedRequest.packageId }
      });

      // Delete the original order item to prevent it from appearing in warehouse
      await prisma.orderItem.delete({
        where: { id: orderItemId }
      });

      // Get the next order number
      const lastOrder = await prisma.order.findFirst({
        where: { orderNumber: { not: null } },
        orderBy: { orderNumber: 'desc' }
      });
      const nextOrderNumber = lastOrder?.orderNumber ? lastOrder.orderNumber + 1 : 1;

      // Create a new order
      const newOrder = await prisma.order.create({
        data: {
          userId: dbUser.id,
          orderNumber: nextOrderNumber,
          status: 'pending',
          total: 0,
          confirmed: false
        }
      });

      // Create new order item with same details
      const newOrderItem = await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          itemCode: originalItem.itemCode || 'REPLACEMENT',
          title: `[REPLACEMENT] ${originalItem.title}`,
          price: originalItem.price || 0,
          quantity: originalItem.quantity || 1,
          image: originalItem.image,
          marketplace: originalItem.marketplace,
          itemUrl: originalItem.itemUrl,
          options: originalItem.options
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      requestId: updatedRequest.id
    });

  } catch (error) {
    console.error('Error processing refund request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
