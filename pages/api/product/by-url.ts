import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import { getProductByUrl } from "@/lib/rakuten";

// Простой кэш для ускорения повторных запросов
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 минут

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Проверяем кэш
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.status(200).json(cached.data);
  }

  try {
    // Сначала пробуем получить через Rakuten API (быстрее и надежнее)
        const rakutenProduct = await getProductByUrl(url);

    if (rakutenProduct && rakutenProduct.itemCode) {
            const response = {
        success: true,
        product: rakutenProduct,
      };

      // Сохраняем в кэш
      cache.set(url, { data: response, timestamp: Date.now() });

      return res.status(200).json(response);
    }

    // Если Rakuten API не вернул товар, используем Puppeteer
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-web-security"
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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "domcontentloaded", // Быстрее чем networkidle2
      timeout: 60000, // Увеличили timeout до 60 секунд
    });

    // Извлекаем данные товара с улучшенным парсингом
    const product = await page.evaluate(() => {
      // Название товара - пробуем разные селекторы
      let itemName =
        document.querySelector('h1[itemprop="name"]')?.textContent?.trim() ||
        document.querySelector('h1.item_name')?.textContent?.trim() ||
        document.querySelector('.item_name h1')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() ||
        document.title?.trim() ||
        "";

      // Если название из title, очищаем от лишней информации
      if (itemName.includes('【楽天市場】')) {
        itemName = itemName.replace('【楽天市場】', '').split('：')[0].trim();
      }

      // Цена - пробуем разные селекторы и подходы
      let itemPrice = 0;

      // Сначала пробуем найти по аттрибутам
      const priceContent = document.querySelector('[itemprop="price"]')?.getAttribute('content');
      if (priceContent) {
        itemPrice = parseInt(priceContent.replace(/[^\d]/g, "")) || 0;
      }

      // Если не нашли, ищем в тексте
      if (itemPrice === 0) {
        const priceSelectors = [
          '[itemprop="price"]',
          '.price2',
          '.price',
          '[class*="price"]',
          '#priceArea',
          '.priceArea'
        ];

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

      // Изображения товара - улучшенный алгоритм
      const images: string[] = [];

      // 1. Приоритет: главное изображение товара
      const mainImageSelectors = [
        '[itemprop="image"]',
        '#rakutenLimitedId_ImageMain img',
        'img[id*="mainImage"]',
        'img[class*="mainImage"]'
      ];

      for (const selector of mainImageSelectors) {
        const img = document.querySelector(selector) as HTMLImageElement;
        if (img?.src && img.src.includes('tshop.r10s.jp')) {
          let imgSrc = img.src.replace('_ex=128x128', '_ex=600x600')
                              .replace('_ex=200x200', '_ex=600x600')
                              .replace('_ex=300x300', '_ex=600x600')
                              .replace('_ex=400x400', '_ex=600x600');
          if (!images.includes(imgSrc)) {
            images.push(imgSrc);
            break;
          }
        }
      }

      // 2. Галерея миниатюр (только из специальных контейнеров)
      const gallerySelectors = [
        '#rakutenLimitedId_thumblist img',
        'div[class*="thumbnail"] img',
        'div[class*="gallery"] img',
        'ul[class*="thumb"] img'
      ];

      for (const selector of gallerySelectors) {
        const thumbs = document.querySelectorAll(selector);
        thumbs.forEach((img: any) => {
          if (img.src && img.src.includes('tshop.r10s.jp') &&
              img.naturalWidth >= 100 && img.naturalHeight >= 100) {
            let src = img.src.replace(/_ex=\d+x\d+/, '_ex=600x600');
            if (!images.includes(src) && images.length < 8) {
              images.push(src);
            }
          }
        });
        if (images.length >= 8) break;
      }

      // 3. Только если нашли мало изображений, ищем дополнительные
      if (images.length < 3) {
        const allImages = document.querySelectorAll('img[src*="tshop.r10s.jp"]');
        const validImages: string[] = [];

        allImages.forEach((img: any) => {
          const src = img.src;
          const isValid = src &&
            !src.includes('/button/') &&
            !src.includes('/icon/') &&
            !src.includes('/banner/') &&
            !src.includes('/logo/') &&
            !src.includes('/common/') &&
            !src.match(/header|footer|menu|nav|sidebar/i) &&
            img.naturalWidth >= 300 &&
            img.naturalHeight >= 300;

          if (isValid) {
            const upgraded = src.replace(/_ex=\d+x\d+/, '_ex=600x600');
            if (!validImages.includes(upgraded)) {
              validImages.push(upgraded);
            }
          }
        });

        // Добавляем только если действительно нужно
        validImages.slice(0, 8 - images.length).forEach(src => {
          if (!images.includes(src)) images.push(src);
        });
      }

      // Ограничиваем до 8 изображений
      images.splice(8);

      // Описание
      const itemCaption =
        document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
        document.querySelector('.item_desc')?.textContent?.trim() ||
        document.querySelector('.description')?.textContent?.trim() ||
        "";

      // Название магазина
      const shopName =
        document.querySelector('.shop_name')?.textContent?.trim() ||
        document.querySelector('[class*="shop"]')?.textContent?.trim() ||
        "";

      return {
        itemName,
        itemPrice,
        itemCaption,
        shopName,
        images,
        itemUrl: window.location.href,
      };
    });

    // Извлекаем itemCode из URL
    const itemCodeMatch = url.match(/item\.rakuten\.co\.jp\/[^\/]+\/([^\/\?]+)/);
    const itemCode = itemCodeMatch ? itemCodeMatch[1] : "";

    
    // Форматируем данные в стиле Rakuten API
    const formattedProduct = {
      itemCode,
      itemName: product.itemName,
      itemPrice: product.itemPrice,
      itemCaption: product.itemCaption,
      shopName: product.shopName,
      itemUrl: product.itemUrl,
      imageUrl: product.images[0] || "/placeholder.png",
      mediumImageUrls: product.images.length > 0
        ? product.images.map((img) => ({ imageUrl: img }))
        : [{ imageUrl: "/placeholder.png" }],
    };

    const response = {
      success: true,
      product: formattedProduct,
    };

    // Сохраняем в кэш
    cache.set(url, { data: response, timestamp: Date.now() });

    // Очищаем старые записи из кэша
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    return res.status(200).json(response);
    } finally {
      // Закрываем браузер в любом случае (успех или ошибка)
      if (browser) {
        await browser.close();
      }
    }
  } catch (error: any) {
    console.error("Error fetching product by URL:", error);
    return res.status(500).json({
      error: "Failed to fetch product",
      message: error.message,
    });
  }
}
