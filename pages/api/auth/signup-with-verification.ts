import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcrypt';
import { getVerificationCode, deleteVerificationCode } from '../send-verification-code';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Signup with verification API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, secondName, email, password, code, marketingConsent, fingerprint } = req.body;
    console.log('Signup attempt:', { email, name, secondName, marketingConsent });

    if (!name || !secondName || !email || !password || !code) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get user's IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : req.socket.remoteAddress || 'unknown';

    // Verify the code
    const storedData = await getVerificationCode(email);

    if (!storedData) {
      return res.status(400).json({ message: 'Verification code expired or not found. Please request a new code.' });
    }

    // Check if code matches
    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if code expired (10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - storedData.timestamp.getTime() > TEN_MINUTES) {
      await deleteVerificationCode(email);
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }

    // Delete the code after successful verification
    await deleteVerificationCode(email);

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

    // Проверяем eligibility для бонуса (если есть fingerprint)
    let bonusAmount = 0;
    if (fingerprint) {
      // Проверяем использовался ли этот IP раньше
      const existingIpUser = await prisma.user.findFirst({
        where: {
          registrationIp: ip,
        },
      });

      // Проверяем использовался ли этот fingerprint раньше
      const existingFingerprintUser = await prisma.user.findFirst({
        where: {
          registrationFingerprint: fingerprint,
        },
      });

      // Даем бонус только если IP и fingerprint не использовались
      if (!existingIpUser && !existingFingerprintUser) {
        bonusAmount = 500;
        console.log(`[SignUp] Granting ¥500 bonus to ${email} (IP: ${ip}, Fingerprint: ${fingerprint.substring(0, 8)}...)`);
      } else {
        console.log(`[SignUp] No bonus for ${email} (IP or fingerprint already used)`);
      }
    }

    // Хешируем пароль перед сохранением
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем нового пользователя в БАЗЕ ДАННЫХ (без баланса)
    const newUser = await prisma.user.create({
      data: {
        name,
        secondName,
        email: email.toLowerCase(),
        password: hashedPassword,
        balance: 0, // Больше не даём баланс, вместо этого купон
        registrationIp: ip,
        registrationFingerprint: fingerprint || null,
        marketingConsent: marketingConsent || false
      }
    });

    // Если eligible для бонуса - создаём купон вместо баланса
    if (bonusAmount > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Купон действует 30 дней

      await prisma.coupon.create({
        data: {
          userId: newUser.id,
          code: `WELCOME500-${newUser.id.substring(0, 8).toUpperCase()}`,
          discountAmount: 500,
          minPurchase: 3000, // Минимальная сумма заказа ¥3000
          description: 'Welcome bonus: ¥500 off on orders over ¥3000',
          status: 'active',
          expiresAt: expiresAt
        }
      });

      console.log(`[SignUp] Created welcome coupon for ${email} (¥500 off orders ¥3000+)`);
    }

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
