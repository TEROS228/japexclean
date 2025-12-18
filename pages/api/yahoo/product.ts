import type { NextApiRequest, NextApiResponse } from 'next';
import { searchYahooProducts, convertYahooToRakutenFormat } from '@/lib/yahoo-shopping';

// In-memory кеш для товаров
interface CacheEntry {
  product: any;
  timestamp: number;
}

const productCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

// Очистка устаревших записей
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of productCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      productCache.delete(key);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Product code is required' });
  }

  // Проверяем кеш
  const cachedEntry = productCache.get(code);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    console.log('[Yahoo Product API] Returning from cache:', code);
    return res.status(200).json(cachedEntry.product);
  }

  try {
    console.log('[Yahoo Product API] Searching for product with code:', code);

    // Периодически очищаем устаревший кеш
    if (Math.random() < 0.1) {
      cleanExpiredCache();
    }

    // Ищем товар по коду через Yahoo Shopping API
    const yahooProducts = await searchYahooProducts(code, 1, 5);

    // Ищем точное совпадение по коду
    const exactMatch = yahooProducts.find(p => p.code === code);

    if (exactMatch) {
      const product = convertYahooToRakutenFormat(exactMatch);
      console.log('[Yahoo Product API] Found exact match:', product.itemName);

      // Сохраняем в кеш
      productCache.set(code, {
        product,
        timestamp: Date.now(),
      });

      return res.status(200).json(product);
    }

    // Если точного совпадения нет, возвращаем первый результат
    if (yahooProducts.length > 0) {
      const product = convertYahooToRakutenFormat(yahooProducts[0]);
      console.log('[Yahoo Product API] Returning first result:', product.itemName);

      // Сохраняем в кеш
      productCache.set(code, {
        product,
        timestamp: Date.now(),
      });

      return res.status(200).json(product);
    }

    console.log('[Yahoo Product API] No products found');
    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error('[Yahoo Product API] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
