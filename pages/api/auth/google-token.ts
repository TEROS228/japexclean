import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { generateToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Проверяем NextAuth сессию
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Находим или создаем пользователя в БД
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      // Создаем нового пользователя для Google OAuth
      const [firstName, ...lastNameParts] = (session.user.name || "").split(" ");
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: firstName || "User",
          secondName: lastNameParts.join(" ") || "Google",
          password: "", // Google пользователям не нужен пароль
          balance: 0
        }
      });
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        secondName: user.secondName,
        balance: user.balance
      }
    });

  } catch (error: any) {
    console.error('[Google Token] Error:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
