import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * API endpoint to process "Item Replacement" compensation requests
 * When admin approves item replacement:
 * 1. Creates new Order with the same items (for admin to reorder)
 * 2. Deletes the original Package (removes it from client's packages)
 * 3. Deletes the CompensationRequest
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; isAdmin?: boolean };

    // Check if user is admin
    let isAdmin = decoded.isAdmin;
    if (isAdmin === undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isAdmin: true }
      });
      isAdmin = user?.isAdmin || false;
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    // Get the compensation request with all related data
    const compensationRequest = await prisma.compensationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        },
        package: {
          include: {
            orderItem: {
              include: {
                order: true
              }
            }
          }
        }
      }
    });

    if (!compensationRequest) {
      return res.status(404).json({ error: 'Compensation request not found' });
    }

    // Check if compensation type is 'replace'
    if (compensationRequest.compensationType !== 'replace') {
      return res.status(400).json({
        error: 'This endpoint is only for item replacement compensation type'
      });
    }

    const userId = compensationRequest.userId;
    const packageData = compensationRequest.package;
    const orderItem = packageData.orderItem;

    // Handle consolidated packages (multiple items selected)
    let itemsToReplace = [orderItem];
    if (compensationRequest.selectedPackageIds) {
      try {
        const selectedIds = JSON.parse(compensationRequest.selectedPackageIds);

        // Get all selected packages
        const selectedPackages = await prisma.package.findMany({
          where: {
            id: { in: selectedIds }
          },
          include: {
            orderItem: {
              include: {
                order: true
              }
            }
          }
        });

        itemsToReplace = selectedPackages.map(pkg => pkg.orderItem);
      } catch (error) {
        console.error('Error parsing selectedPackageIds:', error);
      }
    }

    // Create new Order with items to replace
    const totalPrice = itemsToReplace.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder = await prisma.order.create({
      data: {
        userId: userId,
        total: totalPrice,
        status: 'pending',
        confirmed: false,
        isReplacement: false, // Set to false so replacement items appear in warehouse as new orders
        shippingCountry: packageData.orderItem.order.shippingCountry,
      }
    });

    // Create OrderItems for the new order
    await Promise.all(
      itemsToReplace.map(item =>
        prisma.orderItem.create({
          data: {
            orderId: newOrder.id,
            itemCode: item.itemCode,
            title: `[REPLACEMENT] ${item.title}`,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            marketplace: item.marketplace,
            itemUrl: item.itemUrl,
            options: item.options,
          }
        })
      )
    );

    // Delete package(s) from user's packages
    if (compensationRequest.selectedPackageIds) {
      const selectedIds = JSON.parse(compensationRequest.selectedPackageIds);
      await prisma.package.deleteMany({
        where: {
          id: { in: selectedIds }
        }
      });
    } else {
      // Delete single package
      await prisma.package.delete({
        where: { id: packageData.id }
      });
    }

    // Delete compensation request
    await prisma.compensationRequest.delete({
      where: { id: requestId }
    });

    return res.status(200).json({
      success: true,
      message: 'Item replacement processed successfully',
      newOrderId: newOrder.id,
      newOrderNumber: newOrder.orderNumber
    });

  } catch (error) {
    console.error('Error processing item replacement:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
