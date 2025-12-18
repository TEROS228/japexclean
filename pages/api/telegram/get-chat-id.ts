import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await response.json();

    if (data.ok && data.result.length > 0) {
      // Получаем последнее сообщение
      const lastMessage = data.result[data.result.length - 1];
      const chatId = lastMessage.message?.chat?.id || lastMessage.my_chat_member?.chat?.id;

      return res.status(200).json({
        chatId,
        fullData: data.result
      });
    }

    return res.status(200).json({
      message: 'No messages found. Please send any message to your bot first.',
      data
    });

  } catch (error) {
    console.error('Error fetching chat ID:', error);
    res.status(500).json({ error: 'Failed to fetch chat ID' });
  }
}
