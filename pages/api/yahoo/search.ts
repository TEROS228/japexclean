import type { NextApiRequest, NextApiResponse } from 'next';
import { searchYahooProducts, convertYahooToRakutenFormat, mapSortToYahoo } from '@/lib/yahoo-shopping';
import { rankSearchResults, normalizeJapaneseQuery } from '@/lib/search-ranking';

// In-memory кеш для результатов поиска
interface CacheEntry {
  products: any[];
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 минут

// Очистка устаревших записей
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { keyword, page, sort } = req.query;

  console.log('[Yahoo Shopping API] Request:', { keyword, page, sort });

  try {
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const pageNum = Number(page) || 1;
    // Не используем сортировку по умолчанию - дадим Yahoo API вернуть по релевантности
    const sortParam = typeof sort === 'string' ? mapSortToYahoo(sort) : undefined;

    // Нормализуем японский запрос
    const normalizedKeyword = normalizeJapaneseQuery(keyword);

    // Создаем ключ для кеша
    const cacheKey = `${normalizedKeyword}:${pageNum}:${sortParam || 'relevance'}`;

    // Проверяем кеш
    const cachedEntry = searchCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log('[Yahoo Shopping API] Returning from cache:', cacheKey);
      return res.status(200).json(cachedEntry.products);
    }

    // Периодически очищаем устаревший кеш
    if (Math.random() < 0.1) {
      cleanExpiredCache();
    }

    const yahooProducts = await searchYahooProducts(normalizedKeyword, pageNum, 20, sortParam);

    // Конвертируем в формат Rakuten для совместимости с существующим UI
    let products = yahooProducts.map(convertYahooToRakutenFormat);

    // Применяем умное ранжирование для всех страниц (усиленное для Yahoo)
    products = rankSearchResults(products, normalizedKeyword) as any;

    console.log(`[Yahoo Shopping API] Query: "${keyword}" -> "${normalizedKeyword}", found ${products.length} products`);

    // Сохраняем в кеш
    searchCache.set(cacheKey, {
      products,
      timestamp: Date.now(),
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('[Yahoo Shopping API] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
