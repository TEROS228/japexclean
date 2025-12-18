import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

// In-memory кеш для изображений
interface CacheEntry {
  images: string[];
  timestamp: number;
}

const imagesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

// Очистка устаревших записей из кеша
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of imagesCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      imagesCache.delete(key);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Проверяем кеш
  const cachedEntry = imagesCache.get(url);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    console.log('[Yahoo Images] Returning from cache:', url, '(', cachedEntry.images.length, 'images)');
    return res.status(200).json({
      images: cachedEntry.images.slice(0, 10),
      success: true,
      cached: true
    });
  }

  try {
    console.log('[Yahoo Images] Fetching images from:', url);

    // Периодически очищаем устаревший кеш
    if (Math.random() < 0.1) {
      cleanExpiredCache();
    }

    let browser;
    let page;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Ждем загрузки изображений
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (navError) {
      console.error('[Yahoo Images] Navigation error:', navError);
      if (browser) await browser.close();
      throw navError;
    }

    let images: string[] = [];

    try {
      images = await page.evaluate(() => {
        const imageSet = new Set<string>();
        const images: string[] = [];

        const enhanceImageUrl = (url: string): string => {
          if (!url) return '';

          // Преобразуем относительные URL в абсолютные
          if (url.startsWith('//')) {
            url = 'https:' + url;
          } else if (url.startsWith('/')) {
            url = window.location.origin + url;
          }

          let upgraded = url.replace(/^http:/, 'https:');

          // Увеличиваем размер для Yahoo/ZOZO изображений
          if (upgraded.includes('_ex=')) {
            upgraded = upgraded.replace(/_ex=\d+x\d+/, '_ex=600x600');
          } else if (upgraded.includes('c.yimg.jp') && !upgraded.includes('_ex=')) {
            upgraded += (upgraded.includes('?') ? '&' : '?') + '_ex=600x600';
          }

          return upgraded;
        };

        const addImage = (url: string | null | undefined) => {
          if (!url) return;

          const enhanced = enhanceImageUrl(url);

          // Фильтруем только изображения товаров
          const isProductImage =
            enhanced.includes('item-shopping.c.yimg.jp') ||
            enhanced.includes('c.yimg.jp/i/') ||
            enhanced.includes('img.zozo') ||
            enhanced.includes('/images/') ||
            (enhanced.includes('.jpg') || enhanced.includes('.jpeg') || enhanced.includes('.png'));

          // Исключаем иконки, баннеры и лого
          const isNotProductImage =
            enhanced.includes('icon') ||
            enhanced.includes('banner') ||
            enhanced.includes('logo') ||
            enhanced.includes('button') ||
            enhanced.includes('/common/') ||
            enhanced.includes('header') ||
            enhanced.includes('footer') ||
            enhanced.includes('nav');

          if (isProductImage && !isNotProductImage && !imageSet.has(enhanced)) {
            imageSet.add(enhanced);
            images.push(enhanced);
          }
        };

        // 1. Meta og:image
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        addImage(ogImage);

        // 2. Основное изображение товара
        const mainImage = document.querySelector('img[class*="mainImage"], img[class*="ProductImage"], #itemImage') as HTMLImageElement;
        if (mainImage) {
          addImage(mainImage.src);
          addImage(mainImage.getAttribute('data-zoom'));
          addImage(mainImage.getAttribute('data-src'));
        }

        // 3. Все изображения в галерее/миниатюрах
        document.querySelectorAll('img[class*="thumbnail"], img[class*="Thumbnail"], .thumbnails img, ul.photo img').forEach((img: Element) => {
          const imgEl = img as HTMLImageElement;
          addImage(imgEl.src);
          addImage(imgEl.getAttribute('data-src'));
          addImage(imgEl.getAttribute('data-zoom'));
          addImage(imgEl.getAttribute('data-image'));
        });

        // 4. ZOZO специфичные селекторы
        document.querySelectorAll('img[src*="img.zozo"], img[src*="c.yimg.jp/i/"]').forEach((img: Element) => {
          const imgEl = img as HTMLImageElement;
          if (imgEl.naturalWidth >= 200) { // Только большие изображения
            addImage(imgEl.src);
          }
        });

        // 5. Все img с item-shopping в src
        document.querySelectorAll('img[src*="item-shopping"]').forEach((img: Element) => {
          const imgEl = img as HTMLImageElement;
          if (imgEl.naturalWidth >= 200) {
            addImage(imgEl.src);
          }
        });

        return images;
      });
    } finally {
      // Всегда закрываем браузер, даже если была ошибка
      if (browser) {
        await browser.close();
      }
    }

    console.log('[Yahoo Images] Found images:', images.length);

    // Сохраняем в кеш
    imagesCache.set(url, {
      images,
      timestamp: Date.now(),
    });

    return res.status(200).json({
      images: images.slice(0, 1), // Только первое изображение в максимальном качестве
      success: true,
      cached: false
    });

  } catch (error) {
    console.error('[Yahoo Images] Error:', error);
    console.error('[Yahoo Images] Error stack:', (error as Error).stack);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
}
