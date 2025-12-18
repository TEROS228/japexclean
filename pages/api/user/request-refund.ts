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
    const { requestId, refundMethod, bankAccountName, bankAccountAddress, bankAccountNumber, bankRoutingNumber, bankName, swiftCode, paymentEmail, cardLast4 } = req.body;

    if (!requestId || !refundMethod) {
      return res.status(400).json({ error: 'Request ID and refund method are required' });
    }

    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Находим запрос на компенсацию с информацией о посылке
    const request = await prisma.compensationRequest.findFirst({
      where: {
        id: requestId,
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

    if (!request) {
      return res.status(404).json({ error: 'Compensation request not found' });
    }

    // Проверяем что статус Approved
    if (request.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved requests can request refund' });
    }

    // Проверяем что возврат еще не обработан
    if (request.refundProcessed) {
      return res.status(400).json({ error: 'Refund already processed' });
    }

    // Если выбран Stripe или PayPal, проверяем что email и card last 4 заполнены
    if (refundMethod === 'stripe' || refundMethod === 'paypal') {
      if (!paymentEmail || !cardLast4) {
        return res.status(400).json({ error: 'Payment email and card last 4 digits are required' });
      }

      if (cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
        return res.status(400).json({ error: 'Card last 4 digits must be exactly 4 numbers' });
      }

      // Обновляем запрос с информацией о платеже
      await prisma.compensationRequest.update({
        where: { id: requestId },
        data: {
          refundMethod,
          refundEmail: paymentEmail,
          refundCardLast4: cardLast4
        }
      });
    } else if (refundMethod === 'balance') {
      // Автоматически начисляем деньги на баланс
      // If there are selected packages, sum their prices; otherwise use the main package price
      let refundAmount = 0;

      if (request.selectedPackageIds) {
        try {
          const packageIds = JSON.parse(request.selectedPackageIds);
          const selectedPackages = await prisma.package.findMany({
            where: { id: { in: packageIds } },
            include: { orderItem: true }
          });
          refundAmount = selectedPackages.reduce((sum, pkg) => sum + pkg.orderItem.price, 0);
        } catch (error) {
          console.error('Error parsing selectedPackageIds:', error);
          refundAmount = request.package.orderItem.price;
        }
      } else {
        refundAmount = request.package.orderItem.price;
      }

      // Build description based on selected items
      let description = 'Refund for damaged item';
      if (request.selectedPackageIds) {
        try {
          const packageIds = JSON.parse(request.selectedPackageIds);
          if (packageIds.length > 1) {
            description = `Refund for ${packageIds.length} damaged items`;
          }
        } catch (error) {
          // Keep default description
        }
      }

      // Используем транзакцию для атомарности
      await prisma.$transaction([
        // Обновляем баланс пользователя
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            balance: {
              increment: refundAmount
            }
          }
        }),
        // Создаем транзакцию пополнения
        prisma.transaction.create({
          data: {
            userId: dbUser.id,
            amount: refundAmount,
            type: 'refund',
            status: 'completed',
            description
          }
        }),
        // Удаляем запрос после успешного возврата на баланс
        prisma.compensationRequest.delete({
          where: { id: requestId }
        })
      ]);

      res.status(200).json({
        success: true,
        message: `¥${refundAmount.toLocaleString()} has been automatically added to your balance!`
      });
      return;
    } else {
      return res.status(400).json({ error: 'Invalid refund method' });
    }

    res.status(200).json({ success: true, message: 'Refund request submitted. Admin will process it soon.' });

  } catch (error) {
    console.error('Error processing refund request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
