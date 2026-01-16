import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, fingerprint, landingPage, referrer } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Проверяем существует ли уже визит с таким sessionId
    const existingVisit = await prisma.visit.findUnique({
      where: { sessionId },
    });

    // Если визит уже записан, не создаем дубликат
    if (existingVisit) {
      return res.status(200).json({ success: true, message: 'Visit already tracked' });
    }

    // Получаем IP адрес и User-Agent из headers
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      req.socket.remoteAddress ||
                      null;

    // Записываем новый визит
    await prisma.visit.create({
      data: {
        sessionId,
        fingerprint: fingerprint || null,
        userAgent,
        ipAddress,
        referrer: referrer || null,
        landingPage: landingPage || null,
      },
    });

    return res.status(200).json({ success: true, message: 'Visit tracked successfully' });
  } catch (error) {
    console.error('Track visit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
