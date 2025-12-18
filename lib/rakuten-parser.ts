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
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Включаем логирование из браузера (только ошибки)
    // page.on('console', msg => {
    //   console.log('[Browser]', msg.text());
    // });

    // Устанавливаем User-Agent чтобы сайт не блокировал
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Блокируем ненужные ресурсы для ускорения загрузки (НЕ блокируем JS!)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Блокируем только тяжелые ресурсы, НО НЕ JAVASCRIPT
      if (
        resourceType === 'image' ||
        resourceType === 'font' ||
        resourceType === 'media' ||
        resourceType === 'stylesheet'
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Переходим на страницу с retry стратегией
    let navigationSuccess = false;
    const navigationStrategies = [
      { waitUntil: 'domcontentloaded' as const, timeout: 30000 },
      { waitUntil: 'load' as const, timeout: 20000 },
      { waitUntil: undefined, timeout: 15000 }
    ];

    for (const strategy of navigationStrategies) {
      try {
        const options: any = { timeout: strategy.timeout };
        if (strategy.waitUntil) {
          options.waitUntil = strategy.waitUntil;
        }

        await page.goto(url, options);
        navigationSuccess = true;
        break;
      } catch (navigationError: any) {

        // Если это последняя стратегия, логируем ошибку и продолжаем
        if (strategy === navigationStrategies[navigationStrategies.length - 1]) {
          console.error('[Rakuten Parser] All navigation strategies failed, attempting to parse anyway');
        }
      }
    }

    // Ждём появления основного контента товара
    await page.waitForSelector('body', { timeout: 3000 }).catch(() => {});

    // Даём время для загрузки динамического контента
    await new Promise(resolve => setTimeout(resolve, navigationSuccess ? 600 : 1000));

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

      if (skuArea) {
        // Находим все группы вариантов (Цвет, Размер и т.д.)
        const groups = skuArea.querySelectorAll('.spacer--3J57F.block--_IJiJ.padding-bottom-small--UuLKJ');
        debug.skuGroupsCount = groups.length;

      groups.forEach((group) => {
        // Находим название группы (любое)
        const labelElements = group.querySelectorAll('.text-display--2xC98');
        let groupName = '';

        for (const el of Array.from(labelElements)) {
          const text = el.textContent?.trim() || '';
          // Берём первый непустой текст, который не "未選択" (не выбрано)
          if (text && text.length > 0 && text.length < 50 && !text.includes('未選択')) {
            // Убираем двоеточие и берём только первую часть
            groupName = text.replace('：', '').replace(':', '').trim();
            break;
          }
        }

        if (!groupName) return;

        // Находим все кнопки вариантов в этой группе
        const buttons = group.querySelectorAll('button[class*="sku-button"]');
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
          } else if (isSizeGroup) {
            sizeGroup = variantGroup;
          }
        }
      });
      }

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

    // Если есть и цвета, и размеры - пропускаем быструю проверку
    // Для таких товаров доступность определяется через colorSizeMapping
    const hasColorAndSize = colorGroup && sizeGroup;

    if (!hasColorAndSize) {
      // Быстрая проверка доступности через клик и модальное окно (только для товаров БЕЗ комбинаций)
      // Сначала проверяем, какие варианты нужно проверить детально
      const needsDetailedCheck: Array<{ group: VariantGroup; option: VariantOption }> = [];

      for (const group of groups) {
        for (const option of group.options) {
          // Если вариант уже помечен как недоступный по классам кнопки, пропускаем
          if (!option.available) {
            continue;
          }

          // Если available, нужно проверить детально (может быть sold out)
          needsDetailedCheck.push({ group, option });
        }
      }

    // Проверяем только те, что нужно
    for (const { option } of needsDetailedCheck) {
      try {
        // СНАЧАЛА закрываем все открытые модалки от предыдущих кликов
        await page.evaluate(() => {
          const closeBtns = document.querySelectorAll('.top-close-button--1lun2, [class*="close-button"]');
          closeBtns.forEach(btn => (btn as HTMLElement).click());
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Кликаем на вариант и сразу получаем ID кнопки для точного сопоставления
        const clickResult = await page.evaluate((variantValue) => {
          const button = document.querySelector(`button[aria-label="${variantValue}"]`) as HTMLButtonElement;
          if (!button) return { clicked: false, buttonId: null };

          // Добавляем временный ID для точного отслеживания
          const tempId = `temp-btn-${Date.now()}`;
          button.setAttribute('data-temp-id', tempId);
          button.click();

          return { clicked: true, buttonId: tempId };
        }, option.value);

        if (!clickResult.clicked) {
          continue;
        }

        // Даем время модалке появиться
        await new Promise(resolve => setTimeout(resolve, 400));

        // Проверяем модальное окно - ищем ТОЛЬКО свежее окно с названием этого варианта
        const soldOutInfo = await page.evaluate((variantValue) => {
          // Ищем модалку, которая содержит ТОЧНОЕ название варианта в <span>
          const modals = document.querySelectorAll('.spacer--3J57F.block--_IJiJ.padding-all-small--1KSBh');

          for (const modal of Array.from(modals)) {
            // Проверяем, что в модалке есть <span> с названием варианта
            const spans = modal.querySelectorAll('span');
            let hasExactVariantName = false;

            for (const span of Array.from(spans)) {
              if (span.textContent?.trim() === variantValue) {
                hasExactVariantName = true;
                break;
              }
            }

            if (!hasExactVariantName) continue;

            // Теперь проверяем статус в этой модалке
            const text = modal.textContent || '';

            if (text.includes('売り切れ')) {
              return { found: true, status: 'sold out', variantMatch: true };
            }

            if (text.includes('再入荷')) {
              return { found: true, status: 'restocking', variantMatch: true };
            }

            // Если нашли модалку с нужным вариантом, но нет статусов - значит доступен
            return { found: false, status: '', variantMatch: true };
          }

          return { found: false, status: '', variantMatch: false };
        }, option.value);

        if (soldOutInfo.found) {
          option.available = false;
        }

      } catch (err) {
        // Игнорируем ошибки проверки
      }
    }
    } // Закрываем else блок быстрой проверки

    // Если есть и цвета, и размеры, проверяем доступность динамически
    if (hasColorAndSize && colorGroup && sizeGroup) {
      const colorOpts = (colorGroup as VariantGroup).options as Array<{ value: string; label: string; available: boolean }>;
      const sizeOpts = (sizeGroup as VariantGroup).options as Array<{ value: string; label: string; available: boolean }>;

      // Ограничиваем количество цветов для проверки (чтобы не было таймаута)
      const colorsToCheck = colorOpts.slice(0, 15); // Максимум 15 цветов

      // Для каждого цвета кликаем и проверяем доступность размеров
      for (const colorOption of colorsToCheck) {
        try {
          // Если сам цвет недоступен, то все его размеры тоже недоступны
          if (!colorOption.available) {
            colorSizeMapping[colorOption.value] = sizeOpts.map(s => ({
              value: s.value,
              available: false
            }));
            continue;
          }

          // Кликаем на цвет
          await page.evaluate((colorValue) => {
            const colorBtn = document.querySelector(`button[aria-label="${colorValue}"]`);
            if (colorBtn) {
              (colorBtn as HTMLButtonElement).click();
            }
          }, colorOption.value);

          await new Promise(resolve => setTimeout(resolve, 400));

          // Проверяем состояние размеров после клика на цвет
          const sizeAvailability = await page.evaluate((sizes: string[]) => {
            return sizes.map(sizeValue => {
              const sizeButton = document.querySelector(`button[aria-label="${sizeValue}"]`);
              if (!sizeButton) {
                return { value: sizeValue, available: false };
              }

              // Проверяем класс conditional (недоступен для текущего цвета)
              const hasConditional = sizeButton.className.includes('conditional');
              const isDisabled = sizeButton.hasAttribute('disabled') ||
                                sizeButton.getAttribute('aria-disabled') === 'true';

              return {
                value: sizeValue,
                available: !hasConditional && !isDisabled
              };
            });
          }, sizeOpts.map(s => s.value));

          colorSizeMapping[colorOption.value] = sizeAvailability;

        } catch (err) {
          // Fallback: все размеры доступны
          colorSizeMapping[colorOption.value] = sizeOpts.map(s => ({
            value: s.value,
            available: s.available
          }));
        }
      }

      // Для остальных цветов (которые не проверили) добавляем все размеры как доступные
      const uncheckedColors = colorOpts.slice(15);
      if (uncheckedColors.length > 0) {
        uncheckedColors.forEach(color => {
          colorSizeMapping[color.value] = sizeOpts.map(s => ({
            value: s.value,
            available: s.available
          }));
        });
      }
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
