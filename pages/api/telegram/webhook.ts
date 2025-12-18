import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Временное хранилище для медиа-групп
const mediaGroups = new Map<string, {
  photos: any[];
  caption: string;
  chatId: number;
  timeout: NodeJS.Timeout;
}>();

// Хранилище контекста для каждого чата (order number для photo service)
const chatContext = new Map<number, {
  orderNumber: number;
  timestamp: number;
}>();

// Очищаем старые контексты каждые 2 часа
setInterval(() => {
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;

  for (const [chatId, context] of chatContext.entries()) {
    if (now - context.timestamp > twoHours) {
      chatContext.delete(chatId);
      console.log(`[Telegram] Cleared old context for chat ${chatId} (order #${context.orderNumber})`);
    }
  }
}, 30 * 60 * 1000); // Проверяем каждые 30 минут, но удаляем только старые 2+ часа

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2));

    const message = update.message;
    if (!message) {
      return res.status(200).json({ ok: true, message: 'No message' });
    }

    const chatId = message.chat.id;

    // Обработка текстовых сообщений (для установки контекста)
    if (message.text && !message.photo) {
      const text = message.text.trim();
      const orderNumberMatch = text.match(/#(\d+)/);

      if (orderNumberMatch) {
        const orderNumber = parseInt(orderNumberMatch[1]);

        // Сохраняем контекст для этого чата
        chatContext.set(chatId, {
          orderNumber,
          timestamp: Date.now()
        });

        console.log(`[Telegram] ✅ Set context for chat ${chatId}: order #${orderNumber}`);
        console.log(`[Telegram] Current contexts:`, Array.from(chatContext.entries()).map(([id, ctx]) => ({ chatId: id, order: ctx.orderNumber })));

        await sendTelegramMessage(chatId, `✅ Order #${orderNumber} set. Now send photos for this order.`);
      }

      return res.status(200).json({ ok: true, message: 'Text processed' });
    }

    // Проверяем наличие фото
    if (!message.photo) {
      console.log('[Telegram Webhook] No photos found');
      return res.status(200).json({ ok: true, message: 'No action needed' });
    }

    const mediaGroupId = message.media_group_id;

    // Если это медиа-группа (несколько фото отправлено вместе)
    if (mediaGroupId) {
      console.log('[Telegram Webhook] MEDIA GROUP ID:', mediaGroupId);
      console.log('[Telegram Webhook] Message ID:', message.message_id);

      // Получаем или создаем группу
      let group = mediaGroups.get(mediaGroupId);

      if (!group) {
        // Первое фото в группе - создаем новую группу
        group = {
          photos: [],
          caption: message.caption || '',
          chatId: message.chat.id,
          timeout: setTimeout(() => {
            // Обрабатываем группу через 1 секунду (все фото должны прийти)
            processMediaGroup(mediaGroupId);
          }, 1000)
        };
        mediaGroups.set(mediaGroupId, group);
      }

      // Добавляем фото в группу (только самое большое разрешение)
      const largestPhoto = message.photo[message.photo.length - 1];
      group.photos.push(largestPhoto);

      console.log(`[Telegram Webhook] Added photo to group ${mediaGroupId}, total: ${group.photos.length}`);

      return res.status(200).json({ ok: true, message: 'Photo added to group' });
    }

    // Одиночное фото (не группа)
    const photos = message.photo;
    let orderNumber: number | null = null;

    // Пытаемся получить order number из caption
    if (message.caption) {
      const caption = message.caption.trim();
      const orderNumberMatch = caption.match(/#(\d+)/);

      if (orderNumberMatch) {
        orderNumber = parseInt(orderNumberMatch[1]);
        console.log('[Telegram Webhook] Found order number in caption:', orderNumber);

        // Обновляем контекст
        chatContext.set(chatId, {
          orderNumber,
          timestamp: Date.now()
        });
      }
    }

    // Если нет caption с номером, проверяем сохраненный контекст
    if (!orderNumber) {
      const context = chatContext.get(chatId);

      console.log(`[Telegram Webhook] 🔍 Looking for context for chat ${chatId}`);
      console.log(`[Telegram Webhook] Available contexts:`, Array.from(chatContext.entries()).map(([id, ctx]) => ({ chatId: id, order: ctx.orderNumber })));

      if (context) {
        orderNumber = context.orderNumber;
        console.log(`[Telegram Webhook] ✅ Using order number from context: #${orderNumber}`);
      } else {
        console.log('[Telegram Webhook] ❌ No order number found (no caption and no context)');
        await sendTelegramMessage(chatId, '❌ Order number not found. Please send order number first (e.g., #301) or send photo with caption #301');
        return res.status(200).json({ ok: true, message: 'No order number' });
      }
    }

    // Ищем заказ по orderNumber
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            package: true
          }
        },
        user: {
          select: { email: true, id: true }
        }
      }
    });

    if (!order) {
      console.log('[Telegram Webhook] Order not found:', orderNumber);
      await sendTelegramMessage(message.chat.id, `❌ Order #${orderNumber} not found`);
      return res.status(200).json({ ok: true, message: 'Order not found' });
    }

    // Находим первую посылку с заказанной фото услугой
    let pkg = null;
    let orderItem = null;

    for (const item of order.items) {
      if (item.package && item.package.photoService) {
        pkg = item.package;
        orderItem = item;
        break;
      }
    }

    if (!pkg) {
      console.log('[Telegram Webhook] No package with photo service found for order:', orderNumber);
      await sendTelegramMessage(message.chat.id, `❌ Order #${orderNumber} has no package with photo service requested`);
      return res.status(200).json({ ok: true, message: 'Photo service not requested' });
    }

    const packageId = pkg.id;

    // Создаем папку для загрузки если не существует
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos', packageId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Скачиваем фотографии
    // Telegram отправляет каждое фото в нескольких размерах (обычно 4 варианта)
    // Группируем по file_unique_id чтобы определить уникальные фото
    const photoUrls: string[] = [];

    // Группируем фото по file_unique_id (уникальный ID фото, не зависит от размера)
    const uniquePhotos = new Map();
    for (const photo of photos) {
      const uniqueId = photo.file_unique_id;
      const currentSize = photo.width * photo.height;

      if (!uniquePhotos.has(uniqueId)) {
        uniquePhotos.set(uniqueId, photo);
      } else {
        // Если уже есть это фото, сохраняем вариант с наибольшим размером
        const existingPhoto = uniquePhotos.get(uniqueId);
        const existingSize = existingPhoto.width * existingPhoto.height;
        if (currentSize > existingSize) {
          uniquePhotos.set(uniqueId, photo);
        }
      }
    }

    console.log(`[Telegram Webhook] Found ${uniquePhotos.size} unique photos out of ${photos.length} total`);

    let photoIndex = 1;
    for (const [uniqueId, photo] of uniquePhotos) {
      try {
        const fileId = photo.file_id;

        // Получаем информацию о файле
        const fileInfoResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const fileInfo = await fileInfoResponse.json() as any;

        if (!fileInfo.ok) {
          console.error('[Telegram Webhook] Failed to get file info:', fileInfo);
          continue;
        }

        const filePath = fileInfo.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

        // Скачиваем файл
        const imageResponse = await fetch(fileUrl);
        const imageBuffer = await imageResponse.buffer();

        // Сохраняем файл
        const fileName = `photo_${photoIndex}.jpg`;
        const localPath = path.join(uploadDir, fileName);
        fs.writeFileSync(localPath, imageBuffer);

        // Добавляем публичный URL
        photoUrls.push(`/uploads/photos/${packageId}/${fileName}`);
        photoIndex++;

        console.log('[Telegram Webhook] Photo saved:', fileName);
      } catch (error) {
        console.error('[Telegram Webhook] Error downloading photo:', error);
      }
    }

    if (photoUrls.length === 0) {
      await sendTelegramMessage(message.chat.id, `❌ Failed to download photos for package #${packageId}`);
      return res.status(200).json({ ok: true, message: 'Failed to download photos' });
    }

    // Обновляем посылку
    await prisma.package.update({
      where: { id: packageId },
      data: {
        photos: JSON.stringify(photoUrls),
        photoServiceStatus: 'completed'
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: order.user.id,
        type: 'photos_uploaded',
        title: '📸 Photos uploaded',
        message: `Your photos for order #${orderNumber} (${orderItem?.title || 'package'}) are now available. Check your package details to view them.`
      }
    });

    console.log('[Telegram Webhook] Package updated successfully:', packageId);

    // Отправляем подтверждение админу
    await sendTelegramMessage(
      message.chat.id,
      `✅ Success!\n\n📦 Order: #${orderNumber}\n👤 User: ${order.user.email}\n📦 Item: ${orderItem?.title || 'N/A'}\n📸 Photos uploaded: ${photoUrls.length}\n\nUser has been notified.`
    );

    return res.status(200).json({ ok: true, message: 'Photos uploaded successfully' });

  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция обработки медиа-группы
async function processMediaGroup(mediaGroupId: string) {
  const group = mediaGroups.get(mediaGroupId);
  if (!group) {
    console.log(`[Telegram Webhook] Media group ${mediaGroupId} not found`);
    return;
  }

  console.log(`[Telegram Webhook] Processing media group ${mediaGroupId} with ${group.photos.length} photos`);

  // Удаляем группу из хранилища
  mediaGroups.delete(mediaGroupId);
  clearTimeout(group.timeout);

  const caption = group.caption.trim();
  const chatId = group.chatId;
  let orderNumber: number | null = null;

  // Парсим order number из caption
  const orderNumberMatch = caption.match(/#(\d+)/);
  if (orderNumberMatch) {
    orderNumber = parseInt(orderNumberMatch[1]);
    console.log('[Telegram Webhook] Media group order number from caption:', orderNumber);

    // Обновляем контекст
    chatContext.set(chatId, {
      orderNumber,
      timestamp: Date.now()
    });
  }

  // Если нет caption с номером, проверяем сохраненный контекст
  if (!orderNumber) {
    const context = chatContext.get(chatId);

    if (context) {
      orderNumber = context.orderNumber;
      console.log('[Telegram Webhook] Media group using order number from context:', orderNumber);
    } else {
      console.log('[Telegram Webhook] No order number in media group (no caption and no context)');
      await sendTelegramMessage(chatId, '❌ Order number not found. Please send order number first (e.g., #301) or send photos with caption #301');
      return;
    }
  }

  try {
    // Находим заказ
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            package: true
          }
        },
        user: {
          select: { email: true, id: true }
        }
      }
    });

    if (!order) {
      await sendTelegramMessage(chatId, `❌ Order #${orderNumber} not found`);
      return;
    }

    // Находим первую посылку с photo service
    let pkg = null;
    let orderItem = null;

    for (const item of order.items) {
      if (item.package && item.package.photoService) {
        pkg = item.package;
        orderItem = item;
        break;
      }
    }

    if (!pkg) {
      await sendTelegramMessage(chatId, `❌ Order #${orderNumber} has no package with photo service requested`);
      return;
    }

    const packageId = pkg.id;

    // Создаем папку для фото
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos', packageId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Скачиваем все фото
    const photoUrls: string[] = [];
    let photoIndex = 1;

    for (const photo of group.photos) {
      try {
        const fileId = photo.file_id;

        const fileInfoResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const fileInfo = await fileInfoResponse.json() as any;

        if (!fileInfo.ok) {
          console.error('[Telegram Webhook] Failed to get file info:', fileInfo);
          continue;
        }

        const filePath = fileInfo.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

        const imageResponse = await fetch(fileUrl);
        const imageBuffer = await imageResponse.buffer();

        const fileName = `photo_${photoIndex}.jpg`;
        const localPath = path.join(uploadDir, fileName);
        fs.writeFileSync(localPath, imageBuffer);

        photoUrls.push(`/uploads/photos/${packageId}/${fileName}`);
        photoIndex++;

        console.log('[Telegram Webhook] Photo saved:', fileName);
      } catch (error) {
        console.error('[Telegram Webhook] Error downloading photo:', error);
      }
    }

    if (photoUrls.length === 0) {
      await sendTelegramMessage(chatId, `❌ Failed to download photos`);
      return;
    }

    // Обновляем посылку
    await prisma.package.update({
      where: { id: packageId },
      data: {
        photos: JSON.stringify(photoUrls),
        photoServiceStatus: 'completed'
      }
    });

    // Создаем уведомление
    await prisma.notification.create({
      data: {
        userId: order.user.id,
        type: 'photos_uploaded',
        title: '📸 Photos uploaded',
        message: `Your photos for order #${orderNumber} (${orderItem?.title || 'package'}) are now available. Check your package details to view them.`
      }
    });

    console.log('[Telegram Webhook] Package updated successfully:', packageId);

    await sendTelegramMessage(
      chatId,
      `✅ Success!\n\n📦 Order: #${orderNumber}\n👤 User: ${order.user.email}\n📦 Item: ${orderItem?.title || 'N/A'}\n📸 Photos uploaded: ${photoUrls.length}\n\nUser has been notified.`
    );

  } catch (error) {
    console.error('[Telegram Webhook] Error processing media group:', error);
    await sendTelegramMessage(chatId, `❌ Error processing photos`);
  }
}

// Вспомогательная функция для отправки сообщений в Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('[Telegram Webhook] Error sending message:', error);
  }
}
