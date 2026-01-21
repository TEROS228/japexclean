import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/jwt';
import { getVerificationCode, deleteVerificationCode } from './send-verification-code';

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
    const storedData = await getVerificationCode(email);

    if (!storedData) {
      return res.status(400).json({ error: 'Verification code expired or not found. Please request a new code.' });
    }

    // Check if code matches
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code expired (10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - storedData.timestamp.getTime() > TEN_MINUTES) {
      await deleteVerificationCode(email);
      return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
    }

    // Delete the code after successful verification
    await deleteVerificationCode(email);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'This email has already been used for the bonus' });
    }

    // Check if this IP address was already used for registration
    const existingIpUser = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
      },
    });

    if (existingIpUser) {
      console.log(`[Lead Magnet] Blocked: IP ${ip} already used for registration`);
      return res.status(400).json({ error: 'An account has already been created from this device' });
    }

    // Check if this browser fingerprint was already used for registration
    const existingFingerprintUser = await prisma.user.findFirst({
      where: {
        registrationFingerprint: fingerprint,
      },
    });

    if (existingFingerprintUser) {
      console.log(`[Lead Magnet] Blocked: Fingerprint ${fingerprint} already used for registration`);
      return res.status(400).json({ error: 'An account has already been created from this browser' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (without balance, will get coupon instead)
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        secondName: secondName.trim(),
        password: hashedPassword,
        balance: 0, // No balance, will get welcome coupon instead
        registrationIp: ip,
        registrationFingerprint: fingerprint,
        marketingConsent: marketingConsent || false,
      },
    });

    // Create welcome coupon (¥500 off orders ¥3000+)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Coupon valid for 30 days

    await prisma.coupon.create({
      data: {
        userId: newUser.id,
        code: `WELCOME500-${newUser.id.substring(0, 8).toUpperCase()}`,
        discountAmount: 500,
        minPurchase: 3000, // Minimum order ¥3000
        description: 'Welcome bonus: ¥500 off on orders over ¥3000',
        status: 'active',
        expiresAt: expiresAt
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    console.log(`[Lead Magnet] New user created: ${email} with welcome coupon ¥500 off ¥3000+ (IP: ${ip}, Fingerprint: ${fingerprint.substring(0, 8)}..., Marketing: ${marketingConsent})`);

    return res.status(200).json({
      success: true,
      message: 'Welcome coupon received: ¥500 off on orders over ¥3000!',
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
  }
}
