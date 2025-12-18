// pages/api/balance.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем JWT токен
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

    if (req.method === 'GET') {
      // Получить баланс из базы данных
      return res.json({ balance: dbUser.balance });
    }

    if (req.method === 'POST') {
      // Обновить баланс
      const { amount, description } = req.body;

      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' });
      }

      const newBalance = dbUser.balance + amount;

      if (newBalance < 0) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Обновляем баланс в базе
      await prisma.user.update({
        where: { email: user.email },
        data: { balance: newBalance }
      });

      console.log('Balance updated:', {
        email: user.email,
        amount,
        newBalance,
        description
      });

      return res.json({ success: true, newBalance });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in balance API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}