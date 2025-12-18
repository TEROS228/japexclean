// pages/api/parse-variants.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { parseRakutenVariants } from '@/lib/rakuten-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Ограничение одновременных Puppeteer процессов
const pendingRequests = new Map<string, Promise<any>>();
const MAX_CONCURRENT_PUPPETEER = 5; // Максимум 5 одновременных браузеров (компромисс между скоростью и памятью)
let activePuppeteerCount = 0;

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
    console.log(`[Rakuten Parser] Waiting for pending request: ${targetUrl}`);
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
      // Ждем если слишком много активных Puppeteer процессов (макс 20 секунд)
      const maxWaitTime = 20000; // 20 секунд
      const startWaitTime = Date.now();

      while (activePuppeteerCount >= MAX_CONCURRENT_PUPPETEER) {
        const waitedTime = Date.now() - startWaitTime;

        if (waitedTime > maxWaitTime) {
          console.log(`[Rakuten Parser] Wait timeout exceeded (${waitedTime}ms), returning without variants`);
          return {
            success: true,
            variants: [],
            groups: [],
            debug: {
              error: 'Server busy, please try again',
              totalGroups: 0,
              totalVariants: 0,
              method: 'Timeout'
            }
          };
        }

        console.log(`[Rakuten Parser] Waiting for free slot (${activePuppeteerCount}/${MAX_CONCURRENT_PUPPETEER}) - ${Math.floor(waitedTime/1000)}s`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      activePuppeteerCount++;
      console.log(`[Rakuten Parser] Processing URL: ${targetUrl} (active: ${activePuppeteerCount}/${MAX_CONCURRENT_PUPPETEER})`);

      // Используем новый парсер на Puppeteer
      const { groups: variantGroups, colorSizeMapping, postageFlag } = await parseRakutenVariants(targetUrl);

      console.log(`[Rakuten Parser] Found ${variantGroups.length} variant groups with colorSizeMapping:`, Object.keys(colorSizeMapping || {}).length > 0);
      console.log(`[Rakuten Parser] postageFlag: ${postageFlag}`);

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
          method: 'Puppeteer',
          hasVariants: variantGroups.length > 0,
          postageFlag
        }
      };

    } catch (error) {
      console.error('[Rakuten Parser] Error:', error);

      // Возвращаем успешный ответ с пустыми вариантами вместо ошибки
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
      activePuppeteerCount--;
      pendingRequests.delete(cacheKey);
      console.log(`[Rakuten Parser] Finished processing (active: ${activePuppeteerCount}/${MAX_CONCURRENT_PUPPETEER})`);
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

