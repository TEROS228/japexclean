import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const requests = await prisma.damagedItemRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              secondName: true
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
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ requests });
    } catch (error) {
      console.error('Error fetching damaged item requests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { requestId, status, adminNotes, refundProcessed } = req.body;

      if (!requestId || !status) {
        return res.status(400).json({ error: 'Request ID and status are required' });
      }

      const updatedRequest = await prisma.damagedItemRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminNotes: adminNotes || undefined,
          refundProcessed: refundProcessed !== undefined ? refundProcessed : undefined,
          updatedAt: new Date()
        }
      });

      res.status(200).json({ success: true, request: updatedRequest });
    } catch (error) {
      console.error('Error updating damaged item request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
