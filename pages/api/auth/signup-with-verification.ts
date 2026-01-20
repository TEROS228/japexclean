import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcrypt';
import { verificationCodes } from '../send-verification-code';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Signup with verification API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, secondName, email, password, code, marketingConsent } = req.body;
    console.log('Signup attempt:', { email, name, secondName, marketingConsent });

    if (!name || !secondName || !email || !password || !code) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify the code
    const storedData = verificationCodes.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ message: 'Verification code expired or not found. Please request a new code.' });
    }

    // Check if code matches
    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if code expired (10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - storedData.timestamp > TEN_MINUTES) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }

    // Delete the code after successful verification
    verificationCodes.delete(email.toLowerCase());

    // Валидация пароля: минимум 5 символов, 1 цифра
    if (password.length < 5) {
      return res.status(400).json({ message: 'Password must be at least 5 characters long' });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 number' });
    }

    // Проверяем нет ли уже пользователя в БАЗЕ ДАННЫХ
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
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
        email: email.toLowerCase(),
        password: hashedPassword,
        balance: 0,
        marketingConsent: marketingConsent || false
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
