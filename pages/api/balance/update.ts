import { NextApiRequest, NextApiResponse } from 'next';
import { verifyServerToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

const processedTransactions = new Set<string>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = await verifyServerToken(token);
    
  if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true }
      });
      
            return res.json({ balance: userData?.balance || 0 });
      
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }

  if (req.method === 'POST') {
    const { amount, description, sessionId } = req.body;
    
    
    // Проверяем дубликаты по sessionId
    if (sessionId) {
      const existingTransaction = await prisma.transaction.findUnique({
        where: { sessionId }
      });
      if (existingTransaction) {
                return res.status(409).json({ error: 'Duplicate transaction' });
      }
    }

    const transactionId = sessionId || `${user.id}-${amount}-${description}-${Date.now()}`;
    
    if (processedTransactions.has(transactionId)) {
            return res.status(409).json({ error: 'Duplicate transaction' });
    }
    
    processedTransactions.add(transactionId);
    
    if (typeof amount !== 'number') {
            return res.status(400).json({ error: 'Amount must be a number' });
    }

    try {
      // БЕЗОПАСНОЕ обновление баланса с атомарной операцией
      const result = await prisma.$transaction(async (tx) => {
        // Проверяем, что баланс не уйдет в минус
        if (amount < 0) {
          const currentUser = await tx.user.findUnique({
            where: { id: user.id },
            select: { balance: true }
          });

          if (!currentUser) throw new Error('User not found');
          if (currentUser.balance + amount < 0) {
            throw new Error('Insufficient balance');
          }
        }

        // Атомарное обновление баланса
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { 
            balance: amount > 0 
              ? { increment: amount }  // Безопасное увеличение
              : { decrement: Math.abs(amount) }  // Безопасное уменьшение
          },
          select: { balance: true }
        });

        // Создаем запись о транзакции
        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: amount,
            type: amount > 0 ? 'topup' : 'purchase',
            status: 'completed',
            description: description || `Balance ${amount > 0 ? 'addition' : 'deduction'}`,
            sessionId: sessionId
          }
        });

        return updatedUser;
      });

            
      setTimeout(() => {
        processedTransactions.delete(transactionId);
              }, 60000);

      return res.json({ success: true, newBalance: result.balance });

    } catch (error: any) {
      processedTransactions.delete(transactionId);
      console.error('❌ Balance update error:', error);
      
      // Более специфичные ошибки
      if (error.message.includes('Insufficient balance')) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      if (error.message.includes('User not found')) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(400).json({ error: error.message });
    }
  }

    return res.status(405).json({ error: 'Method not allowed' });
}