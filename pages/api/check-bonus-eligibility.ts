import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fingerprint } = req.body;

  if (!fingerprint || typeof fingerprint !== 'string') {
    return res.status(400).json({ error: 'Fingerprint is required' });
  }

  // Get user's IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0]
    : req.socket.remoteAddress || 'unknown';

  try {
    // Проверяем rate limiting: 1 регистрация с IP в день
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ipAttemptsToday = await prisma.registrationAttempt.count({
      where: {
        ip: ip,
        timestamp: { gte: today }
      }
    });

    if (ipAttemptsToday >= 1) {
      console.log(`[Bonus Check] IP ${ip} already registered today (${ipAttemptsToday} attempts)`);
      return res.status(200).json({ eligible: false, reason: 'ip_rate_limit' });
    }

    // Проверяем использовался ли этот IP для регистрации раньше
    const existingIpUser = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
      },
    });

    if (existingIpUser) {
      console.log(`[Bonus Check] IP ${ip} already used for registration`);
      return res.status(200).json({ eligible: false, reason: 'ip_used' });
    }

    // Проверяем использовался ли этот fingerprint для регистрации раньше
    const existingFingerprintUser = await prisma.user.findFirst({
      where: {
        registrationFingerprint: fingerprint,
      },
    });

    if (existingFingerprintUser) {
      console.log(`[Bonus Check] Fingerprint ${fingerprint.substring(0, 8)}... already used for registration`);
      return res.status(200).json({ eligible: false, reason: 'fingerprint_used' });
    }

    // Браузер/IP еще не использовались для регистрации
    console.log(`[Bonus Check] IP ${ip} / Fingerprint ${fingerprint.substring(0, 8)}... is eligible`);
    return res.status(200).json({ eligible: true });

  } catch (error) {
    console.error('[Bonus Check] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
