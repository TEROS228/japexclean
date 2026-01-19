import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Login API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Ищем пользователя в БАЗЕ ДАННЫХ
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Проверяем пароль с помощью bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Создаем НАСТОЯЩИЙ JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    });

    console.log('Login successful for user:', user.id);

    // Возвращаем успешный ответ
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        secondName: user.secondName,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}