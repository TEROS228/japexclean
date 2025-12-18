import { NextApiRequest, NextApiResponse } from 'next';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
    }

    // Устанавливаем webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram Setup] Failed to set webhook:', data);
      return res.status(500).json({ error: 'Failed to set webhook', details: data });
    }

    console.log('[Telegram Setup] Webhook set successfully:', webhookUrl);

    // Получаем информацию о webhook
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const webhookInfo = await infoResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Webhook set successfully',
      webhookInfo: webhookInfo.result,
    });
  } catch (error) {
    console.error('[Telegram Setup] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
