import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export const verifyServerToken = async (token: string): Promise<{ id: string; email: string } | null> => {
  try {
     + '...');
    
    // Разрешить mock-токены в development для тестирования
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-token-')) {
            
      // Попробуем найти любого пользователя в базе
      const user = await prisma.user.findFirst({
        select: { id: true, email: true }
      });
      
      if (user) {
                return user;
      } else {
                return null;
      }
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
            return null;
    }

    
    // Ищем пользователя по ID из токена
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true }
    });

        
    if (!user) {
      console.error('User not found in database for ID:', payload.userId);
      // Попробуем найти по email как fallback
      const userByEmail = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true }
      });
      
      if (userByEmail) {
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