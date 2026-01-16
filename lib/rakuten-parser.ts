import puppeteer from 'puppeteer';

export interface VariantOption {
  value: string;
  label: string;
  available: boolean;
  price?: number; // Цена для этого варианта (если отличается)
}

export interface VariantGroup {
  name: string;
  key: string;
  options: VariantOption[];
}

export interface ParsedVariantsResult {
  groups: VariantGroup[];
  colorSizeMapping?: Record<string, Array<{ value: string; available: boolean }>>;
  postageFlag?: number;
}

/**
 * Парсит варианты товара со страницы Rakuten используя Puppeteer
 * @param url URL товара на Rakuten
 * @returns Результат с массивом групп вариантов и маппингом цвет-размер
 */
export async function parseRakutenVariants(url: string): Promise<ParsedVariantsResult> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Убираем признаки автоматизации
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['ja-JP', 'ja', 'en-US', 'en'] });
    });

    // Блокируем ТОЛЬКО картинки - JS и CSS нужны для рендеринга!
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();

      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('[Rakuten Parser] Browser configured');
    console.log('[Rakuten Parser] Navigating to:', url);

    // Логируем все запросы
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes('rakuten.co.jp') && !url.includes('.jpg') && !url.includes('.png')) {
        console.log('[Rakuten Parser] Response:', status, url.substring(0, 100));
      }
    });

    // Переходим на страницу - пробуем domcontentloaded вместо networkidle
    let navigationSuccess = false;
    try {
      console.log('[Rakuten Parser] Starting navigation...');
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      navigationSuccess = true;
      console.log('[Rakuten Parser] ✓ Navigation completed (domcontentloaded)');
    } catch (navigationError: any) {
      console.error('[Rakuten Parser] ✗ Navigation failed:', navigationError.message);
    }

    // Ждем пока body появится
    console.log('[Rakuten Parser] Waiting for body element...');
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      console.log('[Rakuten Parser] ✓ Body element found');
    } catch (err) {
      console.error('[Rakuten Parser] ✗ Body element not found!');
    }

    // Ждем пока document станет interactive или complete
    console.log('[Rakuten Parser] Waiting for document ready...');
    await page.waitForFunction(
      () => document.readyState === 'interactive' || document.readyState === 'complete',
      { timeout: 10000 }
    ).catch(() => console.log('[Rakuten Parser] Document ready timeout'));

    // Дополнительная задержка для загрузки скриптов
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Проверяем состояние страницы
    const pageState = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        bodyExists: !!document.body,
        bodyLength: document.body ? document.body.innerHTML.length : 0,
        title: document.title,
        url: window.location.href
      };
    });
    console.log('[Rakuten Parser] Page state after wait:', pageState);

    // Ждём появления контента с вариантами
    try {
      console.log('[Rakuten Parser] Waiting for content area...');
      await Promise.race([
        page.waitForSelector('[irc="SkuSelectionArea"]', { timeout: 5000 }),
        page.waitForSelector('[irc="OptionArea"]', { timeout: 5000 }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
      console.log('[Rakuten Parser] Content area wait completed');
    } catch {
      console.log('[Rakuten Parser] Content area wait timeout');
    }

    // Еще одна задержка для React рендеринга
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Сначала пытаемся найти данные в JavaScript переменных (быстрее и точнее)
    const variantsFromJS = await page.evaluate(() => {
      let foundVariantSelectors = false;
      let foundSku = false;

      try {
        // Ищем variantSelectors и sku массив в скриптах
        const scripts = Array.from(document.querySelectorAll('script'));

        for (const script of scripts) {
          const content = script.textContent || '';

          // Ищем variantSelectors - пробуем разные варианты
          let variantSelectorsMatch = content.match(/"variantSelectors"\s*:\s*(\[[\s\S]*?\])\s*,/);
          if (!variantSelectorsMatch) {
            // Альтернативный вариант без запятой в конце
            variantSelectorsMatch = content.match(/"variantSelectors"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
          }

          // Ищем sku - пробуем разные варианты
          let skuMatch = content.match(/"sku"\s*:\s*(\[[\s\S]*?\])\s*,/);
          if (!skuMatch) {
            // Альтернативный вариант без запятой в конце
            skuMatch = content.match(/"sku"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
          }

          if (variantSelectorsMatch) foundVariantSelectors = true;
          if (skuMatch) foundSku = true;

          if (variantSelectorsMatch && skuMatch) {
            try {
              const variantSelectors = JSON.parse(variantSelectorsMatch[1]);
              const skuArray = JSON.parse(skuMatch[1]);

              const groups: any[] = [];
              const mapping: Record<string, any[]> = {};

              // Строим маппинг цен из SKU массива
              const priceMap: Record<string, number> = {};
              skuArray.forEach((sku: any) => {
                if (sku.selectorValues && sku.selectorValues.length > 0) {
                  // Используем первое значение селектора как ключ
                  const key = sku.selectorValues[0];

                  // Пытаемся найти цену в разных полях SKU
                  const price = sku.newPurchaseSku?.price?.value ||
                               sku.newPurchaseSku?.price ||
                               sku.price?.value ||
                               sku.price;

                  if (price && typeof price === 'number' && price > 0) {
                    priceMap[key] = price;
                  }
                }
              });

              // Строим группы из variantSelectors
              variantSelectors.forEach((selector: any, index: number) => {
                const groupName = selector.label || selector.key;
                const options = selector.values.map((v: any) => {
                  const value = v.value || v.label;
                  return {
                    value: value,
                    label: v.label || v.value,
                    available: true, // Будем проверять через SKU
                    price: priceMap[value] || undefined
                  };
                });

                groups.push({
                  name: groupName,
                  key: selector.key,
                  options,
                  index
                });
              });

              // Строим маппинг доступности из SKU массива
              if (groups.length >= 2) {
                // Двумерные варианты (размер + цвет)
                const firstGroup = groups[0];
                const secondGroup = groups[1];

                // Определяем какая группа размер, какая цвет
                const isFirstSize = firstGroup.name.includes('サイズ') ||
                                   firstGroup.name.toLowerCase().includes('size');
                const isSecondColor = secondGroup.name.includes('カラー') ||
                                     secondGroup.name.toLowerCase().includes('color');

                // Строим маппинг: если первый - размер, второй - цвет, то маппим размер→цвет
                // Если наоборот, то цвет→размер
                const primaryGroup = isFirstSize ? firstGroup : secondGroup;
                const secondaryGroup = isFirstSize ? secondGroup : firstGroup;
                const primaryIndex = isFirstSize ? 0 : 1;
                const secondaryIndex = isFirstSize ? 1 : 0;

                primaryGroup.options.forEach((primaryOpt: any) => {
                  const availableSecondary: any[] = [];
                  const seenValues = new Set<string>();

                  skuArray.forEach((sku: any) => {
                    if (sku.selectorValues && sku.selectorValues[primaryIndex] === primaryOpt.value) {
                      const secondaryValue = sku.selectorValues[secondaryIndex];

                      if (!seenValues.has(secondaryValue)) {
                        seenValues.add(secondaryValue);
                        const isAvailable = !sku.newPurchaseSku?.stockCondition ||
                                          sku.newPurchaseSku.stockCondition !== 'sold-out';

                        availableSecondary.push({
                          value: secondaryValue,
                          available: isAvailable
                        });
                      }
                    }
                  });

                  if (availableSecondary.length > 0) {
                    mapping[primaryOpt.value] = availableSecondary;
                  }
                });
              }

              return { success: true, groups, mapping };
            } catch (e) {
              console.error('[JS Parser] JSON parse error:', e);
            }
          }
        }
      } catch (e) {
        console.error('[JS Parser] Error:', e);
      }

      return { success: false, foundVariantSelectors, foundSku };
    });

    // Логируем результаты JS парсинга
    if (!variantsFromJS.success) {
      console.log('[Rakuten Parser] JS parsing failed - variantSelectors:', variantsFromJS.foundVariantSelectors, 'sku:', variantsFromJS.foundSku);
    }

    // Если нашли данные в JS, используем их
    if (variantsFromJS.success && variantsFromJS.groups) {
      console.log('[Rakuten Parser] ✅ JS parsing succeeded -', variantsFromJS.groups.length, 'groups');
      return {
        groups: variantsFromJS.groups,
        colorSizeMapping: variantsFromJS.mapping
      };
    }

    // Иначе парсим DOM как раньше
    console.log('[Rakuten Parser] Trying DOM parsing...');

    // Добавляем детальную диагностику
    const pageInfo = await page.evaluate(() => {
      const body = document.body;
      const html = body ? body.innerHTML : 'NO BODY';

      // Ищем все возможные варианты SkuArea
      const skuArea1 = document.querySelector('[irc="SkuSelectionArea"]');
      const skuArea2 = document.querySelector('.display-sku-area');
      const skuArea3 = document.querySelector('[class*="sku"]');

      // Ищем варианты OptionArea
      const optionArea1 = document.querySelector('[irc="OptionArea"]');
      const optionArea2 = document.querySelector('[class*="option"]');

      // Все кнопки и селекты
      const allButtons = document.querySelectorAll('button');
      const allSelects = document.querySelectorAll('select');

      // Ищем специфичные классы из HTML который показал пользователь
      const spacerBlocks = document.querySelectorAll('.spacer--1O71j');
      const textDisplays = document.querySelectorAll('.text-display--3jedW');

      // Ищем варианты по aria-label
      const buttonsWithAriaLabel = document.querySelectorAll('button[aria-label]');

      // Ищем script теги с данными
      const scripts = Array.from(document.querySelectorAll('script'));
      const hasVariantSelectorsInScripts = scripts.some(s =>
        (s.textContent || '').includes('variantSelectors')
      );
      const hasSkuInScripts = scripts.some(s =>
        (s.textContent || '').includes('"sku"')
      );

      return {
        hasBody: !!body,
        bodyLength: html.length,

        // SKU Area
        hasSkuArea1: !!skuArea1,
        hasSkuArea2: !!skuArea2,
        hasSkuArea3: !!skuArea3,
        skuArea1Html: skuArea1 ? skuArea1.outerHTML.substring(0, 500) : null,

        // Option Area
        hasOptionArea1: !!optionArea1,
        hasOptionArea2: !!optionArea2,

        // Элементы
        buttonsCount: allButtons.length,
        selectsCount: allSelects.length,
        spacerBlocksCount: spacerBlocks.length,
        textDisplaysCount: textDisplays.length,
        buttonsWithAriaLabelCount: buttonsWithAriaLabel.length,

        // Примеры текста
        firstButtonsText: Array.from(allButtons).slice(0, 10).map(b => ({
          text: b.textContent?.trim().substring(0, 50),
          ariaLabel: b.getAttribute('aria-label'),
          className: b.className
        })),

        spacerTexts: Array.from(spacerBlocks).slice(0, 20).map(el =>
          el.textContent?.trim().substring(0, 100)
        ),

        // Scripts
        hasVariantSelectorsInScripts,
        hasSkuInScripts,
        scriptsCount: scripts.length,

        // HTML preview (если страница пустая)
        htmlPreview: html.length < 1000 ? html : html.substring(0, 2000) + '...'
      };
    });

    console.log('[Rakuten Parser] ========== DETAILED PAGE INFO ==========');
    console.log('[Rakuten Parser] Body length:', pageInfo.bodyLength);
    console.log('[Rakuten Parser] Buttons:', pageInfo.buttonsCount);
    console.log('[Rakuten Parser] Buttons with aria-label:', pageInfo.buttonsWithAriaLabelCount);
    console.log('[Rakuten Parser] Spacer blocks:', pageInfo.spacerBlocksCount);
    console.log('[Rakuten Parser] Text displays:', pageInfo.textDisplaysCount);
    console.log('[Rakuten Parser] SKU Areas:', {
      type1: pageInfo.hasSkuArea1,
      type2: pageInfo.hasSkuArea2,
      type3: pageInfo.hasSkuArea3
    });
    console.log('[Rakuten Parser] Option Areas:', {
      type1: pageInfo.hasOptionArea1,
      type2: pageInfo.hasOptionArea2
    });
    console.log('[Rakuten Parser] Scripts:', {
      total: pageInfo.scriptsCount,
      hasVariantSelectors: pageInfo.hasVariantSelectorsInScripts,
      hasSku: pageInfo.hasSkuInScripts
    });

    if (pageInfo.spacerBlocksCount > 0) {
      console.log('[Rakuten Parser] Spacer texts (first 20):', pageInfo.spacerTexts);
    }

    if (pageInfo.buttonsWithAriaLabelCount > 0) {
      console.log('[Rakuten Parser] First 10 buttons:', pageInfo.firstButtonsText);
    }

    if (pageInfo.bodyLength < 1000) {
      console.log('[Rakuten Parser] ⚠️ PAGE LOOKS EMPTY! HTML:', pageInfo.htmlPreview);
    }

    console.log('[Rakuten Parser] ========================================');

    const variantsStructure = await page.evaluate(() => {
      const result: VariantGroup[] = [];
      const debug = {
        hasSkuArea: false,
        skuGroupsCount: 0,
        hasOptionArea: false,
        optionContainersCount: 0
      };

      // Массивы для хранения данных о цветах и размерах
      let colorGroup: VariantGroup | null = null;
      let sizeGroup: VariantGroup | null = null;

      // Стратегия 1: Кнопки SKU в SkuSelectionArea
      const skuArea = document.querySelector('[irc="SkuSelectionArea"], .display-sku-area');
      debug.hasSkuArea = !!skuArea;

      console.log('[DOM Parser] SKU Area found:', !!skuArea);

      if (skuArea) {
        console.log('[DOM Parser] SKU Area HTML length:', skuArea.innerHTML.length);

        // Находим все группы вариантов (Цвет, Размер и т.д.)
        const groups = skuArea.querySelectorAll('.spacer--3J57F.block--_IJiJ.padding-bottom-small--UuLKJ');
        debug.skuGroupsCount = groups.length;

        console.log('[DOM Parser] Found variant groups:', groups.length);
        console.log('[DOM Parser] Group selector used: .spacer--3J57F.block--_IJiJ.padding-bottom-small--UuLKJ');

      groups.forEach((group, groupIndex) => {
        console.log('[DOM Parser] Processing group', groupIndex);

        // Находим название группы (любое)
        const labelElements = group.querySelectorAll('.text-display--2xC98');
        let groupName = '';

        console.log('[DOM Parser] Label elements in group:', labelElements.length);

        for (const el of Array.from(labelElements)) {
          const text = el.textContent?.trim() || '';
          console.log('[DOM Parser] Label text:', text);
          // Берём первый непустой текст, который не "未選択" (не выбрано)
          if (text && text.length > 0 && text.length < 50 && !text.includes('未選択')) {
            // Убираем двоеточие и берём только первую часть
            groupName = text.replace('：', '').replace(':', '').trim();
            console.log('[DOM Parser] ✓ Group name found:', groupName);
            break;
          }
        }

        if (!groupName) {
          console.log('[DOM Parser] ✗ No group name found, skipping');
          return;
        }

        // Находим все кнопки вариантов в этой группе
        const buttons = group.querySelectorAll('button[class*="sku-button"]');
        console.log('[DOM Parser] Buttons in group:', buttons.length);
        const options: { value: string; label: string; available: boolean; element: Element; price?: number }[] = [];

        buttons.forEach((button) => {
          const ariaLabel = button.getAttribute('aria-label');
          const textContent = button.textContent?.trim() || '';

          // Извлекаем значение из aria-label или текста
          const value = ariaLabel || textContent;

          if (!value) return;

          // Проверяем доступность по нескольким признакам:
          // 1. Disabled атрибут
          // 2. ARIA disabled
          // 3. CSS класс sold-out/disabled
          // 4. Класс conditional (недоступен в контексте)
          // 5. Текст "売り切れ" или "再入荷" внутри кнопки
          const hasSoldOutText = textContent.includes('売り切れ') || textContent.includes('再入荷');

          const isDisabled =
            button.hasAttribute('disabled') ||
            button.classList.contains('disabled') ||
            button.classList.contains('sold-out') ||
            button.classList.contains('conditional') ||
            button.getAttribute('aria-disabled') === 'true' ||
            hasSoldOutText;

          // Парсим цену варианта - она находится ВНУТРИ кнопки
          let price: number | undefined = undefined;

          // Ищем div с ценой внутри самой кнопки
          const priceContainer = button.querySelector('.spacer--3J57F.block--_IJiJ.padding-all-small--1KSBh');
          if (priceContainer) {
            // Ищем все div внутри контейнера
            const divs = priceContainer.querySelectorAll('div');
            for (const div of Array.from(divs)) {
              const text = div.textContent?.trim() || '';
              // Ищем div с ценой (содержит "円" и цифры, но не содержит <span>)
              if (text.includes('円') && /\d/.test(text) && !div.querySelector('span')) {
                const priceMatch = text.match(/([\d,]+)円/);
                if (priceMatch) {
                  const parsedPrice = parseInt(priceMatch[1].replace(/,/g, ''));
                  if (parsedPrice > 0) {
                    price = parsedPrice;
                    break;
                  }
                }
              }
            }
          }

          options.push({
            value: value,
            label: value,
            available: !isDisabled,
            element: button,
            price: price
          });
        });

        if (options.length > 0) {
          console.log('[DOM Parser] ✓ Found', options.length, 'options for group:', groupName);

          const variantGroup = {
            name: groupName,
            key: groupName,
            options: options.map(o => ({
              value: o.value,
              label: o.label,
              available: o.available,
              price: o.price
            }))
          };

          result.push(variantGroup);

          // Определяем тип группы (цвет или размер)
          const isColorGroup = groupName.includes('カラー') || groupName.includes('色') ||
                               groupName.toLowerCase().includes('color') || groupName.toLowerCase().includes('colour');
          const isSizeGroup = groupName.includes('サイズ') || groupName.toLowerCase().includes('size');

          if (isColorGroup) {
            colorGroup = variantGroup;
            console.log('[DOM Parser] This is a COLOR group');
          } else if (isSizeGroup) {
            sizeGroup = variantGroup;
            console.log('[DOM Parser] This is a SIZE group');
          }
        } else {
          console.log('[DOM Parser] ✗ No options found for group:', groupName);
        }
      });
      }

      console.log('[DOM Parser] Total variant groups found:', result.length);

      // Стратегия 2: Select элементы в OptionArea (для товаров с выпадающими списками)
      const optionArea = document.querySelector('[irc="OptionArea"]');
      debug.hasOptionArea = !!optionArea;

      if (optionArea && result.length === 0) {
        // Ищем все select элементы с вариантами
        const containers = optionArea.querySelectorAll('.container--1cqwo');
        debug.optionContainersCount = containers.length;

        containers.forEach((container) => {
          // Находим label (любой вариант)
          const label = container.querySelector('.text-container--2tSUW.style-bold--1IVlx');
          if (!label) return;

          const labelText = label.textContent?.trim() || '';

          // Пропускаем только явно не нужные поля (отзывы, промо и т.д.)
          if (!labelText ||
              labelText.includes('レビュー') ||
              labelText.includes('review') ||
              labelText.includes('ノベルティ') ||
              labelText.length > 100) {
            return;
          }

          // Убираем слово "選択" и другие лишние части
          const groupName = labelText
            .replace(/選択/g, '')
            .replace(/必須/g, '')
            .trim();

          // Находим select элемент
          const select = container.querySelector('select');
          if (!select) return;

          const options: VariantOption[] = [];

          // Парсим option элементы
          Array.from(select.options).forEach((option) => {
            const value = option.value.trim();
            const text = option.textContent?.trim() || '';

            // Пропускаем пустые и placeholder опции
            if (!value || !text || text.includes('選択してください') || text.includes('選択')) {
              return;
            }

            options.push({
              value: text,
              label: text,
              available: !option.disabled
            });
          });

          if (options.length > 0) {
            result.push({
              name: groupName,
              key: groupName,
              options
            });
          }
        });
      }

      return { groups: result, colorGroup, sizeGroup, debug };
    });

    const { groups, colorGroup, sizeGroup, debug }: {
      groups: VariantGroup[];
      colorGroup: VariantGroup | null;
      sizeGroup: VariantGroup | null;
      debug: any;
    } = variantsStructure;

    // Логируем результаты DOM парсинга
    console.log('[Rakuten Parser] DOM parsing result:', {
      foundGroups: groups.length,
      hasSkuArea: debug.hasSkuArea,
      skuGroupsCount: debug.skuGroupsCount,
      hasOptionArea: debug.hasOptionArea,
      optionContainersCount: debug.optionContainersCount
    });

    let colorSizeMapping: Record<string, Array<{ value: string; available: boolean }>> = {};

    // Если есть и цвета, и размеры - пропускаем проверку через клики
    // Доступность уже определена по классам кнопок в DOM
    const hasColorAndSize = colorGroup && sizeGroup;

    // УБИРАЕМ проверку доступности через клики - она занимает слишком много времени
    // Доступность определяется по классам кнопок (disabled, sold-out, conditional) в DOM парсинге

    // Если есть и цвета, и размеры, создаем базовый маппинг БЕЗ кликов
    // Используем данные из JS парсинга или создаем простой маппинг
    if (hasColorAndSize && colorGroup && sizeGroup) {
      const colorOpts = (colorGroup as VariantGroup).options as Array<{ value: string; label: string; available: boolean }>;
      const sizeOpts = (sizeGroup as VariantGroup).options as Array<{ value: string; label: string; available: boolean }>;

      // Для каждого цвета добавляем все размеры
      // Точность проверяется через JS парсинг (если данные есть)
      colorOpts.forEach(color => {
        colorSizeMapping[color.value] = sizeOpts.map(s => ({
          value: s.value,
          available: color.available && s.available // Оба должны быть доступны
        }));
      });
    }

    // Парсим информацию о бесплатной доставке
    const postageFlag = await page.evaluate(() => {
      // Ищем элементы с текстом "送料無料"
      const allElements = Array.from(document.querySelectorAll('*'));
      const freeShippingElements = allElements.filter(el => {
        const text = el.textContent?.trim() || '';
        // Проверяем что это именно текст "送料無料" без дочерних элементов
        return text === '送料無料' && el.children.length === 0;
      });

      return freeShippingElements.length > 0 ? 1 : 0;
    });

    return { groups, colorSizeMapping, postageFlag };

  } catch (error) {
    console.error('[Rakuten Parser] Error parsing variants:', error);
    // Возвращаем пустой результат вместо прокидывания ошибки
    // Это позволит странице товара работать даже без вариантов
    return { groups: [], colorSizeMapping: {}, postageFlag: 0 };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Парсит варианты используя более простой метод (без Puppeteer) - для случаев когда Puppeteer недоступен
 */
export function parseVariantsFromHtmlString(html: string): VariantGroup[] {
  const result: VariantGroup[] = [];

  try {
    // Ищем секцию с вариантами через регулярные выражения
    const skuAreaMatch = html.match(/irc="SkuSelectionArea"[\s\S]*?<\/tr>/);

    if (!skuAreaMatch) {
      return result;
    }

    const skuHtml = skuAreaMatch[0];

    // Парсим группы (Цвет, Размер)
    const colorMatch = skuHtml.match(/カラー[\s\S]*?<div class="container--[\s\S]*?<\/div><\/div><\/div><\/div>/);
    const sizeMatch = skuHtml.match(/サイズ[\s\S]*?<div class="container--[\s\S]*?<\/div><\/div><\/div><\/div>/);

    const parseGroup = (groupHtml: string, groupName: string): VariantGroup | null => {
      const buttonMatches = groupHtml.match(/aria-label="([^"]+)"[\s\S]*?<span>([^<]+)<\/span>/g);

      if (!buttonMatches) return null;

      const options: VariantOption[] = [];

      for (const match of buttonMatches) {
        const labelMatch = match.match(/aria-label="([^"]+)"/);
        const textMatch = match.match(/<span>([^<]+)<\/span>/);

        if (labelMatch && textMatch) {
          const value = labelMatch[1].trim();
          const isDisabled = match.includes('disabled') || match.includes('sold-out');

          options.push({
            value: value,
            label: value,
            available: !isDisabled
          });
        }
      }

      if (options.length === 0) return null;

      return {
        name: groupName,
        key: groupName,
        options
      };
    };

    if (colorMatch) {
      const colorGroup = parseGroup(colorMatch[0], 'カラー');
      if (colorGroup) result.push(colorGroup);
    }

    if (sizeMatch) {
      const sizeGroup = parseGroup(sizeMatch[0], 'サイズ');
      if (sizeGroup) result.push(sizeGroup);
    }

  } catch (error) {
    console.error('Error parsing variants from HTML string:', error);
  }

  return result;
}
