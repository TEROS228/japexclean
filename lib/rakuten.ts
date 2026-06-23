import fetch from "node-fetch";
import { GENERATED_KEYWORDS } from './category-keywords-generator';
import { cached, cacheGet, cacheSet } from './cache';

const RAKUTEN_APP_ID = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID || "";
const RAKUTEN_API_URL =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706";
const RAKUTEN_GENRE_API_URL =
  "https://app.rakuten.co.jp/services/api/IchibaGenre/Search/20140222";

export interface VariantValue {
  value: string;
  itemCode: string;
}

export interface Variant {
  optionName: string;
  values: VariantValue[];
}

function upgradeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  let newUrl = url.replace(/^http:/, "https:");
  if (newUrl.includes("_ex=")) newUrl = newUrl.replace(/_ex=\d+x\d+/, "_ex=600x600");
  return newUrl;
}

function getBestImageUrl(product: any): string | null {
  if (product.mediumImageUrls?.[0]?.imageUrl) return upgradeImageUrl(product.mediumImageUrls[0].imageUrl);
  if (product.largeImageUrl) return upgradeImageUrl(product.largeImageUrl);
  if (product.thumbnailImageUrl) return upgradeImageUrl(product.thumbnailImageUrl);
  return null;
}

function buildProductFromRakutenItem(product: any) {
  const isProductImage = (url: string) =>
    url.includes('thumbnail.image.rakuten.co.jp') ||
    url.includes('tshop.r10s.jp') ||
    url.includes('r10s.jp');

  const mainImageUrl = getBestImageUrl(product);
  const images: Array<{ imageUrl: string }> = [];
  if (mainImageUrl) images.push({ imageUrl: mainImageUrl });

  product.mediumImageUrls?.forEach((img: any) => {
    const upgraded = upgradeImageUrl(img.imageUrl);
    if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
      images.push({ imageUrl: upgraded });
    }
  });

  if (images.length < 5) {
    product.smallImageUrls?.forEach((img: any) => {
      const upgraded = upgradeImageUrl(img.imageUrl);
      if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
        images.push({ imageUrl: upgraded });
      }
    });
  }

  return {
    itemCode: product.itemCode,
    itemName: product.itemName,
    catchcopy: product.catchcopy,
    itemCaption: product.itemCaption,
    itemPrice: product.itemPrice,
    itemUrl: product.itemUrl,
    affiliateUrl: product.affiliateUrl,
    imageUrl: mainImageUrl || '/placeholder.png',
    availability: product.availability,
    taxFlag: product.taxFlag,
    postageFlag: product.postageFlag,
    creditCardFlag: product.creditCardFlag,
    shopOfTheYearFlag: product.shopOfTheYearFlag,
    shipOverseasFlag: product.shipOverseasFlag,
    asurakuFlag: product.asurakuFlag,
    mediumImageUrls: images.length > 0 ? images : [{ imageUrl: '/placeholder.png' }],
    reviewCount: product.reviewCount,
    reviewAverage: product.reviewAverage,
    shopName: product.shopName,
    shopCode: product.shopCode,
    genreId: product.genreId,
    genreName: product.genreName || null,
  };
}

// Получить товар по URL
export async function getProductByUrl(rakutenUrl: string) {
  return cached(
    `rakuten:product:url:${rakutenUrl}`,
    async () => {
      if (!RAKUTEN_APP_ID) {
        console.error('[Rakuten API] Missing RAKUTEN_APP_ID');
        return null;
      }

      // Извлекаем shopCode и itemCode из URL
      // URL формат: https://item.rakuten.co.jp/{shopCode}/{itemCode}/
      const urlMatch = rakutenUrl.match(/item\.rakuten\.co\.jp\/([^\/]+)\/([^\/\?]+)/);
      if (!urlMatch) {
        console.error('[Rakuten API] Failed to extract shopCode and itemCode from URL:', rakutenUrl);
        return null;
      }

      const shopCode = urlMatch[1];
      const itemCode = urlMatch[2];

      // Извлекаем числовой код из slug (например "shorts-10100284" → "10100284")
      const numericCode = itemCode.match(/(\d{5,})/)?.[1];

      // Пробуем поиск по shopCode:itemCode (полный идентификатор товара)
      const fullItemCode = `${shopCode}:${itemCode}`;

      const url = `${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(
        RAKUTEN_APP_ID
      )}&itemCode=${encodeURIComponent(fullItemCode)}&format=json`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          console.error('[Rakuten API] HTTP error:', res.status, errorText.substring(0, 200));

          // Если есть числовой код в slug — пробуем его как itemCode напрямую
          if (numericCode && res.status === 400) {
            const numericItemCode = `${shopCode}:${numericCode}`;
            const numRes = await fetch(`${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}&itemCode=${encodeURIComponent(numericItemCode)}&format=json`);
            if (numRes.ok) {
              const numData: any = await numRes.json();
              const numProduct = numData.Items?.[0]?.Item;
              if (numProduct) {
                console.log('[Rakuten API] Found by numeric code:', numericItemCode);
                return buildProductFromRakutenItem(numProduct);
              }
            }
          }

          if (res.status === 400) {
            return await getProductByShopCode(shopCode, itemCode);
          }

          return null;
        }

        const data: any = await res.json();
        const product = data.Items?.[0]?.Item;

        if (!product) {
          // Если есть числовой код — пробуем его
          if (numericCode) {
            const numericItemCode = `${shopCode}:${numericCode}`;
            const numRes = await fetch(`${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}&itemCode=${encodeURIComponent(numericItemCode)}&format=json`);
            if (numRes.ok) {
              const numData: any = await numRes.json();
              const numProduct = numData.Items?.[0]?.Item;
              if (numProduct) {
                console.log('[Rakuten API] Found by numeric code:', numericItemCode);
                return buildProductFromRakutenItem(numProduct);
              }
            }
          }
          return await getProductByShopCode(shopCode, itemCode);
        }


    // Только товарные CDN-домены Rakuten (не баннеры магазина)
    const isProductImage = (url: string) =>
      url.includes('thumbnail.image.rakuten.co.jp') ||
      url.includes('tshop.r10s.jp') ||
      url.includes('r10s.jp');

    // Главное изображение товара
    const mainImageUrl = getBestImageUrl(product);

    const images: Array<{ imageUrl: string }> = [];
    if (mainImageUrl) images.push({ imageUrl: mainImageUrl });

    // Добавляем mediumImageUrls только с товарных CDN-доменов
    if (product.mediumImageUrls && product.mediumImageUrls.length > 0) {
      product.mediumImageUrls.forEach((img: any) => {
        if (img.imageUrl) {
          const upgraded = upgradeImageUrl(img.imageUrl);
          if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
            images.push({ imageUrl: upgraded });
          }
        }
      });
    }

    // Добавляем smallImageUrls только с товарных CDN-доменов если мало изображений
    if (images.length < 5 && product.smallImageUrls && product.smallImageUrls.length > 0) {
      product.smallImageUrls.forEach((img: any) => {
        if (img.imageUrl) {
          const upgraded = upgradeImageUrl(img.imageUrl);
          if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
            images.push({ imageUrl: upgraded });
          }
        }
      });
    }

    // Используем genreName из товара, не делаем дополнительный запрос для ускорения
    const genreName = product.genreName || null;

    console.log('[Rakuten Images] mediumImageUrls raw:', product.mediumImageUrls?.map((i: any) => i.imageUrl));
    console.log('[Rakuten Images] collected images:', images.map(i => i.imageUrl));
    return {
      itemCode: product.itemCode,
      itemName: product.itemName,
      catchcopy: product.catchcopy,
      itemCaption: product.itemCaption,
      itemPrice: product.itemPrice,
      itemUrl: product.itemUrl,
      affiliateUrl: product.affiliateUrl,
      imageUrl: mainImageUrl || '/placeholder.png',
      availability: product.availability,
      taxFlag: product.taxFlag,
      postageFlag: product.postageFlag,
      creditCardFlag: product.creditCardFlag,
      shopOfTheYearFlag: product.shopOfTheYearFlag,
      shipOverseasFlag: product.shipOverseasFlag,
      asurakuFlag: product.asurakuFlag,
      mediumImageUrls: images.length > 0 ? images : [{ imageUrl: '/placeholder.png' }],
      reviewCount: product.reviewCount,
      reviewAverage: product.reviewAverage,
      shopName: product.shopName,
      shopCode: product.shopCode,
      genreId: product.genreId,
      genreName: genreName,
        };
      } catch (error) {
        console.error("Error fetching product by URL:", error);
        return null;
      }
    },
    { ttl: 3600 } // Cache for 1 hour
  );
}

// Поиск товара по shopCode с пагинацией
async function getProductByShopCode(shopCode: string, itemCode: string) {
  if (!RAKUTEN_APP_ID) return null;

  // Ищем по keyword=itemCode внутри магазина — один запрос вместо 10 страниц
  const url = `${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(
    RAKUTEN_APP_ID
  )}&shopCode=${encodeURIComponent(shopCode)}&keyword=${encodeURIComponent(itemCode)}&hits=10&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[Rakuten API] shopCode search HTTP error:', res.status, res.statusText);
      return null;
    }

    const data: any = await res.json();
    const items = data.Items || [];

    if (items.length === 0) {
      console.error('[Rakuten API] Product not found in shop products after checking all pages');
      return null;
    }

    // Ищем товар с нужным itemCode
    // Извлекаем числовой код из slug (например "shorts-10100284" → "10100284")
    const numericCode = itemCode.match(/(\d{5,})/)?.[1] || '';

    const productData = items.find((item: any) => {
      const fullItemCode = item.Item?.itemCode || '';
      if (fullItemCode.toLowerCase() === `${shopCode}:${itemCode}`.toLowerCase()) return true;
      const parts = fullItemCode.split(':');
      if (parts.length === 2 && parts[1] === itemCode) return true;
      if (fullItemCode.toLowerCase().includes(itemCode.toLowerCase())) return true;
      // Сопоставляем по числовому коду из slug
      if (numericCode && fullItemCode.includes(numericCode)) return true;
      // Сопоставляем по itemUrl товара
      const itemUrl = item.Item?.itemUrl || '';
      if (itemUrl.includes(`/${itemCode}/`) || itemUrl.includes(`/${itemCode}?`)) return true;
      return false;
    });

    if (!productData) return null;
    const product = productData.Item;

    // Только товарные CDN-домены Rakuten (не баннеры магазина)
    const isProductImage = (url: string) =>
      url.includes('thumbnail.image.rakuten.co.jp') ||
      url.includes('tshop.r10s.jp') ||
      url.includes('r10s.jp');

    // Главное изображение товара
    const mainImageUrl = getBestImageUrl(product);

    const images: Array<{ imageUrl: string }> = [];
    if (mainImageUrl) images.push({ imageUrl: mainImageUrl });

    if (product.mediumImageUrls) {
      product.mediumImageUrls.forEach((img: any) => {
        const upgraded = upgradeImageUrl(img.imageUrl);
        if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
          images.push({ imageUrl: upgraded });
        }
      });
    }

    if (images.length < 5 && product.smallImageUrls) {
      product.smallImageUrls.forEach((img: any) => {
        const upgraded = upgradeImageUrl(img.imageUrl);
        if (upgraded && isProductImage(upgraded) && !images.find(i => i.imageUrl === upgraded)) {
          images.push({ imageUrl: upgraded });
        }
      });
    }

    const genreName = product.genreName || null;

    return {
      itemCode: product.itemCode,
      itemName: product.itemName,
      catchcopy: product.catchcopy,
      itemCaption: product.itemCaption,
      itemPrice: product.itemPrice,
      itemUrl: product.itemUrl,
      affiliateUrl: product.affiliateUrl,
      imageUrl: mainImageUrl || '/placeholder.png',
      availability: product.availability,
      taxFlag: product.taxFlag,
      postageFlag: product.postageFlag,
      creditCardFlag: product.creditCardFlag,
      shopOfTheYearFlag: product.shopOfTheYearFlag,
      shipOverseasFlag: product.shipOverseasFlag,
      asurakuFlag: product.asurakuFlag,
      mediumImageUrls: images.length > 0 ? images : [{ imageUrl: '/placeholder.png' }],
      reviewCount: product.reviewCount,
      reviewAverage: product.reviewAverage,
      shopName: product.shopName,
      shopCode: product.shopCode,
      genreId: product.genreId,
      genreName: genreName,
    };
  } catch (error) {
    console.error('[Rakuten API] shopCode search error:', error);
    return null;
  }
}

// Получить товар по itemCode
export async function getProductById(itemCode: string) {
  return cached(
    `rakuten:product:id:${itemCode}`,
    async () => {
      if (!RAKUTEN_APP_ID) return null;

      const url = `${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(
        RAKUTEN_APP_ID
      )}&itemCode=${encodeURIComponent(itemCode)}&format=json`;

      try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const data: any = await res.json();
        const product = data.Items?.[0]?.Item;
        if (!product) return null;

    // Собираем все доступные изображения
    const images: Array<{ imageUrl: string }> = [];

    // Добавляем mediumImageUrls
    if (product.mediumImageUrls && product.mediumImageUrls.length > 0) {
      product.mediumImageUrls.forEach((img: any) => {
        if (img.imageUrl) {
          const upgraded = upgradeImageUrl(img.imageUrl);
          if (upgraded) {
            images.push({ imageUrl: upgraded });
          }
        }
      });
    }

    // Если изображений мало, добавляем smallImageUrls
    if (images.length < 5 && product.smallImageUrls && product.smallImageUrls.length > 0) {
      product.smallImageUrls.forEach((img: any) => {
        if (img.imageUrl) {
          const upgraded = upgradeImageUrl(img.imageUrl);
          if (upgraded && !images.find(i => i.imageUrl === upgraded)) {
            images.push({ imageUrl: upgraded });
          }
        }
      });
    }

    let genreName = product.genreName || null;
    if (!genreName && product.genreId) {
      try {
        const genreRes = await fetch(
          `${RAKUTEN_GENRE_API_URL}?applicationId=${encodeURIComponent(
            RAKUTEN_APP_ID
          )}&genreId=${encodeURIComponent(product.genreId)}&format=json`
        );
        const genreData: any = await genreRes.json();
        genreName = genreData?.current?.genreName || null;
      } catch {}
    }

        return {
          ...product,
          mediumImageUrls: images,
          genreName,
        };
      } catch {
        return null;
      }
    },
    { ttl: 3600 } // Cache for 1 hour
  );
}

// Универсальный метод получения всех вариантов с максимальной надежностью
export async function getProductVariants(itemCode: string): Promise<Variant[]> {
  const product = await getProductById(itemCode);
  if (!product) return [];

  // Стратегия 1: ItemOptions из API
  const variants = parseItemOptions(product, itemCode);
  if (variants.length > 0) return variants;

  // Стратегия 2: itemPrice.values (используется для вариантов с разными ценами)
  const priceVariants = parsePriceVariants(product, itemCode);
  if (priceVariants.length > 0) return priceVariants;

  // Стратегия 3: Поиск по вложенным структурам
  const nestedVariants = parseNestedStructures(product, itemCode);
  if (nestedVariants.length > 0) return nestedVariants;

  return [];
}

// Парсинг стандартных ItemOptions
function parseItemOptions(product: any, defaultItemCode: string): Variant[] {
  const options = product.ItemOptions || product.itemOptions || [];
  if (!options.length) return [];

  const variants: Variant[] = [];

  for (const opt of options) {
    const values: VariantValue[] = [];

    // Массив values
    if (Array.isArray(opt.values) && opt.values.length > 0) {
      for (const v of opt.values) {
        const value = v.optionValue || v.value || v.name || "";
        const itemCode = v.itemCode || v.itemId || v.code || defaultItemCode;
        if (value) {
          values.push({ value: String(value).trim(), itemCode: String(itemCode) });
        }
      }
    }
    // Один вариант
    else if (opt.optionValue) {
      values.push({
        value: String(opt.optionValue).trim(),
        itemCode: opt.itemCode || defaultItemCode
      });
    }
    // Альтернативные поля
    else if (opt.value) {
      values.push({
        value: String(opt.value).trim(),
        itemCode: opt.itemCode || defaultItemCode
      });
    }

    if (values.length > 0) {
      variants.push({
        optionName: opt.optionName || opt.name || "Option",
        values,
      });
    }
  }

  return variants;
}

// Парсинг вариантов из структуры цен
function parsePriceVariants(product: any, defaultItemCode: string): Variant[] {
  const priceData = product.itemPrice || product.prices || product.price;
  if (!priceData) return [];

  // Проверяем наличие массива вариантов в ценах
  if (Array.isArray(priceData.values) && priceData.values.length > 1) {
    const values: VariantValue[] = priceData.values
      .map((p: any) => {
        const value = p.name || p.variant || p.optionValue || "";
        const itemCode = p.itemCode || p.sku || defaultItemCode;
        if (value) {
          return { value: String(value).trim(), itemCode: String(itemCode) };
        }
        return null;
      })
      .filter(Boolean) as VariantValue[];

    if (values.length > 1) {
      return [{
        optionName: priceData.name || "Variant",
        values,
      }];
    }
  }

  return [];
}

// Парсинг вложенных структур (для сложных случаев)
function parseNestedStructures(product: any, defaultItemCode: string): Variant[] {
  const variants: Variant[] = [];

  // Поиск по всем вложенным объектам
  function searchObject(obj: any, depth: number = 0): void {
    if (depth > 3 || !obj || typeof obj !== 'object') return;

    // Проверяем каждое свойство
    for (const key of Object.keys(obj)) {
      const val = obj[key];

      // Ищем массивы с вариантами
      if (Array.isArray(val) && val.length > 1 && val.length < 50) {
        // Проверяем что это массив вариантов
        const hasVariantStructure = val.every((item: any) =>
          item &&
          typeof item === 'object' &&
          (item.value || item.optionValue || item.name) &&
          (item.itemCode || item.sku || item.code)
        );

        if (hasVariantStructure) {
          const values: VariantValue[] = val.map((item: any) => ({
            value: String(item.value || item.optionValue || item.name).trim(),
            itemCode: String(item.itemCode || item.sku || item.code || defaultItemCode),
          }));

          variants.push({
            optionName: key.replace(/([A-Z])/g, ' $1').trim() || "Variant",
            values,
          });
        }
      }

      // Рекурсивный поиск
      if (typeof val === 'object' && val !== null) {
        searchObject(val, depth + 1);
      }
    }
  }

  searchObject(product);
  return variants;
}

// Извлечь itemCode из URL Rakuten
export function extractItemCodeFromUrl(url: string): string | null {
  try {
    // Формат: https://item.rakuten.co.jp/shop-id/item-code/
    const match = url.match(/rakuten\.co\.jp\/([^\/]+)\/([^\/\?#]+)/);
    if (match) {
      const shopId = match[1];
      const itemId = match[2];
      return `${shopId}:${itemId}`;
    }

    // Альтернативные форматы
    const itemCodeMatch = url.match(/[?&]itemCode=([^&]+)/);
    if (itemCodeMatch) return itemCodeMatch[1];

    const skuMatch = url.match(/[?&]sku=([^&]+)/);
    if (skuMatch) return skuMatch[1];

    return null;
  } catch {
    return null;
  }
}

// Парсинг вариантов из HTML (fallback стратегия)
export async function parseVariantsFromHtml(html: string): Promise<Variant[]> {
  const variants: Variant[] = [];

  try {
    // Стратегия 1: Поиск ratVariation в window объекте
    const ratVariationMatch = html.match(/ratVariation\s*[=:]\s*({[\s\S]*?});?\s*(?:var|const|let|<\/script>|$)/i);
    if (ratVariationMatch) {
      try {
        const jsonStr = ratVariationMatch[1].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        const data = JSON.parse(jsonStr);

        if (data.variantSelectors && Array.isArray(data.variantSelectors)) {
          for (const selector of data.variantSelectors) {
            if (selector.values && Array.isArray(selector.values)) {
              const values: VariantValue[] = selector.values
                .map((v: any) => ({
                  value: String(v.value || v.label || '').trim(),
                  itemCode: String(v.itemCode || v.sku || '').trim()
                }))
                .filter((v: VariantValue) => v.value.length > 0);

              if (values.length > 0) {
                variants.push({
                  optionName: selector.label || selector.key || 'Option',
                  values
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing ratVariation:', e);
      }
    }

    // Стратегия 2: Поиск __NEXT_DATA__ или других React/Next.js данных
    if (variants.length === 0) {
      const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch) {
        try {
          const data = JSON.parse(nextDataMatch[1]);
          const pageProps = data?.props?.pageProps;

          if (pageProps?.product?.variantSelectors) {
            for (const selector of pageProps.product.variantSelectors) {
              if (selector.values && Array.isArray(selector.values)) {
                const values: VariantValue[] = selector.values
                  .map((v: any) => ({
                    value: String(v.value || v.label || '').trim(),
                    itemCode: String(v.itemCode || v.sku || '').trim()
                  }))
                  .filter((v: VariantValue) => v.value.length > 0);

                if (values.length > 0) {
                  variants.push({
                    optionName: selector.label || selector.key || 'Option',
                    values
                  });
                }
              }
            }
          }
        } catch {}
      }
    }

    // Стратегия 3: Поиск в любых script тегах с variant/variation данными
    if (variants.length === 0) {
      const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
      for (const scriptTag of scriptTags) {
        if (scriptTag.includes('variantSelectors') || scriptTag.includes('variation')) {
          try {
            const variantMatch = scriptTag.match(/variantSelectors\s*[=:]\s*(\[[\s\S]*?\])/);
            if (variantMatch) {
              const jsonStr = variantMatch[1].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
              const selectors = JSON.parse(jsonStr);

              for (const selector of selectors) {
                if (selector.values && Array.isArray(selector.values)) {
                  const values: VariantValue[] = selector.values
                    .map((v: any) => ({
                      value: String(v.value || v.label || '').trim(),
                      itemCode: String(v.itemCode || v.sku || '').trim()
                    }))
                    .filter((v: VariantValue) => v.value.length > 0);

                  if (values.length > 0) {
                    variants.push({
                      optionName: selector.label || selector.key || 'Option',
                      values
                    });
                  }
                }
              }
            }
          } catch {}
        }
      }
    }

    // Стратегия 4: JSON-LD данные
    if (variants.length === 0) {
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const script of jsonLdMatch) {
          try {
            const content = script.replace(/<script[^>]*>|<\/script>/gi, "");
            const data = JSON.parse(content);
            if (data.offers?.offers) {
              const offerVariants = data.offers.offers
                .map((offer: any) => offer.name || offer.description)
                .filter((name: string) => name && name.length < 100);

              if (offerVariants.length > 1) {
                variants.push({
                  optionName: "Variant",
                  values: offerVariants.map((v: string) => ({
                    value: v,
                    itemCode: ""
                  }))
                });
              }
            }
          } catch {}
        }
      }
    }

    // Стратегия 5: HTML select элементы (для старых страниц)
    if (variants.length === 0) {
      const selectMatches = html.match(/<select[^>]*>[\s\S]*?<\/select>/gi) || [];
      for (const select of selectMatches) {
        const nameMatch = select.match(/name=["']([^"']*(?:size|color|variant|option)[^"']*)["']/i);
        if (nameMatch) {
          const optionMatches = select.match(/<option[^>]*value=["']([^"']+)["'][^>]*>(.*?)<\/option>/gi) || [];
          const values: VariantValue[] = [];

          for (const option of optionMatches) {
            const valueMatch = option.match(/value=["']([^"']+)["']/);
            const textMatch = option.match(/>([^<]+)</);

            if (valueMatch && textMatch) {
              const value = textMatch[1].trim();
              if (value && value.length > 0 && value.length < 100 && !value.match(/選択|select|choose/i)) {
                values.push({
                  value: value,
                  itemCode: valueMatch[1]
                });
              }
            }
          }

          if (values.length > 0) {
            variants.push({
              optionName: nameMatch[1],
              values
            });
          }
        }
      }
    }

  } catch (error) {
    console.error("Error parsing HTML variants:", error);
  }

  return variants;
}

// Получить варианты товара по URL (100% надежность)
export async function getProductVariantsByUrl(url: string): Promise<Variant[]> {
  // Стратегия 1: Извлечь itemCode из URL и использовать API
  const itemCode = extractItemCodeFromUrl(url);
  if (itemCode) {
    const apiVariants = await getProductVariants(itemCode);
    if (apiVariants.length > 0) {
      return apiVariants;
    }
  }

  // Стратегия 2: Загрузить HTML и парсить
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const htmlVariants = await parseVariantsFromHtml(html);
      if (htmlVariants.length > 0) {
        return htmlVariants;
      }
    }
  } catch (error) {
    console.error("Error fetching URL:", error);
  }

  return [];
}

// Маппинг категорий на ключевые слова для улучшения релевантности
const CATEGORY_KEYWORDS: Record<number, string> = GENERATED_KEYWORDS;

// Получить товары по жанру
export async function getProductsByGenreId(
  genreId: number,
  page: number = 1,
  sort: string = "",
  minPrice?: number,
  maxPrice?: number
) {
  const cacheKey = `rakuten:genre:${genreId}:page:${page}:sort:${sort}:min:${minPrice || 0}:max:${maxPrice || 0}`;

  // Проверяем кэш
  const cachedValue = await cacheGet(cacheKey);
  if (cachedValue !== null) {
        return cachedValue;
  }

  
  // Выполняем запрос
  const fetchProducts = async () => {
    if (!RAKUTEN_APP_ID) return [];

      const hits = 20;

      // Улучшенная сортировка
      let sortParam = "";
      // Debug logs отключены для производительности
      // 
      if (sort === "lowest") {
        sortParam = "&sort=%2BitemPrice";
        //       } else if (sort === "highest") {
        sortParam = "&sort=-itemPrice";
        //       } else if (sort === "popular") {
        sortParam = "&sort=-reviewCount"; // По количеству отзывов
        //       } else if (sort === "rating") {
        sortParam = "&sort=-reviewAverage"; // По рейтингу
        //       } else {
        // По умолчанию сортируем по популярности (количеству отзывов)
        sortParam = "&sort=-reviewCount";
        // ');
      }

      // Фильтруем только доступные товары
      const availabilityParam = "&availability=1";

      // Фильтрация по цене через API
      let priceFilterParam = "";
      if (minPrice !== undefined && minPrice > 0) {
        priceFilterParam += `&minPrice=${minPrice}`;
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        priceFilterParam += `&maxPrice=${maxPrice}`;
      }

      // Используем keyword только для популярности и рейтинга, НЕ для сортировки по цене
      // Это помогает найти товары, но для цены мы хотим строгую фильтрацию только по genreId
      const keyword = CATEGORY_KEYWORDS[genreId];
      const useKeyword = keyword && (sort === 'popular' || sort === 'rating' || sort === '');
      const keywordParam = useKeyword ? `&keyword=${encodeURIComponent(keyword)}` : "";

      // orFlag используем только когда есть keyword
      const orFlagParam = useKeyword ? "&orFlag=1" : "";

      const url = `${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(
        RAKUTEN_APP_ID
      )}&genreId=${encodeURIComponent(String(genreId))}&hits=${hits}&page=${page}&format=json${sortParam}${availabilityParam}${priceFilterParam}${keywordParam}${orFlagParam}`;

            
      try {
        const res = await fetch(url);
        
        if (!res.ok) {
          console.error(`[Rakuten API] ❌ Error: ${res.statusText}`);
          return [];
        }

        const data: any = await res.json();

        
        let products =
          data.Items?.map((it: any) => {
            const product = it.Item;
            const imageUrl = getBestImageUrl(product);
            return { ...product, imageUrl };
          }) || [];

        
        // Если API вернул пустой результат при сортировке по цене, попробуем без сортировки
        if (products.length === 0 && (sort === 'lowest' || sort === 'highest')) {
                    const urlWithoutSort = `${RAKUTEN_API_URL}?applicationId=${encodeURIComponent(
            RAKUTEN_APP_ID
          )}&genreId=${encodeURIComponent(String(genreId))}&hits=${hits}&page=${page}&format=json${availabilityParam}`;

          
          const res2 = await fetch(urlWithoutSort);
          if (res2.ok) {
            const data2: any = await res2.json();
            
            products =
              data2.Items?.map((it: any) => {
                const product = it.Item;
                const imageUrl = getBestImageUrl(product);
                return { ...product, imageUrl };
              }) || [];

            // Сортируем на клиенте
            if (products.length > 0) {
                            products.sort((a: any, b: any) => {
                if (sort === 'lowest') return a.itemPrice - b.itemPrice;
                if (sort === 'highest') return b.itemPrice - a.itemPrice;
                return 0;
              });
            }
          }
        }

                return products;
      } catch (error) {
        console.error('Rakuten API fetch error:', error);
        return [];
      }
  };

  // Выполняем запрос
  const products = await fetchProducts();

  // Кэшируем только если есть товары (не кэшируем пустые результаты)
  if (products.length > 0) {
        await cacheSet(cacheKey, products, { ttl: 1800 }); // 30 minutes
  } else {
      }

    return products;
}

// Нормализация поискового запроса для лучшей релевантности
function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    // Удаляем лишние пробелы
    .replace(/\s+/g, ' ')
    // Удаляем специальные символы, которые могут мешать поиску
    .replace(/[<>]/g, '');
}

// Поиск товаров по ключевому слову
export async function searchRakutenProducts(
  keyword: string,
  page: number = 1,
  hits: number = 30,
  minPrice?: number,
  maxPrice?: number
) {
  if (!RAKUTEN_APP_ID) return [];

  // Нормализуем поисковый запрос
  const normalizedKeyword = normalizeSearchQuery(keyword);

  // Параметры для улучшения релевантности поиска
  const params = new URLSearchParams({
    applicationId: RAKUTEN_APP_ID,
    keyword: normalizedKeyword,
    hits: String(hits),
    page: String(page),
    format: 'json',
    // Расширенный поиск для лучших результатов
    orFlag: '1',
  });

  // Добавляем фильтрацию по цене на уровне API
  if (minPrice !== undefined && minPrice > 0) {
    params.append('minPrice', String(minPrice));
  }
  if (maxPrice !== undefined && maxPrice > 0) {
    params.append('maxPrice', String(maxPrice));
  }

  const url = `${RAKUTEN_API_URL}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }

    const data: any = await res.json();

    let products =
      data.Items?.map((it: any) => {
        const product = it.Item;
        const imageUrl = getBestImageUrl(product);
        return { ...product, imageUrl };
      }) || [];

    // Фильтруем товары для улучшения качества результатов
    products = products.filter((p: any) => {
      // Удаляем товары без названия
      if (!p.itemName || p.itemName.trim().length === 0) return false;
      // Удаляем товары без изображения
      if (!p.imageUrl && !p.mediumImageUrls?.[0]?.imageUrl) return false;
      // Удаляем товары с нулевой ценой
      if (!p.itemPrice || p.itemPrice <= 0) return false;
      return true;
    });

    // Дедупликация по itemCode
    const seen = new Set();
    products = products.filter((p: any) => {
      if (seen.has(p.itemCode)) return false;
      seen.add(p.itemCode);
      return true;
    });

    return products;
  } catch (error) {
    return [];
  }
}
