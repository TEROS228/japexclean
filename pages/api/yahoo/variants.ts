import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
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

interface YahooVariant {
  name: string;
  value: string;
  isAvailable: boolean;
}

interface YahooVariantsResponse {
  success: boolean;
  variants?: YahooVariant[];
  groups?: Array<{
    name: string;
    options: Array<{ value: string; available: boolean }>;
  }>;
  colorSizeMapping?: Record<string, Array<{ value: string; available: boolean }>>;
  postageFlag?: number;
  error?: string;
  debug?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<YahooVariantsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const targetUrl = req.query.url as string;

  if (!targetUrl || !targetUrl.includes('shopping.yahoo.co.jp')) {
    return res.status(400).json({
      success: false,
      error: 'Valid Yahoo Shopping URL is required'
    });
  }

  const normalizedUrl = normalizeUrl(targetUrl);

  try {
    console.log(`[Yahoo Variants] Processing URL: ${targetUrl}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Перехватываем console.log из браузера
    page.on('console', msg => {
      console.log('[Browser Console]', msg.text());
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Отключаем автоперевод, чтобы числа оставались цифрами
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9'
    });

    // Блокируем загрузку ненужных ресурсов для ускорения
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for JavaScript to execute and variant elements to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = await page.evaluate(() => {
      const groups: Array<{ name: string; options: Array<{ value: string; available: boolean }> }> = [];
      let colorSizeMapping: Record<string, Array<{ value: string; available: boolean }>> = {};
      let postageFlag = 0;

      // ========== ПАРСИМ ДОСТАВКУ ПЕРВЫМ ДЕЛОМ ==========
      // Ищем область цены/доставки
      const priceWrap = document.querySelector('.styles_priceWrap__PCVOl, [class*="priceWrap"]');

      if (priceWrap) {
        const priceText = priceWrap.textContent || '';
        console.log('[Debug] Price area text:', priceText.substring(0, 300));

        // Сначала проверяем платную доставку (например "送料770円")
        // Паттерн: "送料" + цифры + "円"
        const paidShippingPattern = /送料\s*\d+\s*円/;
        if (paidShippingPattern.test(priceText)) {
          postageFlag = 0;
          console.log('[Debug] Found PAID shipping in price area');
        }
        // Только если не нашли платную доставку, проверяем бесплатную
        else if (priceText.includes('送料無料')) {
          postageFlag = 1;
          console.log('[Debug] Found FREE shipping in price area');
        }
      } else {
        // Fallback: ищем элементы с классами
        const freeShippingElements = document.querySelectorAll('.styles_postageFree__ZnOe3, [class*="postageFree"]');
        console.log('[Debug] Free shipping elements with class:', freeShippingElements.length);

        if (freeShippingElements.length > 0) {
          postageFlag = 1;
          console.log('[Debug] Found free shipping indicator (class-based)');
        } else {
          // Проверяем в области доставки более узко
          const postageElements = document.querySelectorAll('[class*="postage"], [class*="shipping"]');
          postageElements.forEach((el) => {
            const text = el.textContent?.trim() || '';
            // Проверяем платную доставку
            if (/送料\s*\d+\s*円/.test(text)) {
              postageFlag = 0;
              console.log('[Debug] Found PAID shipping:', text.substring(0, 100));
            }
            // Проверяем бесплатную только если еще не установлен флаг платной
            else if (postageFlag === 0 && text.includes('送料無料')) {
              postageFlag = 1;
              console.log('[Debug] Found FREE shipping:', text.substring(0, 100));
            }
          });
        }
      }

      console.log('[Debug] Final postageFlag:', postageFlag);
      // ========== КОНЕЦ ПАРСИНГА ДОСТАВКИ ==========

      // Yahoo Shopping хранит данные в script тегах
      let stockTableData = null;
      let optionListData = null;
      let selectOptionListData = null;
      let itemOptionsData = null; // Для данных о stock по вариантам

      // Ищем данные в script тегах
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const text = script.textContent || '';

        // Ищем selectOptionList (новый формат для некоторых товаров)
        if (text.includes('selectOptionList')) {
          console.log('[Debug] Found script with selectOptionList');

          try {
            const listStart = text.indexOf('"selectOptionList"');
            if (listStart !== -1) {
              const arrStart = text.indexOf(':[', listStart) + 1;

              let depth = 0;
              let arrEnd = arrStart;

              for (let i = arrStart; i < text.length; i++) {
                if (text[i] === '[') depth++;
                if (text[i] === ']') {
                  depth--;
                  if (depth === 0) {
                    arrEnd = i + 1;
                    break;
                  }
                }
              }

              const jsonStr = text.substring(arrStart, arrEnd);
              console.log('[Debug] selectOptionList array length:', jsonStr.length);

              selectOptionListData = JSON.parse(jsonStr);
              console.log('[Debug] Successfully parsed selectOptionList from JSON');
            }
          } catch (e: any) {
            console.log('[Debug] Failed to parse selectOptionList:', e.message);
          }
        }

        // Ищем stockTableTwoAxis
        if (text.includes('stockTableTwoAxis')) {
          console.log('[Debug] Found script with stockTableTwoAxis');

          try {
            // stockTableTwoAxis - это ключ внутри JSON объекта
            // Ищем паттерн: "stockTableTwoAxis":{...}
            const stockStart = text.indexOf('"stockTableTwoAxis"');
            if (stockStart !== -1) {
              // Ищем начало объекта (открывающую скобку после :)
              const objStart = text.indexOf(':{', stockStart) + 1;

              // Находим соответствующую закрывающую скобку
              let depth = 0;
              let objEnd = objStart;

              for (let i = objStart; i < text.length; i++) {
                if (text[i] === '{') depth++;
                if (text[i] === '}') {
                  depth--;
                  if (depth === 0) {
                    objEnd = i + 1;
                    break;
                  }
                }
              }

              const jsonStr = text.substring(objStart, objEnd);
              console.log('[Debug] Extracted object length:', jsonStr.length);

              stockTableData = JSON.parse(jsonStr);
              console.log('[Debug] Successfully parsed stockTableTwoAxis from JSON');
            }
          } catch (e: any) {
            console.log('[Debug] Failed to parse stockTableTwoAxis:', e.message);
          }
        }

        // Ищем individualItemOptionList
        if (text.includes('individualItemOptionList')) {
          console.log('[Debug] Found script with individualItemOptionList');

          try {
            // individualItemOptionList - это ключ внутри JSON объекта
            // Ищем паттерн: "individualItemOptionList":[...]
            const listStart = text.indexOf('"individualItemOptionList"');
            if (listStart !== -1) {
              // Ищем начало массива (открывающую скобку после :)
              const arrStart = text.indexOf(':[', listStart) + 1;

              // Находим соответствующую закрывающую скобку
              let depth = 0;
              let arrEnd = arrStart;

              for (let i = arrStart; i < text.length; i++) {
                if (text[i] === '[') depth++;
                if (text[i] === ']') {
                  depth--;
                  if (depth === 0) {
                    arrEnd = i + 1;
                    break;
                  }
                }
              }

              const jsonStr = text.substring(arrStart, arrEnd);
              console.log('[Debug] Extracted array length:', jsonStr.length);

              optionListData = JSON.parse(jsonStr);
              console.log('[Debug] Successfully parsed individualItemOptionList from JSON');
            }
          } catch (e: any) {
            console.log('[Debug] Failed to parse individualItemOptionList:', e.message);
          }
        }

        // Ищем itemOptions или actualItemOptionList (содержит stock информацию)
        if (text.includes('"itemOptions"') || text.includes('"actualItemOptionList"')) {
          console.log('[Debug] Found script with itemOptions/actualItemOptionList');

          try {
            let listStart = text.indexOf('"itemOptions"');
            let fieldName = '"itemOptions"';

            if (listStart === -1) {
              listStart = text.indexOf('"actualItemOptionList"');
              fieldName = '"actualItemOptionList"';
            }

            if (listStart !== -1) {
              const arrStart = text.indexOf(':[', listStart) + 1;

              let depth = 0;
              let arrEnd = arrStart;

              for (let i = arrStart; i < text.length; i++) {
                if (text[i] === '[') depth++;
                if (text[i] === ']') {
                  depth--;
                  if (depth === 0) {
                    arrEnd = i + 1;
                    break;
                  }
                }
              }

              const jsonStr = text.substring(arrStart, arrEnd);
              console.log(`[Debug] ${fieldName} array length:`, jsonStr.length);

              itemOptionsData = JSON.parse(jsonStr);
              console.log(`[Debug] Successfully parsed ${fieldName} from JSON`);
            }
          } catch (e: any) {
            console.log('[Debug] Failed to parse itemOptions/actualItemOptionList:', e.message);
          }
        }
      });

      // Также проверяем window объект
      const win = window as any;
      if (!stockTableData && win.stockTableTwoAxis) {
        stockTableData = win.stockTableTwoAxis;
        console.log('[Debug] Found stockTableTwoAxis in window');
      }
      if (!optionListData && win.individualItemOptionList) {
        optionListData = win.individualItemOptionList;
        console.log('[Debug] Found individualItemOptionList in window');
      }
      if (!selectOptionListData && win.selectOptionList) {
        selectOptionListData = win.selectOptionList;
        console.log('[Debug] Found selectOptionList in window');
      }
      if (!itemOptionsData && win.itemOptions) {
        itemOptionsData = win.itemOptions;
        console.log('[Debug] Found itemOptions in window');
      }
      if (!itemOptionsData && win.actualItemOptionList) {
        itemOptionsData = win.actualItemOptionList;
        console.log('[Debug] Found actualItemOptionList in window');
      }

      console.log('[Debug] stockTableData exists:', !!stockTableData);
      console.log('[Debug] optionListData exists:', !!optionListData);
      console.log('[Debug] selectOptionListData exists:', !!selectOptionListData);
      console.log('[Debug] itemOptionsData exists:', !!itemOptionsData);

      // Логируем структуру данных
      if (stockTableData) {
        console.log('[Debug] stockTableData keys:', Object.keys(stockTableData));
        console.log('[Debug] stockTableData.firstOption exists:', !!stockTableData.firstOption);
        console.log('[Debug] Full stockTableData:', JSON.stringify(stockTableData).substring(0, 500));
      }
      if (optionListData) {
        console.log('[Debug] optionListData type:', Array.isArray(optionListData) ? 'array' : typeof optionListData);
        console.log('[Debug] optionListData length:', optionListData.length);
        console.log('[Debug] Full optionListData:', JSON.stringify(optionListData).substring(0, 500));
      }

      if (stockTableData && stockTableData.firstOption) {
        console.log('[Debug] Using stockTableTwoAxis with firstOption');

        // Первая ось - обычно цвета
        const firstAxisOptions: Array<{ value: string; available: boolean }> = [];
        let firstAxisName = stockTableData.firstOption.name || 'Color';

        // Переводим японские названия на английский
        if (firstAxisName === 'カラー' || firstAxisName === '色') {
          firstAxisName = 'Color';
        }
        const choiceList = stockTableData.firstOption.choiceList || [];
        const seenFirstOptions = new Set<string>();
        const colorSizeMapping: Record<string, Array<{ value: string; available: boolean }>> = {};

        choiceList.forEach((item: any) => {
          let choiceName = item.choiceName;

          // Очищаем от кодов товара (например: "UL420M_AB_ブラック" -> "ブラック")
          if (choiceName.includes('_')) {
            const parts = choiceName.split('_');
            choiceName = parts[parts.length - 1]; // Берем последнюю часть
          }

          // Пропускаем дубликаты
          if (seenFirstOptions.has(choiceName)) {
            return;
          }
          seenFirstOptions.add(choiceName);

          const hasAvailableStock = item.secondOption?.choiceList?.some((choice: any) =>
            choice.stock?.isAvailable === true
          );

          firstAxisOptions.push({
            value: choiceName,
            available: hasAvailableStock !== false
          });

          // Собираем размеры для этого цвета
          if (item.secondOption?.choiceList) {
            colorSizeMapping[choiceName] = item.secondOption.choiceList.map((choice: any) => {
              let sizeName = choice.choiceName;

              // Очищаем от кодов товара если есть
              if (sizeName.includes('_') && !sizeName.includes('cm') && !sizeName.match(/\d/)) {
                const parts = sizeName.split('_');
                sizeName = parts[parts.length - 1];
              }

              return {
                value: sizeName,
                available: choice.stock?.isAvailable === true
              };
            });
          }
        });

        if (firstAxisOptions.length > 0) {
          groups.push({
            name: firstAxisName,
            options: firstAxisOptions
          });
        }

        // Вторая ось - обычно размеры
        if (choiceList[0]?.secondOption) {
          let secondAxisName = choiceList[0].secondOption.name || 'Size';

          // Переводим японские названия на английский
          if (secondAxisName === 'サイズ') {
            secondAxisName = 'Size';
          }
          const secondAxisOptions: Array<{ value: string; available: boolean }> = [];
          const seenValues = new Set<string>();

          choiceList.forEach((item: any) => {
            item.secondOption?.choiceList?.forEach((choice: any) => {
              let choiceName = choice.choiceName;

              // Очищаем от кодов товара если есть
              if (choiceName.includes('_') && !choiceName.includes('cm') && !choiceName.match(/\d/)) {
                const parts = choiceName.split('_');
                choiceName = parts[parts.length - 1];
              }

              if (!seenValues.has(choiceName)) {
                seenValues.add(choiceName);
                secondAxisOptions.push({
                  value: choiceName,
                  available: choice.stock?.isAvailable === true
                });
              }
            });
          });

          if (secondAxisOptions.length > 0) {
            groups.push({
              name: secondAxisName,
              options: secondAxisOptions
            });
          }
        }

        return { groups, colorSizeMapping, postageFlag };
      }

      // Сначала пробуем individualItemOptionList (приоритетный, более точный)
      if (optionListData && Array.isArray(optionListData) && optionListData.length > 0) {
        console.log('[Debug] Using individualItemOptionList');
        const optionList = optionListData;

        // Создаем map из itemOptions для получения stock информации
        const stockMap = new Map<string, boolean>();
        if (itemOptionsData && Array.isArray(itemOptionsData)) {
          itemOptionsData.forEach((item: any) => {
            if (item.options && Array.isArray(item.options)) {
              item.options.forEach((opt: any) => {
                const optName = opt.name;
                const isAvailable = opt.stock?.isAvailable === true;
                if (optName) {
                  stockMap.set(optName, isAvailable);
                }
              });
            }
          });
          console.log('[Debug] Built stock map with', stockMap.size, 'entries');
        }

        // Также проверяем DOM элементы для stock информации и цен
        const domStockMap = new Map<string, boolean>();
        const domPriceMap = new Map<string, string>();
        try {
          const labels = document.querySelectorAll('label.styles_optionLabel__y2HbV, label[class*="optionLabel"]');
          labels.forEach((label) => {
            const optionTextEl = label.querySelector('.styles_optionText__pz_dv, [class*="optionText"]');
            const stockText = label.querySelector('.styles_stockText__EUxtn, [class*="stockText"]')?.textContent?.trim();
            const priceEl = label.querySelector('.styles_subcodePrice__NRkUX, [class*="subcodePrice"]');

            if (optionTextEl) {
              // Клонируем элемент чтобы не изменять реальный DOM
              const clonedEl = optionTextEl.cloneNode(true) as HTMLElement;

              // Удаляем лейблы типа "人気", "おトク" из клона
              const hotLabels = clonedEl.querySelectorAll('.styles_optionHotLabel__6PTVt, .styles_optionGoodDealLabel__fZnKd, [class*="HotLabel"], [class*="hotLabel"], [class*="GoodDeal"]');
              hotLabels.forEach(label => label.remove());

              const optionText = clonedEl.textContent?.trim();

              if (optionText) {
                // Проверяем текст наличия: "在庫なし" = нет в наличии
                const isAvailable = !stockText || !stockText.includes('在庫なし');
                domStockMap.set(optionText, isAvailable);

                // Сохраняем цену если есть
                if (priceEl) {
                  const priceText = priceEl.textContent?.trim();
                  if (priceText) {
                    domPriceMap.set(optionText, priceText);
                  }
                }
              }
            }
          });
          console.log('[Debug] Built DOM stock map with', domStockMap.size, 'entries');
          console.log('[Debug] Built DOM price map with', domPriceMap.size, 'entries');
        } catch (e: any) {
          console.log('[Debug] Failed to parse DOM stock:', e.message);
        }

        optionList.forEach((group: any) => {
          let groupName = group.name || 'オプション';

          // Переводим японские названия на английский
          if (groupName === 'サイズ') {
            groupName = 'Size';
          } else if (groupName === 'カラー' || groupName === '色') {
            groupName = 'Color';
          }

          const options: Array<{ value: string; available: boolean }> = [];

          // Поддерживаем оба формата: choiceName (старый) и name (новый)
          group.choiceList?.forEach((choice: any) => {
            let value = choice.choiceName || choice.name;

            // Проверяем availability из нескольких источников
            let available = choice.isAvailable !== false && choice.isSelectable !== false;

            // Если есть DOM данные, используем их (самые точные)
            if (domStockMap.size > 0 && value && domStockMap.has(value)) {
              available = domStockMap.get(value) === true;
              console.log('[Debug] DOM stock for', value, ':', available);
            }
            // Если есть stockMap, используем данные оттуда
            else if (stockMap.size > 0 && value && stockMap.has(value)) {
              available = stockMap.get(value) === true;
            }

            // Добавляем цену из DOM если есть
            if (domPriceMap.size > 0 && value && domPriceMap.has(value)) {
              const price = domPriceMap.get(value);
              if (price) {
                value = `${value} (${price})`;
                console.log('[Debug] Added price from DOM:', value);
              }
            }

            if (value) {
              options.push({ value, available });
            }
          });

          if (options.length > 0) {
            groups.push({
              name: groupName,
              options: options
            });
          }
        });

        return { groups, colorSizeMapping: {}, postageFlag };
      }

      // Если individualItemOptionList пуст, пробуем selectOptionList
      if (selectOptionListData && Array.isArray(selectOptionListData)) {
        console.log('[Debug] Using selectOptionList, length:', selectOptionListData.length);
        console.log('[Debug] selectOptionListData structure:', JSON.stringify(selectOptionListData).substring(0, 1000));

        selectOptionListData.forEach((group: any, index: number) => {
          console.log(`[Debug] Processing selectOptionList group ${index}:`, JSON.stringify(group).substring(0, 500));

          let groupName = group.name || 'Option';

          // Переводим японские названия на английский
          if (groupName === 'サイズ') {
            groupName = 'Size';
          } else if (groupName === 'カラー' || groupName === '色') {
            groupName = 'Color';
          }

          // Пропускаем группы, которые не являются вариантами товара
          // (например, информация о доставке)
          if (groupName.includes('配送') || groupName.includes('地域')) {
            console.log('[Debug] Skipping group (delivery/region):', groupName);
            return;
          }

          const options: Array<{ value: string; available: boolean }> = [];

          if (group.choiceList && Array.isArray(group.choiceList)) {
            console.log(`[Debug] Group ${groupName} has choiceList with ${group.choiceList.length} items`);
            group.choiceList.forEach((choice: any) => {
              let displayValue = choice.name;

              // Добавляем цену если есть charge
              if (choice.charge && choice.charge > 0) {
                displayValue = `${choice.name} (+¥${choice.charge.toLocaleString()})`;
              }

              options.push({
                value: displayValue,
                available: choice.isSelectable !== false
              });
            });
          } else {
            console.log(`[Debug] Group ${groupName} has no choiceList or it's not an array`);
          }

          if (options.length > 0) {
            groups.push({ name: groupName, options });
            console.log(`[Debug] Added group ${groupName} with ${options.length} options`);
          }
        });

        console.log('[Debug] After selectOptionList parsing, groups.length:', groups.length);

        // Только возвращаем результат если нашли группы
        if (groups.length > 0) {
          return { groups, colorSizeMapping: {}, postageFlag };
        }
        // Иначе продолжаем к fallback методам
      }

      // Fallback: парсинг select элементов
      const selects = document.querySelectorAll('select[name*="選択"]');
      selects.forEach(select => {
        const label = select.getAttribute('aria-label') ||
                     select.previousElementSibling?.textContent?.trim() ||
                     'オプション';

        const options: Array<{ value: string; available: boolean }> = [];
        const optionElements = select.querySelectorAll('option');

        optionElements.forEach(option => {
          const value = option.textContent?.trim();
          const isDisabled = option.disabled || option.textContent?.includes('在庫なし');

          if (value && value !== '選択してください' && value !== '----') {
            options.push({
              value: value,
              available: !isDisabled
            });
          }
        });

        if (options.length > 0) {
          groups.push({ name: label, options });
        }
      });

      // Fallback 2: парсинг радио-кнопок с классом Radio (формат с Radio__input)
      if (groups.length === 0) {
        console.log('[Debug] Trying to parse Radio buttons');

        const radioInputs = document.querySelectorAll('input.Radio__input[type="radio"]');
        console.log('[Debug] Found radio inputs:', radioInputs.length);

        // Группируем по атрибуту name
        const radioGroups = new Map<string, Array<{ value: string; available: boolean }>>();

        radioInputs.forEach((input) => {
          const groupName = input.getAttribute('name') || 'Option';
          const value = input.getAttribute('value');

          // Ищем текст из Radio__text (может содержать цену)
          const parent = input.closest('.Radio, [class*="radio"]');
          const textSpan = parent?.querySelector('.Radio__text, [class*="Radio__text"]');
          const displayText = textSpan?.textContent?.trim() || value;

          // Проверяем доступность
          const isSelectable = parent?.classList.contains('styles_selectable__') ||
                               parent?.querySelector('[class*="selectable"]') !== null ||
                               !input.hasAttribute('disabled');

          if (displayText) {
            if (!radioGroups.has(groupName)) {
              radioGroups.set(groupName, []);
            }

            radioGroups.get(groupName)!.push({
              value: displayText,
              available: isSelectable
            });
          }
        });

        console.log('[Debug] Found radio groups:', radioGroups.size);

        // Преобразуем в groups
        for (const [groupName, options] of radioGroups) {
          if (options.length > 0) {
            let translatedName = groupName;

            // Переводим японские названия
            if (groupName === 'サイズ') translatedName = 'Size';
            else if (groupName === 'カラー' || groupName === '色') translatedName = 'Color';
            else if (groupName === '容量') translatedName = 'Capacity';
            else if (groupName === 'セット' || groupName === '商品タイプ') translatedName = 'Type';

            groups.push({ name: translatedName, options });
            console.log(`[Debug] Added radio group ${translatedName} with ${options.length} options`);
          }
        }
      }

      // Fallback 3: парсинг кнопок с data-cl-params (новый формат Yahoo)
      if (groups.length === 0) {
        console.log('[Debug] Trying to parse buttons with data-cl-params');

        // Ищем все кнопки с data-cl-params
        const axisButtons = document.querySelectorAll('button[data-cl-params]');
        console.log('[Debug] Found buttons with data-cl-params:', axisButtons.length);

        // Группируем кнопки по axis
        const axisGroups = new Map<string, Array<{ value: string; available: boolean; price?: string }>>();

        axisButtons.forEach((btn) => {
          const params = btn.getAttribute('data-cl-params') || '';
          const axisMatch = params.match(/_cl_link:axis_(\d+)/);

          if (axisMatch) {
            const axisNum = axisMatch[1];
            const axisKey = `axis_${axisNum}`;

            // Извлекаем текст кнопки
            const textSpan = btn.querySelector('.styles_buttonText__p6uek, [class*="buttonText"]');
            const priceSpan = btn.querySelector('.styles_price__w2Ck2, [class*="price"]');

            const value = textSpan?.textContent?.trim();
            const price = priceSpan?.textContent?.trim();
            const isDisabled = btn.hasAttribute('disabled') || btn.classList.contains('disabled');

            if (value) {
              if (!axisGroups.has(axisKey)) {
                axisGroups.set(axisKey, []);
              }

              axisGroups.get(axisKey)!.push({
                value: price ? `${value} (${price})` : value,
                available: !isDisabled,
                price
              });
            }
          }
        });

        console.log('[Debug] Found axis groups:', axisGroups.size);

        // Преобразуем в groups с названиями
        const axisNames = ['Type', 'Variant', 'Size', 'Option'];
        let axisIndex = 0;

        for (const [axisKey, options] of axisGroups) {
          if (options.length > 0) {
            const groupName = axisNames[axisIndex] || `Option ${axisIndex + 1}`;
            groups.push({ name: groupName, options });
            axisIndex++;
          }
        }
      }

      // Fallback 3: парсинг кнопок и радио-кнопок (для других магазинов)
      if (groups.length === 0) {
        console.log('[Debug] Trying generic button/radio parsing');

        // Ищем группы вариантов по различным селекторам
        const variantGroups = document.querySelectorAll('.elChoice, .Choice, [class*="choice"], [class*="variant"]');

        variantGroups.forEach(group => {
          const groupName = group.querySelector('dt, .ChoiceTitle, [class*="title"]')?.textContent?.trim() || 'オプション';
          const buttons = group.querySelectorAll('button, label, input[type="radio"]');
          const options: Array<{ value: string; available: boolean }> = [];

          buttons.forEach(btn => {
            let value = btn.textContent?.trim() || btn.getAttribute('value')?.trim();
            const isDisabled = btn.hasAttribute('disabled') ||
                             btn.classList.contains('disabled') ||
                             btn.classList.contains('soldOut');

            if (value && value.length > 0 && value !== '選択') {
              options.push({
                value: value,
                available: !isDisabled
              });
            }
          });

          if (options.length > 0) {
            groups.push({ name: groupName, options });
          }
        });
      }

      return { groups, colorSizeMapping: {}, postageFlag };
    });

    await browser.close();

    const { groups: variantGroups, colorSizeMapping, postageFlag } = result;

    console.log(`[Yahoo Variants] Found ${variantGroups.length} variant groups`);
    console.log(`[Yahoo Variants] postageFlag: ${postageFlag}`);
    console.log(`[Yahoo Variants] Groups:`, JSON.stringify(variantGroups, null, 2));
    console.log(`[Yahoo Variants] Color-Size Mapping:`, JSON.stringify(colorSizeMapping, null, 2));

    // Convert to flat list for compatibility
    const allVariants: YahooVariant[] = [];
    for (const group of variantGroups) {
      for (const option of group.options) {
        // Добавляем (Sold Out) к значению если недоступно
        const displayValue = option.available
          ? option.value
          : `${option.value} (Sold Out)`;

        allVariants.push({
          name: `${group.name}: ${displayValue}`,
          value: option.value,
          isAvailable: option.available
        });
      }
    }

    console.log(`[Yahoo Variants] Total variants: ${allVariants.length}`);

    return res.status(200).json({
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
    });

  } catch (error) {
    console.error('[Yahoo Variants] Error:', error);

    return res.status(200).json({
      success: true,
      variants: [],
      groups: [],
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalGroups: 0,
        totalVariants: 0,
        method: 'Failed'
      }
    });
  }
}

