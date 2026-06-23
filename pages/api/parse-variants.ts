// pages/api/parse-variants.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';
import { cacheGet, cacheSet } from '@/lib/cache';

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
  skuCombinations?: Record<string, Array<{ value: string; available: boolean }>>;
  postageFlag?: number;
  error?: string;
  debug?: any;
}

// Кеширование отключено - всегда загружаем свежие данные

// Ограничение одновременных запросов
const pendingRequests = new Map<string, Promise<any>>();

// Парсинг вариантов из HTML (без Puppeteer!)
function parseVariantsFromHtml(html: string, soldOutCombinations?: Set<string>, soldOutVariantNames?: Set<string>, stockConditionMap?: Record<string, string>) {
  const groups: Array<{ name: string; key: string; options: Array<{ value: string; label: string; available: boolean; price?: number }> }> = [];
  let colorSizeMapping: Record<string, Array<{ value: string; available: boolean }>> = {};
  let skuCombinations: Record<string, Array<{ value: string; available: boolean }>> = {};

  try {
    // Ищем variantSelectors и sku в JavaScript
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];

    let variantSelectors: any[] = [];
    let skuArray: any[] = [];          // массив с selectorValues
    let skuStockArray: any[] = [];     // массив с newPurchaseSku (stockCondition)
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

      // Ищем sku — собираем ОБА массива: с selectorValues и с newPurchaseSku
      if (content.includes('"sku"')) {
        let searchFrom = 0;
        while (searchFrom < content.length) {
          const startIdx = content.indexOf('"sku"', searchFrom);
          if (startIdx === -1) break;
          const afterKey = content.substring(startIdx);
          const arrayStart = afterKey.indexOf('[');
          if (arrayStart === -1) { searchFrom = startIdx + 5; continue; }
          let depth = 0;
          let arrayEnd = -1;
          for (let i = arrayStart; i < afterKey.length; i++) {
            if (afterKey[i] === '[') depth++;
            if (afterKey[i] === ']') { depth--; if (depth === 0) { arrayEnd = i + 1; break; } }
          }
          if (arrayEnd !== -1) {
            const jsonStr = afterKey.substring(arrayStart, arrayEnd);
            try {
              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].variantId) {
                if (parsed[0].selectorValues && !skuArray.length) {
                  skuArray = parsed; // массив с selectorValues — берём первый
                } else if (parsed[0].newPurchaseSku && !skuStockArray.length) {
                  skuStockArray = parsed; // массив с newPurchaseSku — берём первый
                }
              }
            } catch (e) {}
          }
          searchFrom = startIdx + 5;
          if (skuArray.length && skuStockArray.length) break;
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

      // Выходим если нашли всё необходимое; skuStockArray опционален — ждём его только если скрипт его содержит
      const scriptHasNewPurchaseSku = content.includes('newPurchaseSku');
      const hasEverything = variantSelectors.length && skuArray.length && variantMappedInventories.length;
      if (hasEverything && (skuStockArray.length || !scriptHasNewPurchaseSku)) break;
    }

    // Объединяем skuArray (selectorValues) + skuStockArray (newPurchaseSku) по variantId
    if (skuStockArray.length > 0 && skuArray.length > 0) {
      const stockByVariantId: Record<string, any> = {};
      skuStockArray.forEach((s: any) => { if (s.variantId) stockByVariantId[s.variantId] = s; });
      skuArray = skuArray.map((sku: any) => ({
        ...sku,
        newPurchaseSku: stockByVariantId[sku.variantId]?.newPurchaseSku || sku.newPurchaseSku,
      }));
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

          // Проверяем stockCondition — сначала из stockConditionMap (escapeированный JSON), потом из SKU объекта
          const stockCondition = stockConditionMap?.[variantId] || sku.newPurchaseSku?.stockCondition;

          // Доступность определяется по:
          // 1. Если quantity > 0 -> точно доступно
          // 2. Если quantity = 0 ИЛИ нет данных, проверяем stockCondition
          // 3. Только если stockCondition === 'sold-out' -> недоступно
          // 4. Во всех остальных случаях -> ДОСТУПНО (товар под заказ)
          let isInStock = false;

          // Проверяем все значения SKU на наличие в списке sold-out из HTML
          const skuIsSoldOutInHtml = soldOutVariantNames && sku.selectorValues.some((v: string) => soldOutVariantNames.has(v));

          if (skuIsSoldOutInHtml) {
            // HTML явно говорит что продано — это самый надёжный источник
            isInStock = false;
          } else if (soldOutVariantNames && soldOutVariantNames.size > 0) {
            // Есть данные из HTML и этот вариант НЕ в списке sold-out — значит доступен
            isInStock = true;
          } else {
            // stockCondition имеет абсолютный приоритет — Rakuten явно указывает статус
            if (stockCondition === 'sold-out') {
              isInStock = false;
            } else if (stockCondition) {
              // 'almost-out', 'available' и т.д. — доступен
              isInStock = true;
            } else if (typeof quantity === 'number') {
              // Нет stockCondition: quantity=0 НЕ означает sold-out (может быть под заказ)
              // Используем quantity только если > 0 как сигнал наличия
              // quantity=0 без stockCondition = неизвестно, считаем доступным
              isInStock = true;
            } else {
              isInStock = true;
            }
          }

          if (isInStock) {
            availableCount++;
            sku.selectorValues.forEach((value: string) => {
              availabilityMap[value] = true;
            });
          } else {
            unavailableCount++;
            // Явно помечаем как недоступный, но только если ещё не помечен как доступный другим SKU
            sku.selectorValues.forEach((value: string) => {
              if (!availabilityMap[value]) {
                availabilityMap[value] = false;
              }
            });
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

              const variantId = sku.variantId || sku.id;
              const quantity = inventoryMap[variantId];
              const stockCondition = stockConditionMap?.[variantId] || sku.newPurchaseSku?.stockCondition;

              let isAvailable = false;

              const skuIsSoldOut = soldOutVariantNames && sku.selectorValues.some((v: string) => soldOutVariantNames.has(v));
              if (skuIsSoldOut) {
                isAvailable = false;
              } else if (soldOutVariantNames && soldOutVariantNames.size > 0) {
                isAvailable = true;
              } else if (stockCondition === 'sold-out') {
                isAvailable = false;
              } else {
                isAvailable = true;
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

        // Для 3 групп строим skuCombinations: "group0Value|group1Value" -> group2Values[]
        if (groups.length >= 3) {
          const thirdGroup = groups[2];
          const comboMap = new Map<string, Map<string, boolean>>();

          skuArray.forEach((sku: any) => {
            if (sku.selectorValues && sku.selectorValues.length >= 3 && !sku.hidden) {
              const v0 = sku.selectorValues[0];
              const v1 = sku.selectorValues[1];
              const v2 = sku.selectorValues[2];
              const comboKey = `${v0}|${v1}`;

              const variantId = sku.variantId || sku.id;
              const quantity = inventoryMap[variantId];
              const stockCondition = stockConditionMap?.[variantId] || sku.newPurchaseSku?.stockCondition;

              let isAvailable = false;
              const skuVals = [v0, v1, v2];
              const skuIsSoldOut = soldOutVariantNames && skuVals.some((v: string) => soldOutVariantNames.has(v));
              if (skuIsSoldOut) {
                isAvailable = false;
              } else if (soldOutVariantNames && soldOutVariantNames.size > 0) {
                isAvailable = true;
              } else if (stockCondition === 'sold-out') {
                isAvailable = false;
              } else {
                isAvailable = true;
              }

              if (!comboMap.has(comboKey)) comboMap.set(comboKey, new Map());
              const existing = comboMap.get(comboKey)!.get(v2) || false;
              comboMap.get(comboKey)!.set(v2, existing || isAvailable);
            }
          });

          comboMap.forEach((valueMap, comboKey) => {
            skuCombinations[comboKey] = Array.from(valueMap.entries()).map(([value, available]) => ({ value, available }));
          });
        }
      }
    }

  } catch (error) {
    console.error('[HTML Parser] Error:', error);
  }

  return { groups, colorSizeMapping, skuCombinations };
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
  const cacheKey = `rakuten:variants:${normalizedUrl}`;

  // Проверяем постоянный кэш (Redis/memory)
  const cached = await cacheGet<IVariantsData>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

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
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1',
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

      // Строим карту stockCondition из HTML
      // Данные находятся в escapeированном JSON: \"variantId\":\"132709\",\"newPurchaseSku\":{\"stockCondition\":\"sold-out\"
      // Обратите внимание: { после newPurchaseSku\" НЕ экранирован
      const stockConditionMap: Record<string, string> = {};
      // Паттерн 1: escapeированный JSON (внутри JS строки) — variantId может быть r-sku... или числом
      const escRegex = /\\"variantId\\":\\"([^"\\]+)\\"[^}]{0,80}\\"stockCondition\\":\\"([^"\\]+)\\"/g;
      // Паттерн 2: обычный JSON
      const normRegex = /"variantId":"([^"]+)"[^}]{0,80}"stockCondition":"([^"]+)"/g;
      let m;
      while ((m = escRegex.exec(html)) !== null) stockConditionMap[m[1]] = m[2];
      while ((m = normRegex.exec(html)) !== null) {
        if (!stockConditionMap[m[1]]) stockConditionMap[m[1]] = m[2];
      }
      // Паттерн 3: парсим sold-out из rendered HTML
      // Для каждого вхождения "売り切れ" ищем ближайший aria-label в пределах 800 символов назад
      const soldOutVariantNames = new Set<string>();
      let soldOutPos = 0;
      while (true) {
        const idx = html.indexOf('売り切れ', soldOutPos);
        if (idx === -1) break;
        const chunk = html.substring(Math.max(0, idx - 800), idx);
        const ariaMatches = [...chunk.matchAll(/aria-label="([^"]+)"/g)];
        if (ariaMatches.length > 0) {
          soldOutVariantNames.add(ariaMatches[ariaMatches.length - 1][1]);
        }
        soldOutPos = idx + 4;
      }

      // Парсим варианты из JavaScript в HTML
      const { groups: variantGroups, colorSizeMapping, skuCombinations } = parseVariantsFromHtml(html, soldOutCombinations, soldOutVariantNames.size > 0 ? soldOutVariantNames : undefined, stockConditionMap);

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
        skuCombinations,
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
    // Кэшируем успешный результат с вариантами на 1 час
    if (result.success && result.groups && result.groups.length > 0) {
      await cacheSet(cacheKey, result, { ttl: 1800 });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Rakuten Parser] Request failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}

