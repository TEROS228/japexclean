import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export const verifyServerToken = async (token: string): Promise<{ id: string; email: string } | null> => {
  try {
    console.log('Verifying token:', token.substring(0, 20) + '...');
    
    // Разрешить mock-токены в development для тестирования
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-token-')) {
      console.log('🔐 Development mode: using mock token');
      
      // Попробуем найти любого пользователя в базе
      const user = await prisma.user.findFirst({
        select: { id: true, email: true }
      });
      
      if (user) {
        console.log('Development user found:', user);
        return user;
      } else {
        console.log('No users found in database for mock token');
        return null;
      }
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      console.log('Token verification failed - invalid payload');
      return null;
    }

    console.log('JWT Payload:', payload);

    // Ищем пользователя по ID из токена
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true }
    });

    console.log('Found user in database:', user);
    
    if (!user) {
      console.error('User not found in database for ID:', payload.userId);
      // Попробуем найти по email как fallback
      const userByEmail = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true }
      });
      
      if (userByEmail) {
        console.log('Found user by email fallback:', userByEmail);
        return userByEmail;
      }
      
      return null;
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};