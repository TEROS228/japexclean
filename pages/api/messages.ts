import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';
import { sendTelegramNotification } from '../../lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // GET - получить сообщения
    if (req.method === 'GET') {
      const { userId } = req.query;

      let messages;
      if (dbUser.isAdmin) {
        // Админ может получить все сообщения или сообщения конкретного пользователя
        if (userId) {
          messages = await prisma.message.findMany({
            where: { userId: userId as string },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          });
        } else {
          // Получить все сообщения, сгруппированные по пользователям
          messages = await prisma.message.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          });
        }
      } else {
        // Обычный пользователь получает только свои сообщения
        messages = await prisma.message.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'asc' }
        });
      }

      return res.status(200).json({ messages });
    }

    // POST - отправить сообщение
    if (req.method === 'POST') {
      const { userId: targetUserId, message: messageText } = req.body;

                                    
      if (!messageText) {
                return res.status(400).json({ error: 'Message is required' });
      }

      let messageData: any;

      if (dbUser.isAdmin && targetUserId) {
        // Админ отправляет сообщение конкретному пользователю (из админ-панели)
                messageData = {
          userId: targetUserId,
          senderType: 'admin',
          message: messageText
        };
      } else {
        // Обычный пользователь (или админ из своего профиля) отправляет сообщение
                messageData = {
          userId: dbUser.id,
          senderType: 'user',
          message: messageText
        };
      }

      
      try {
        const newMessage = await prisma.message.create({
          data: messageData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        });

        
        // Отправляем Telegram уведомление
        if (messageData.senderType === 'user') {
          // Пользователь отправил сообщение - уведомляем админа
          const telegramMessage = `
💬 <b>NEW MESSAGE FROM USER</b>

👤 <b>User:</b> ${newMessage.user.email}
📝 <b>Message:</b> ${messageText}

<i>Please check the admin panel to respond.</i>
          `.trim();

          await sendTelegramNotification(telegramMessage);
        }

        // TODO: Emit WebSocket event when socket.io is configured
        // const io = getIO(res);
        // if (io) {
        //   io.emit('messages-updated');
        //           // }

        return res.status(201).json({ message: newMessage });
      } catch (createError) {
        console.error('ERROR creating message:', createError);
        return res.status(500).json({ error: 'Failed to create message' });
      }
    }

    // PUT - пометить сообщение как прочитанное
    if (req.method === 'PUT') {
      const { messageId } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { read: true }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
