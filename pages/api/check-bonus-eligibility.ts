import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    // Проверяем есть ли пользователь с этим IP который получил бонус
    const existingIpUser = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
        balance: { gte: 500 }, // Проверяем что пользователь получил бонус
      },
    });

    if (existingIpUser) {
      console.log(`[Bonus Check] IP ${ip} already claimed bonus`);
      return res.status(200).json({ eligible: false, reason: 'ip_used' });
    }

    // Проверяем есть ли пользователь с этим fingerprint который получил бонус
    const existingFingerprintUser = await prisma.user.findFirst({
      where: {
        registrationFingerprint: fingerprint,
        balance: { gte: 500 },
      },
    });

    if (existingFingerprintUser) {
      console.log(`[Bonus Check] Fingerprint ${fingerprint.substring(0, 8)}... already claimed bonus`);
      return res.status(200).json({ eligible: false, reason: 'fingerprint_used' });
    }

    // Браузер/IP еще не получал бонус
    console.log(`[Bonus Check] IP ${ip} / Fingerprint ${fingerprint.substring(0, 8)}... is eligible`);
    return res.status(200).json({ eligible: true });

  } catch (error) {
    console.error('[Bonus Check] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
