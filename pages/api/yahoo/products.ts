import type { NextApiRequest, NextApiResponse } from 'next';
import { searchYahooProducts, convertYahooToRakutenFormat, mapSortToYahoo, getYahooProductsByCategory } from '@/lib/yahoo-shopping';
import { yahooCategories, getYahooCategoryById } from '@/data/yahoo-categories';

// In-memory кеш для категорий
interface CacheEntry {
  products: any[];
  timestamp: number;
}

const categoryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 минут

// Очистка устаревших записей
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of categoryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      categoryCache.delete(key);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId, page, sort } = req.query;

  console.log('[Yahoo Shopping API] Category request:', { categoryId, page, sort });

  try {
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const pageNum = Number(page) || 1;
    const sortParam = typeof sort === 'string' ? mapSortToYahoo(sort) : '-review';

    // Создаем ключ для кеша
    const cacheKey = `${categoryIdNum}:${pageNum}:${sortParam}`;

    // Проверяем кеш
    const cachedEntry = categoryCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log('[Yahoo Shopping API] Returning category from cache:', cacheKey);
      return res.status(200).json(cachedEntry.products);
    }

    // Периодически очищаем устаревший кеш
    if (Math.random() < 0.1) {
      cleanExpiredCache();
    }

    // Сначала пробуем найти главную категорию
    const mainCategory = yahooCategories.find(c => c.id === categoryIdNum);

    if (mainCategory) {
      // Это главная категория - используем поиск по её японскому названию
      console.log(`[Yahoo Shopping API] Main category "${mainCategory.jpName}" (${categoryIdNum})`);
      const yahooProducts = await searchYahooProducts(mainCategory.jpName, pageNum, 20, sortParam);
      const products = yahooProducts.map(convertYahooToRakutenFormat);
      console.log(`[Yahoo Shopping API] Found ${products.length} products`);

      // Сохраняем в кеш
      categoryCache.set(cacheKey, {
        products,
        timestamp: Date.now(),
      });

      return res.status(200).json(products);
    }

    // Проверяем, не подкатегория ли это
    const categoryInfo = getYahooCategoryById(categoryIdNum);
    if (!categoryInfo) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Это подкатегория - используем genre_category_id API
    console.log(`[Yahoo Shopping API] Subcategory "${categoryInfo.name}" (${categoryIdNum})`);

    // Используем прямой запрос по ID категории для подкатегорий
    const yahooProducts = await getYahooProductsByCategory(categoryIdNum, pageNum, 20, sortParam);
    const products = yahooProducts.map(convertYahooToRakutenFormat);

    console.log(`[Yahoo Shopping API] Found ${products.length} products for subcategory ${categoryIdNum}`);

    // Сохраняем в кеш
    categoryCache.set(cacheKey, {
      products,
      timestamp: Date.now(),
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('[Yahoo Shopping API] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
