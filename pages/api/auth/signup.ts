import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Signup API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, secondName, email, password } = req.body;
    console.log('Signup attempt:', { email, name, secondName });

    if (!name || !secondName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Валидация пароля: минимум 8 символов, 1 цифра, 1 заглавная буква
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 number' });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 uppercase letter' });
    }

    // Проверяем нет ли уже пользователя в БАЗЕ ДАННЫХ
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Хешируем пароль перед сохранением
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем нового пользователя в БАЗЕ ДАННЫХ
    const newUser = await prisma.user.create({
      data: {
        name,
        secondName,
        email,
        password: hashedPassword,
        balance: 0
      }
    });

    // Создаем НАСТОЯЩИЙ JWT токен
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email
    });

    console.log('User created successfully:', newUser.id);

    // Возвращаем успешный ответ
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        secondName: newUser.secondName,
        email: newUser.email,
        balance: newUser.balance
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}