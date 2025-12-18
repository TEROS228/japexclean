// pages/api/auth/test-login.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Простой ответ для теста
    res.status(200).json({
      token: 'test-token-123',
      user: {
        id: '1',
        name: 'Test',
        secondName: 'User',
        email: 'test@example.com',
        balance: 10000
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}