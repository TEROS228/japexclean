import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

// In-memory кеш для товаров
interface CacheEntry {
  product: any;
  timestamp: number;
}

const productCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

// Очистка устаревших записей из кеша
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of productCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      productCache.delete(key);
      console.log('[Cache] Removed expired entry:', key);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Проверяем кеш
  const cachedEntry = productCache.get(url);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    console.log('[Yahoo Product By URL] Returning from cache:', url);
    return res.status(200).json({ success: true, product: cachedEntry.product, cached: true });
  }

  try {
    console.log('[Yahoo Product By URL] Fetching product from:', url);

    // Периодически очищаем устаревший кеш
    if (Math.random() < 0.1) { // 10% шанс
      cleanExpiredCache();
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Блокируем ненужные ресурсы для ускорения
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded', // Быстрее чем networkidle2
      timeout: 15000,
    });

    // Минимальная задержка для рендеринга основного контента
    await new Promise(resolve => setTimeout(resolve, 500));

    const productData = await page.evaluate(() => {
      // Название товара
      const itemName =
        document.querySelector('h1[itemprop="name"]')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() ||
        document.title?.trim() ||
        '';

      // Цена
      let itemPrice = 0;
      const priceElement = document.querySelector('[itemprop="price"]');
      if (priceElement) {
        const priceContent = priceElement.getAttribute('content');
        if (priceContent) {
          itemPrice = parseInt(priceContent.replace(/[^\d]/g, '')) || 0;
        } else {
          const priceText = priceElement.textContent || '';
          const match = priceText.match(/[\d,]+/);
          if (match) {
            itemPrice = parseInt(match[0].replace(/,/g, '')) || 0;
          }
        }
      }

      // Если не нашли, ищем по другим селекторам
      if (itemPrice === 0) {
        const priceSelectors = ['.mdPrice', '.elPrice', '[class*="price"]'];
        for (const selector of priceSelectors) {
          const el = document.querySelector(selector);
          if (el?.textContent) {
            const match = el.textContent.match(/[\d,]+/);
            if (match) {
              const price = parseInt(match[0].replace(/,/g, ''));
              if (price > 0) {
                itemPrice = price;
                break;
              }
            }
          }
        }
      }

      // Описание
      const itemCaption =
        document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
        document.querySelector('.mdDescription')?.textContent?.trim() ||
        '';

      // Магазин
      const shopName =
        document.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
        document.querySelector('.elShopName')?.textContent?.trim() ||
        '';

      // Изображения
      const images: string[] = [];
      const imageSet = new Set<string>();

      console.log('[Images] Starting image collection...');

      // 1. Meta og:image (приоритет)
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      console.log('[Images] og:image:', ogImage);
      if (ogImage && !imageSet.has(ogImage)) {
        imageSet.add(ogImage);
        images.push(ogImage);
      }

      // 2. Все изображения на странице - фильтруем по домену
      const allImages = Array.from(document.querySelectorAll('img'));
      console.log('[Images] Total img elements on page:', allImages.length);

      allImages.forEach((img: HTMLImageElement) => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
        if (!src) return;

        // Преобразуем в абсолютный URL
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        } else if (src.startsWith('/')) {
          fullUrl = window.location.origin + src;
        }

        // Проверяем что это изображение товара
        const isProductImage =
          fullUrl.includes('img.zozo') ||
          fullUrl.includes('item-shopping.c.yimg.jp') ||
          fullUrl.includes('c.yimg.jp/i/');

        // Исключаем служебные изображения
        const isNotProductImage =
          fullUrl.includes('icon') ||
          fullUrl.includes('banner') ||
          fullUrl.includes('logo') ||
          fullUrl.includes('btn') ||
          fullUrl.includes('button') ||
          fullUrl.includes('/common/') ||
          fullUrl.includes('header') ||
          fullUrl.includes('footer');

        if (isProductImage && !isNotProductImage && img.naturalWidth >= 200 && !imageSet.has(fullUrl)) {
          imageSet.add(fullUrl);
          images.push(fullUrl);
          console.log('[Images] Added:', fullUrl.substring(0, 100));
        }
      });

      console.log('[Images] Total images collected:', images.length);

      // Если не нашли изображения, добавляем хотя бы og:image
      if (images.length === 0 && ogImage) {
        images.push(ogImage);
        console.log('[Images] Fallback to og:image only');
      }

      // Бесплатная доставка
      const freeShipping = document.body.textContent?.includes('送料無料') || false;

      // Рейтинг и отзывы
      let reviewAverage = 0;
      let reviewCount = 0;

      const ratingElement = document.querySelector('[itemprop="ratingValue"]');
      if (ratingElement) {
        reviewAverage = parseFloat(ratingElement.getAttribute('content') || '0');
      }

      const reviewCountElement = document.querySelector('[itemprop="reviewCount"]');
      if (reviewCountElement) {
        reviewCount = parseInt(reviewCountElement.getAttribute('content') || '0');
      }

      return {
        itemName,
        itemPrice,
        itemCaption,
        shopName,
        images,
        freeShipping,
        reviewAverage,
        reviewCount,
      };
    });

    await browser.close();

    // Извлекаем код товара из URL
    let itemCode = '';
    let shopCode = '';

    const storeMatch = url.match(/store\.shopping\.yahoo\.co\.jp\/([^\/]+)\/([^\/\?\.]+)/);
    if (storeMatch) {
      shopCode = storeMatch[1];
      const code = storeMatch[2];
      itemCode = `${shopCode}_${code}`;
    }

    const productsMatch = url.match(/shopping\.yahoo\.co\.jp\/products\/([^\/\?]+)/);
    if (!itemCode && productsMatch) {
      itemCode = productsMatch[1];
    }

    const payPayMatch = url.match(/paypaymall\.yahoo\.co\.jp\/store\/([^\/]+)\/item\/([^\/\?]+)/);
    if (!itemCode && payPayMatch) {
      shopCode = payPayMatch[1];
      const code = payPayMatch[2];
      itemCode = `${shopCode}_${code}`;
    }

    console.log('[Yahoo Product By URL] Parsed product:', {
      itemName: productData.itemName,
      itemPrice: productData.itemPrice,
      itemCode,
      imagesCount: productData.images.length,
    });

    // Формируем товар в формате, совместимом с Rakuten
    const product = {
      itemCode,
      itemName: productData.itemName,
      itemPrice: productData.itemPrice,
      itemCaption: productData.itemCaption,
      shopName: productData.shopName,
      shopCode,
      itemUrl: url,
      imageUrl: productData.images[0] || '/placeholder.png',
      mediumImageUrls: productData.images.length > 0
        ? productData.images.map(img => ({ imageUrl: img }))
        : [{ imageUrl: '/placeholder.png' }],
      postageFlag: productData.freeShipping ? 1 : 0,
      reviewAverage: productData.reviewAverage,
      reviewCount: productData.reviewCount,
      availability: 1,
      _source: 'yahoo',
    };

    // Сохраняем в кеш
    productCache.set(url, {
      product,
      timestamp: Date.now(),
    });
    console.log('[Cache] Saved product to cache:', url);

    return res.status(200).json({ success: true, product, cached: false });
  } catch (error) {
    console.error('[Yahoo Product By URL] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch product from URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
