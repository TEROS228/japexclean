// pages/api/parse-variants.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

// Timeout для API route (Puppeteer с кликами ~20-40 секунд)
export const config = {
  maxDuration: 60, // seconds
};

// Нормализуем URL (убираем параметры типа rafcid)
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Удаляем параметры которые не влияют на контент
    urlObj.searchParams.delete('rafcid');
    urlObj.searchParams.delete('scid');
    return urlObj.toString();
  } catch {
    return url;
  }
}

interface IVariant {
  name: string;
  value: string;
  isAvailable: boolean;
}

interface IVariantsData {
  success: boolean;
  variants?: IVariant[];
  groups?: Array<{
    name: string;
    options: Array<{ value: string; available: boolean; price?: number }>;
  }>;
  colorSizeMapping?: Record<string, Array<{ value: string; available: boolean }>>;
  postageFlag?: number;
  error?: string;
  debug?: any;
}

// Кеширование отключено - всегда загружаем свежие данные

// Ограничение одновременных запросов
const pendingRequests = new Map<string, Promise<any>>();

// Парсинг вариантов из HTML (без Puppeteer!)
function parseVariantsFromHtml(html: string, soldOutCombinations?: Set<string>) {
  const groups: Array<{ name: string; key: string; options: Array<{ value: string; label: string; available: boolean; price?: number }> }> = [];
  let colorSizeMapping: Record<string, Array<{ value: string; available: boolean }>> = {};

  try {
    // Ищем variantSelectors и sku в JavaScript
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];

    let variantSelectors: any[] = [];
    let skuArray: any[] = [];
    let variantMappedInventories: any[] = [];

    for (const script of scripts) {
      const content = script.replace(/<\/?script[^>]*>/gi, '');

      // Ищем variantSelectors - ТОЛЬКО балансировка скобок
      if (!variantSelectors.length && content.includes('variantSelectors')) {
        const startIdx = content.indexOf('variantSelectors');
        if (startIdx !== -1) {
          const afterKey = content.substring(startIdx);
          const arrayStart = afterKey.indexOf('[');
          if (arrayStart !== -1) {
            let depth = 0;
            let arrayEnd = -1;
            for (let i = arrayStart; i < afterKey.length; i++) {
              if (afterKey[i] === '[') depth++;
              if (afterKey[i] === ']') {
                depth--;
                if (depth === 0) {
                  arrayEnd = i + 1;
                  break;
                }
              }
            }
            if (arrayEnd !== -1) {
              const jsonStr = afterKey.substring(arrayStart, arrayEnd);
              try {
                variantSelectors = JSON.parse(jsonStr);
              } catch (e) {
              }
            }
          }
        }
      }

      // Ищем sku - ТОЛЬКО балансировка скобок
      if (!skuArray.length && content.includes('"sku"')) {
        const startIdx = content.indexOf('"sku"');
        if (startIdx !== -1) {
          const afterKey = content.substring(startIdx);
          const arrayStart = afterKey.indexOf('[');
          if (arrayStart !== -1) {
            let depth = 0;
            let arrayEnd = -1;
            for (let i = arrayStart; i < afterKey.length; i++) {
              if (afterKey[i] === '[') depth++;
              if (afterKey[i] === ']') {
                depth--;
                if (depth === 0) {
                  arrayEnd = i + 1;
                  break;
                }
              }
            }
            if (arrayEnd !== -1) {
              const jsonStr = afterKey.substring(arrayStart, arrayEnd);
              try {
                skuArray = JSON.parse(jsonStr);
              } catch (e) {
              }
            }
          }
        }
      }

      // Ищем variantMappedInventories - ТОЛЬКО балансировка скобок
      if (!variantMappedInventories.length && content.includes('variantMappedInventories')) {
        const startIdx = content.indexOf('variantMappedInventories');
        if (startIdx !== -1) {
          const afterKey = content.substring(startIdx);
          // Ищем : после ключа
          const colonIdx = afterKey.indexOf(':');
          if (colonIdx !== -1) {
            const afterColon = afterKey.substring(colonIdx + 1);
            const arrayStart = afterColon.indexOf('[');
            if (arrayStart !== -1) {
              let depth = 0;
              let arrayEnd = -1;
              for (let i = arrayStart; i < afterColon.length; i++) {
                if (afterColon[i] === '[') depth++;
                if (afterColon[i] === ']') {
                  depth--;
                  if (depth === 0) {
                    arrayEnd = i + 1;
                    break;
                  }
                }
              }
              if (arrayEnd !== -1) {
                const jsonStr = afterColon.substring(arrayStart, arrayEnd);
                try {
                  variantMappedInventories = JSON.parse(jsonStr);
                } catch (e) {
                }
              }
            }
          }
        }
      }

      if (variantSelectors.length && skuArray.length && variantMappedInventories.length) break;
    }

    if (variantSelectors.length && skuArray.length) {
                        
      // Строим маппинг инвентаря из variantMappedInventories: variantId -> quantity
      const inventoryMap: Record<string, number> = {};
      if (variantMappedInventories.length > 0) {
        variantMappedInventories.forEach((inv: any) => {
          if (inv.sku && typeof inv.quantity === 'number') {
            inventoryMap[inv.sku] = inv.quantity;
          }
        });
        Object.entries(inventoryMap).slice(0, 10).forEach(([sku, qty]) => {
        });
      } else {
      }

      // Строим маппинг цен из SKU
      const priceMap: Record<string, number> = {};
      skuArray.forEach((sku: any, index: number) => {
        if (sku.selectorValues && sku.selectorValues.length > 0) {
          const key = sku.selectorValues[0];

          // Пробуем разные места где может быть цена
          let price = sku.taxIncludedPrice ||
                     sku.newPurchaseSku?.price?.value ||
                     sku.newPurchaseSku?.price ||
                     sku.price?.value ||
                     sku.price ||
                     sku.displayPrice?.value ||
                     sku.displayPrice;

          // Если цена это строка, парсим её
          if (typeof price === 'string') {
            const priceMatch = price.match(/[\d,]+/);
            if (priceMatch) {
              price = parseInt(priceMatch[0].replace(/,/g, ''));
            }
          }

          if (price && typeof price === 'number' && price > 0) {
            priceMap[key] = price;
          }
        }
      });

      // Строим маппинг доступности на основе inventoryMap: вариант доступен если quantity > 0
      const availabilityMap: Record<string, boolean> = {};

      // Инициализируем все варианты как недоступные
      variantSelectors.forEach((selector: any) => {
        selector.values.forEach((v: any) => {
          const value = v.value || v.label;
          availabilityMap[value] = false;
        });
      });

      // Помечаем доступные варианты на основе SKU + inventory + stockCondition
            let availableCount = 0;
      let unavailableCount = 0;

      skuArray.forEach((sku: any, index: number) => {
        if (sku.selectorValues && sku.selectorValues.length > 0 && !sku.hidden) {
          // Проверяем quantity из inventoryMap
          const variantId = sku.variantId || sku.id;
          const quantity = inventoryMap[variantId];

          // Проверяем stockCondition как fallback
          const stockCondition = sku.newPurchaseSku?.stockCondition;

          // Доступность определяется по:
          // 1. Если quantity > 0 -> точно доступно
          // 2. Если quantity = 0 ИЛИ нет данных, проверяем stockCondition
          // 3. Только если stockCondition === 'sold-out' -> недоступно
          // 4. Во всех остальных случаях -> ДОСТУПНО (товар под заказ)
          let isInStock = false;

          if (Object.keys(inventoryMap).length > 0) {
            // Есть inventoryMap
            if (typeof quantity === 'number' && quantity > 0) {
              // Quantity > 0 -> точно доступно
              isInStock = true;
            } else {
              // Quantity = 0 или undefined -> проверяем stockCondition
              // Считаем ДОСТУПНЫМ если stockCondition НЕ равен "sold-out"
              isInStock = stockCondition !== 'sold-out';
            }
          } else {
            // Нет inventoryMap - используем только stockCondition
            isInStock = stockCondition !== 'sold-out';
          }

          if (isInStock) {
            availableCount++;
            sku.selectorValues.forEach((value: string) => {
              availabilityMap[value] = true;
            });
          } else {
            unavailableCount++;
          }
        }
      });

      Object.entries(availabilityMap).forEach(([variant, available]) => {
      });

      // Строим группы из variantSelectors
            variantSelectors.forEach((selector: any, index: number) => {
        const groupName = selector.label || selector.key;
        const options = selector.values.map((v: any) => {
          const value = v.value || v.label;
          // Берем доступность из SKU, или true если нет информации
          const available = availabilityMap.hasOwnProperty(value) ? availabilityMap[value] : true;

          return {
            value: value,
            label: v.label || v.value,
            available: available,
            price: priceMap[value] || undefined
          };
        });

        groups.push({ name: groupName, key: selector.key, options });

        options.forEach((opt: any) => {
          const priceStr = opt.price ? ` (¥${opt.price})` : '';
        });
      });

      
      // Строим маппинг доступности из SKU (для комбинаций)
      if (groups.length >= 2) {
        const firstGroup = groups[0];
        const secondGroup = groups[1];

        const isFirstSize = firstGroup.name.includes('サイズ') || firstGroup.name.toLowerCase().includes('size');
        const primaryGroup = isFirstSize ? firstGroup : secondGroup;
        const secondaryGroup = isFirstSize ? secondGroup : firstGroup;
        const primaryIndex = isFirstSize ? 0 : 1;
        const secondaryIndex = isFirstSize ? 1 : 0;

        primaryGroup.options.forEach((primaryOpt: any) => {
          // Используем Map для агрегации доступности по secondaryValue
          const secondaryMap = new Map<string, boolean>();

          // 
          skuArray.forEach((sku: any) => {
            if (sku.selectorValues && sku.selectorValues[primaryIndex] === primaryOpt.value && !sku.hidden) {
              const secondaryValue = sku.selectorValues[secondaryIndex];

              // Проверяем quantity из inventoryMap
              const variantId = sku.variantId || sku.id;
              const quantity = inventoryMap[variantId];

              // Проверяем stockCondition как fallback
              const stockCondition = sku.newPurchaseSku?.stockCondition;

              // Доступность определяется по:
              // 1. Если есть inventoryMap И quantity > 0 -> доступно
              // 2. Если нет inventoryMap ИЛИ все quantity = 0, проверяем stockCondition != 'sold-out'
              let isAvailable = false;

              if (Object.keys(inventoryMap).length > 0) {
                // Есть inventoryMap - проверяем quantity
                isAvailable = typeof quantity === 'number' && quantity > 0;

                // Если quantity = 0, но stockCondition не sold-out, все равно считаем доступным
                if (!isAvailable && stockCondition && stockCondition !== 'sold-out') {
                  isAvailable = true;
                }
              } else {
                // Нет inventoryMap - используем только stockCondition
                isAvailable = !stockCondition || stockCondition !== 'sold-out';
              }

              // 
              // Если комбинация уже есть в мапе и доступна, не меняем
              // Если комбинация еще не добавлена или была недоступна, обновляем
              const currentAvailability = secondaryMap.get(secondaryValue) || false;
              const newAvailability = currentAvailability || isAvailable;

              // 
              secondaryMap.set(secondaryValue, newAvailability);
            }
          });

          if (secondaryMap.size > 0) {
            const availableSecondary = Array.from(secondaryMap.entries()).map(([value, available]) => ({
              value,
              available
            }));
            colorSizeMapping[primaryOpt.value] = availableSecondary;
          }
        });
      }
    }

  } catch (error) {
    console.error('[HTML Parser] Error:', error);
  }

  return { groups, colorSizeMapping };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<IVariantsData>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const targetUrl = req.query.url as string;

  if (!targetUrl || !targetUrl.includes('rakuten.co.jp')) {
    return res.status(400).json({ success: false, error: 'Valid Rakuten URL is required' });
  }

  const normalizedUrl = normalizeUrl(targetUrl);
  const cacheKey = normalizedUrl;

  // Если уже есть pending запрос для этого URL, ждем его завершения
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
        try {
      const result = await pendingRequest;
      return res.status(200).json(result);
    } catch (error) {
      console.error('[Rakuten Parser] Pending request failed:', error);
      // Продолжаем выполнение и пытаемся сделать новый запрос
    }
  }

  // Создаем promise для текущего запроса
  const requestPromise = (async () => {
    try {
      // Получаем postageFlag из Rakuten API (параллельно с HTML)
      let apiPostageFlag = 0;
      const urlMatch = targetUrl.match(/rakuten\.co\.jp\/([^\/]+)\/([^\/\?]+)/);

      const apiPromise = urlMatch ? (async () => {
        const shopCode = urlMatch[1];
        const itemCode = urlMatch[2];
        const fullItemCode = `${shopCode}:${itemCode}`;

        try {
          const apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?format=json&itemCode=${encodeURIComponent(fullItemCode)}&applicationId=${process.env.NEXT_PUBLIC_RAKUTEN_APP_ID}`;
          const apiRes = await fetch(apiUrl);
          if (apiRes.ok) {
            const apiData: any = await apiRes.json();
            const flag = apiData.Items?.[0]?.Item?.postageFlag || 0;
                        return flag;
          }
        } catch (e) {
                  }
        return 0;
      })() : Promise.resolve(0);

      // 
      // НОВЫЙ ПОДХОД: Сразу используем быстрый fetch вместо медленного Puppeteer
      // HTML парсинг отлично работает с JavaScript данными в статическом HTML
      let html = '';
      let soldOutCombinations = new Set<string>();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд вместо 30

        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        html = iconv.decode(Buffer.from(buffer), 'EUC-JP');
      } catch (error) {
        console.error(`[Rakuten Parser] Fetch error:`, error);
        html = '';
      }

      // Если HTML пустой, возвращаем пустой результат
      if (!html || html.length < 100) {
                return {
          success: true,
          variants: [],
          groups: [],
          colorSizeMapping: {},
          postageFlag: apiPostageFlag,
          debug: {
            error: 'Failed to fetch HTML',
            totalGroups: 0,
            totalVariants: 0,
            method: 'Failed - Network Error'
          }
        };
      }

      // Парсим варианты из JavaScript в HTML
      const { groups: variantGroups, colorSizeMapping } = parseVariantsFromHtml(html, soldOutCombinations);

      // Ждем postageFlag из API (более надежно чем парсинг HTML в EUC-JP)
      apiPostageFlag = await apiPromise;
      const postageFlag = apiPostageFlag;

      //       // `);

      // Преобразуем в плоский список для совместимости
      const allVariants: IVariant[] = [];
      for (const group of variantGroups) {
        for (const option of group.options) {
          allVariants.push({
            name: `${group.name}: ${option.value}`,
            value: option.value,
            isAvailable: option.available
          });
        }
      }

      return {
        success: true,
        variants: allVariants,
        groups: variantGroups,
        colorSizeMapping,
        postageFlag,
        debug: {
          totalGroups: variantGroups.length,
          totalVariants: allVariants.length,
          method: 'HTML Parser (fast)',
          hasVariants: variantGroups.length > 0,
          postageFlag
        }
      };

    } catch (error) {
      console.error('[Rakuten Parser] Error:', error);

      return {
        success: true,
        variants: [],
        groups: [],
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          totalGroups: 0,
          totalVariants: 0,
          method: 'Failed'
        }
      };
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  // Сохраняем promise в Map
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Rakuten Parser] Request failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}

