import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/jwt';
import { verificationCodes } from './send-verification-code';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, secondName, email, password, code, fingerprint, marketingConsent } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'First name is required' });
  }

  if (!secondName || typeof secondName !== 'string') {
    return res.status(400).json({ error: 'Last name is required' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  if (!fingerprint || typeof fingerprint !== 'string') {
    return res.status(400).json({ error: 'Browser verification failed' });
  }

  // Get user's IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0]
    : req.socket.remoteAddress || 'unknown';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Verify the code
    const storedData = verificationCodes.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ error: 'Verification code expired or not found. Please request a new code.' });
    }

    // Check if code matches
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code expired (10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - storedData.timestamp > TEN_MINUTES) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
    }

    // Delete the code after successful verification
    verificationCodes.delete(email.toLowerCase());

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'This email has already been used for the bonus' });
    }

    // Check if this IP address already received a bonus
    const existingIpUser = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
        balance: { gte: 500 }, // Проверяем что пользователь получил бонус
      },
    });

    if (existingIpUser) {
      console.log(`[Lead Magnet] Blocked: IP ${ip} already used for bonus`);
      return res.status(400).json({ error: 'A bonus has already been claimed from this device' });
    }

    // Check if this browser fingerprint already received a bonus
    const existingFingerprintUser = await prisma.user.findFirst({
      where: {
        registrationFingerprint: fingerprint,
        balance: { gte: 500 },
      },
    });

    if (existingFingerprintUser) {
      console.log(`[Lead Magnet] Blocked: Fingerprint ${fingerprint} already used for bonus`);
      return res.status(400).json({ error: 'A bonus has already been claimed from this browser' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with 500 yen bonus
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        secondName: secondName.trim(),
        password: hashedPassword,
        balance: 500, // Lead magnet bonus
        registrationIp: ip,
        registrationFingerprint: fingerprint,
        marketingConsent: marketingConsent || false,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    console.log(`[Lead Magnet] New user created: ${email} with ¥500 bonus (IP: ${ip}, Fingerprint: ${fingerprint.substring(0, 8)}..., Marketing: ${marketingConsent})`);

    return res.status(200).json({
      success: true,
      message: '500 yen bonus added to your account',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        balance: newUser.balance,
      },
    });
  } catch (error) {
    console.error('[Lead Magnet] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
