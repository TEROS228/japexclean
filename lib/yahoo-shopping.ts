import fetch from "node-fetch";
import { YAHOO_KEYWORDS } from './yahoo-keywords-generator';
import { cached } from './cache';

const YAHOO_APP_ID = process.env.NEXT_PUBLIC_YAHOO_APP_ID || "";
const YAHOO_API_URL = "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

/**
 * Улучшает URL изображения для получения максимального качества
 */
function upgradeYahooImageUrl(url: string | undefined): string {
  if (!url) return '';

  // Yahoo Shopping использует параметр _ex для размера
  // Заменяем на максимальный размер 600x600
  let upgraded = url.replace(/^http:/, 'https:');

  if (upgraded.includes('_ex=')) {
    upgraded = upgraded.replace(/_ex=\d+x\d+/, '_ex=600x600');
  } else if (upgraded.includes('?')) {
    upgraded += '&_ex=600x600';
  } else {
    upgraded += '?_ex=600x600';
  }

  return upgraded;
}

export interface YahooProduct {
  index: number;
  name: string;
  description: string;
  headLine: string;
  url: string;
  inStock: boolean;
  code: string;
  condition: string;
  imageId: string;
  image: {
    small: string;
    medium: string;
  };
  review: {
    count: number;
    url: string;
    rate: number;
  };
  price: number;
  genreCategory: {
    id: number;
    name: string;
    depth: number;
  };
  parentGenreCategories: Array<{
    id: number;
    depth: number;
    name: string;
  }>;
  brand: {
    id: number | null;
    name: string;
  };
  seller: {
    sellerId: string;
    name: string;
    url: string;
    isBestSeller: boolean;
    review: {
      rate: number;
      count: number;
    };
  };
  shipping: {
    code: number;
    name: string;
  };
  janCode: string;
}

export interface YahooSearchResponse {
  totalResultsAvailable: number;
  totalResultsReturned: number;
  firstResultsPosition: number;
  request: {
    query: string;
  };
  hits: YahooProduct[];
}

/**
 * Нормализация поискового запроса для Yahoo Shopping
 */
function normalizeYahooSearchQuery(query: string): string {
  return query
    .trim()
    // Удаляем лишние пробелы
    .replace(/\s+/g, ' ')
    // Удаляем специальные символы, которые могут вызвать ошибки API
    .replace(/[<>]/g, '');
}

/**
 * Поиск товаров в Yahoo Shopping
 */
export async function searchYahooProducts(
  keyword: string,
  page: number = 1,
  hits: number = 20,
  sort?: string
): Promise<YahooProduct[]> {
  if (!YAHOO_APP_ID) {
    console.error('[Yahoo Shopping] APP_ID not configured');
    return [];
  }

  try {
    const start = (page - 1) * hits + 1;

    // Нормализуем поисковый запрос
    const normalizedKeyword = normalizeYahooSearchQuery(keyword);

    // Формируем параметры запроса для улучшения релевантности
    const params = new URLSearchParams({
      appid: YAHOO_APP_ID,
      query: normalizedKeyword,
      results: String(hits),
      start: String(start),
      // Сортировка по количеству отзывов (популярности) по умолчанию
      sort: sort || '-review',
      // Только товары в наличии
      availability: '1',
      // Поиск в заголовке и описании
      search: '0',
    });

    // Если сортировка явно не указана, используем -review (по количеству отзывов)
    if (!sort) {
      params.set('sort', '-review');
    }

    const url = `${YAHOO_API_URL}?${params.toString()}`;
    console.log('[Yahoo Shopping] Request:', { keyword, page, hits, sort });
    console.log('[Yahoo Shopping] Full URL:', url);

    let response = await fetch(url);

    // Если ошибка 400 и используется сортировка, пробуем без сортировки
    if (!response.ok && response.status === 400 && sort) {
      console.log('[Yahoo Shopping] Retrying without sort for keyword:', keyword);
      const paramsWithoutSort = new URLSearchParams({
        appid: YAHOO_APP_ID,
        query: normalizedKeyword,
        results: String(hits),
        start: String(start),
      });
      const urlWithoutSort = `${YAHOO_API_URL}?${paramsWithoutSort.toString()}`;
      response = await fetch(urlWithoutSort);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Yahoo Shopping] Error response:', errorText);
      throw new Error(`Yahoo Shopping API error: ${response.status}`);
    }

    const data = await response.json() as YahooSearchResponse;
    console.log('[Yahoo Shopping] Found:', data.totalResultsAvailable, 'items');

    // Улучшаем качество изображений и фильтруем результаты
    let products = (data.hits || []).map(product => ({
      ...product,
      image: {
        small: upgradeYahooImageUrl(product.image?.small),
        medium: upgradeYahooImageUrl(product.image?.medium)
      }
    }));

    // Фильтруем товары для улучшения качества результатов
    products = products.filter(product => {
      // Удаляем товары без названия
      if (!product.name || product.name.trim().length === 0) return false;
      // Удаляем товары без изображений
      if (!product.image?.medium && !product.image?.small && !product.imageId) return false;
      // Удаляем товары с нулевой ценой
      if (!product.price || product.price <= 0) return false;
      return true;
    });

    // Дедупликация по code
    const seen = new Set();
    products = products.filter(product => {
      if (seen.has(product.code)) return false;
      seen.add(product.code);
      return true;
    });

    // Если получили пустой результат при сортировке по цене, пробуем без сортировки
    if (products.length === 0 && sort && (sort === '+price' || sort === '-price')) {
      console.log('[Yahoo Shopping] Empty result with price sort, retrying without sort');
      const paramsRetry = new URLSearchParams({
        appid: YAHOO_APP_ID,
        query: normalizedKeyword,
        results: String(hits),
        start: String(start),
        availability: '1',
        search: '0',
      });
      const retryResponse = await fetch(`${YAHOO_API_URL}?${paramsRetry.toString()}`);
      if (retryResponse.ok) {
        const retryData = await retryResponse.json() as YahooSearchResponse;
        let retryProducts = (retryData.hits || []).map(product => ({
          ...product,
          image: {
            small: upgradeYahooImageUrl(product.image?.small),
            medium: upgradeYahooImageUrl(product.image?.medium)
          }
        }));

        // Применяем фильтры
        retryProducts = retryProducts.filter(product => {
          if (!product.name || product.name.trim().length === 0) return false;
          if (!product.image?.medium && !product.image?.small && !product.imageId) return false;
          if (!product.price || product.price <= 0) return false;
          return true;
        });

        // Сортируем на клиенте
        if (retryProducts.length > 0) {
          console.log(`[Yahoo Shopping] Got ${retryProducts.length} items, sorting on client side`);
          retryProducts.sort((a, b) => {
            if (sort === '+price') return a.price - b.price;
            if (sort === '-price') return b.price - a.price;
            return 0;
          });
          products = retryProducts;
        }
      }
    }

    return products;
  } catch (error) {
    console.error('[Yahoo Shopping] Error:', error);
    return [];
  }
}

/**
 * Получить товары по категории
 */
export async function getYahooProductsByCategory(
  categoryId: number,
  page: number = 1,
  hits: number = 20,
  sort?: string
): Promise<YahooProduct[]> {
  if (!YAHOO_APP_ID) {
    console.error('[Yahoo Shopping] APP_ID not configured');
    return [];
  }

  try {
    const start = (page - 1) * hits + 1;

    const params = new URLSearchParams({
      appid: YAHOO_APP_ID,
      genre_category_id: String(categoryId),
      results: String(hits),
      start: String(start),
    });

    // Yahoo API не поддерживает одновременное использование genre_category_id и query
    // Используем только genre_category_id для фильтрации по категории

    // Добавляем сортировку (по умолчанию по количеству отзывов)
    if (sort) {
      params.append('sort', sort);
    } else {
      params.append('sort', '-review');
    }

    const url = `${YAHOO_API_URL}?${params.toString()}`;
    console.log('[Yahoo Shopping] Category request:', { categoryId, page, hits, sort });
    console.log('[Yahoo Shopping] Full URL:', url);

    let response = await fetch(url);

    // Если ошибка 400 и используется сортировка, пробуем без сортировки
    if (!response.ok && response.status === 400 && sort) {
      console.log('[Yahoo Shopping] Retrying without sort for category:', categoryId);
      const paramsWithoutSort = new URLSearchParams({
        appid: YAHOO_APP_ID,
        genre_category_id: String(categoryId),
        results: String(hits),
        start: String(start),
      });
      const urlWithoutSort = `${YAHOO_API_URL}?${paramsWithoutSort.toString()}`;
      response = await fetch(urlWithoutSort);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Yahoo Shopping] Error response:', errorText);
      throw new Error(`Yahoo Shopping API error: ${response.status}`);
    }

    const data = await response.json() as YahooSearchResponse;
    console.log('[Yahoo Shopping] Found:', data.totalResultsAvailable, 'total items available');

    // Улучшаем качество изображений
    let productsWithUpgradedImages = (data.hits || []).map(product => ({
      ...product,
      image: {
        small: upgradeYahooImageUrl(product.image?.small),
        medium: upgradeYahooImageUrl(product.image?.medium)
      }
    }));

    // Если получили пустой результат при сортировке по цене, пробуем без сортировки
    if (productsWithUpgradedImages.length === 0 && sort && (sort === '+price' || sort === '-price')) {
      console.log('[Yahoo Shopping] Empty result with price sort, retrying without sort for category');
      const paramsRetry = new URLSearchParams({
        appid: YAHOO_APP_ID,
        genre_category_id: String(categoryId),
        results: String(hits),
        start: String(start),
      });
      const retryResponse = await fetch(`${YAHOO_API_URL}?${paramsRetry.toString()}`);
      if (retryResponse.ok) {
        const retryData = await retryResponse.json() as YahooSearchResponse;
        let retryProducts = (retryData.hits || []).map(product => ({
          ...product,
          image: {
            small: upgradeYahooImageUrl(product.image?.small),
            medium: upgradeYahooImageUrl(product.image?.medium)
          }
        }));

        // Сортируем на клиенте
        if (retryProducts.length > 0) {
          console.log(`[Yahoo Shopping] Got ${retryProducts.length} items, sorting on client side`);
          retryProducts.sort((a, b) => {
            if (sort === '+price') return a.price - b.price;
            if (sort === '-price') return b.price - a.price;
            return 0;
          });
          productsWithUpgradedImages = retryProducts;
        }
      }
    }

    console.log(`[Yahoo Shopping] Returning ${productsWithUpgradedImages.length} items from category ${categoryId}`);
    return productsWithUpgradedImages;
  } catch (error) {
    console.error('[Yahoo Shopping] Error:', error);
    return [];
  }
}

/**
 * Получить URL изображения в максимальном качестве для Yahoo Shopping
 * Yahoo использует разные форматы URL в зависимости от источника
 */
function getBestYahooImageUrl(yahooProduct: YahooProduct): string {
  // Если есть imageId, строим URL максимального качества
  if (yahooProduct.imageId) {
    const imageId = yahooProduct.imageId;
    const finalUrl = `https://item-shopping.c.yimg.jp/i/j/${imageId}?_ex=600x600`;
    return finalUrl;
  }

  // Если есть medium или small, пытаемся извлечь imageId из URL
  const imageUrl = yahooProduct.image?.medium || yahooProduct.image?.small || '';
  if (imageUrl) {
    // Пытаемся извлечь imageId из URL типа: https://item-shopping.c.yimg.jp/i/n/shopcode_itemid
    const match = imageUrl.match(/\/i\/[a-z]\/([^?]+)/);
    if (match && match[1]) {
      // Используем извлеченный imageId для создания URL максимального качества
      const finalUrl = `https://item-shopping.c.yimg.jp/i/j/${match[1]}?_ex=600x600`;
      return finalUrl;
    }
    // Если не удалось извлечь imageId, улучшаем существующий URL
    const upgradedUrl = upgradeYahooImageUrl(imageUrl);
    return upgradedUrl;
  }

  return '';
}

/**
 * Конвертировать товар Yahoo в формат Rakuten (для совместимости)
 */
export function convertYahooToRakutenFormat(yahooProduct: YahooProduct) {
  // Получаем URL изображения в максимальном качестве
  const bestImageUrl = getBestYahooImageUrl(yahooProduct);

  // Используем только одно изображение в максимальном качестве
  const images = bestImageUrl ? [bestImageUrl] : [];

  // Yahoo Shopping API: shipping.code === 1 означает бесплатную доставку
  const postageFlag = yahooProduct.shipping?.code === 1 ? 1 : 0;

  const result = {
    itemCode: yahooProduct.code,
    itemName: yahooProduct.name,
    itemCaption: yahooProduct.description,
    catchcopy: yahooProduct.headLine,
    itemPrice: yahooProduct.price,
    itemUrl: yahooProduct.url,
    imageUrl: bestImageUrl,
    mediumImageUrls: images.map(img => ({ imageUrl: img })),
    availability: yahooProduct.inStock ? 1 : 0,
    postageFlag: postageFlag,
    reviewCount: yahooProduct.review.count,
    reviewAverage: yahooProduct.review.rate,
    shopName: yahooProduct.seller.name,
    shopCode: yahooProduct.seller.sellerId,
    genreId: yahooProduct.genreCategory?.id || 0,
    genreName: yahooProduct.genreCategory?.name || '',
    // Дополнительные поля специфичные для Yahoo
    _source: 'yahoo',
    _yahooData: {
      janCode: yahooProduct.janCode,
      brand: yahooProduct.brand,
      shipping: yahooProduct.shipping,
      parentCategories: yahooProduct.parentGenreCategories,
      imageId: yahooProduct.imageId,
    }
  };

  return result;
}

/**
 * Маппинг сортировок Rakuten -> Yahoo
 */
export function mapSortToYahoo(rakutenSort: string): string {
  switch (rakutenSort) {
    case 'lowest':
      return '+price';
    case 'highest':
      return '-price';
    case 'rating':
      return '-review';
    case 'popular':
      return '-sold'; // По количеству продаж
    default:
      return '-review'; // По умолчанию по количеству отзывов (популярность)
  }
}
