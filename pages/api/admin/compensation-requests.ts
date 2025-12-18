import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; isAdmin?: boolean };

    // If isAdmin is not in token, check database
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

    if (req.method === 'GET') {
      // Get all compensation requests
      const requests = await prisma.compensationRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          package: {
            select: {
              id: true,
              trackingNumber: true,
              status: true,
              invoice: true, // Include invoice path
              orderItem: {
                select: {
                  title: true,
                  price: true,
                  order: {
                    select: {
                      orderNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // For each request with selectedPackageIds, fetch those packages
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          if (request.selectedPackageIds) {
            try {
              const packageIds = JSON.parse(request.selectedPackageIds);
              const selectedPackages = await prisma.package.findMany({
                where: {
                  id: {
                    in: packageIds,
                  },
                },
                include: {
                  orderItem: {
                    select: {
                      title: true,
                      price: true,
                      order: {
                        select: {
                          orderNumber: true,
                        },
                      },
                    },
                  },
                },
              });
              return {
                ...request,
                selectedPackages,
              };
            } catch (error) {
              console.error('Error parsing selectedPackageIds:', error);
              return request;
            }
          }
          return request;
        })
      );

      console.log('Compensation requests found:', enrichedRequests.length);
      console.log('Requests data:', JSON.stringify(enrichedRequests, null, 2));

      return res.status(200).json({ requests: enrichedRequests });
    }

    if (req.method === 'PATCH') {
      // Update compensation request status
      const { requestId, status, adminNotes, refundProcessed, approvedForRefund } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'Request ID is required' });
      }

      // If marking as refund processed, only delete for 'balance' refunds
      // For Stripe/PayPal, keep the request so user can see the status
      if (refundProcessed === true) {
        // Get the request to check refund method
        const request = await prisma.compensationRequest.findUnique({
          where: { id: requestId }
        });

        if (!request) {
          return res.status(404).json({ error: 'Request not found' });
        }

        // Only delete if refund method is 'balance' (already processed)
        // For Stripe/PayPal, just update the refundProcessed flag
        if (request.refundMethod === 'balance') {
          await prisma.compensationRequest.delete({
            where: { id: requestId }
          });
          return res.status(200).json({ success: true, deleted: true });
        } else {
          // For Stripe/PayPal, update refundProcessed to true
          await prisma.compensationRequest.update({
            where: { id: requestId },
            data: { refundProcessed: true }
          });
          return res.status(200).json({ success: true, deleted: false });
        }
      }

      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
      }

      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      if (approvedForRefund !== undefined) {
        updateData.approvedForRefund = approvedForRefund;
      }

      const updatedRequest = await prisma.compensationRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      return res.status(200).json({ success: true, request: updatedRequest });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling compensation requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
