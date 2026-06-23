// DeepL API Free - Best quality translation (500k chars/month)
// Docs: https://www.deepl.com/docs-api
// Used via /api/translate endpoint

export type Language = 'ja' | 'en' | 'es' | 'de' | 'th' | 'fil' | 'pt';

interface TranslationCache {
  [key: string]: string;
}

const cache: TranslationCache = {};

// localStorage ключ для кеша
const CACHE_KEY = 'translation_cache_v2';
const CACHE_EXPIRY_DAYS = 30;
const CACHE_CLEARED_FLAG = 'translation_cache_v9_deepl'; // Switched to DeepL API

// Загружаем кеш из localStorage при инициализации
if (typeof window !== 'undefined') {
  try {
    // Очищаем старые кэши при первом запуске после обновления
    localStorage.removeItem('translation_cache_v1');

    if (!localStorage.getItem(CACHE_CLEARED_FLAG)) {
            localStorage.removeItem(CACHE_KEY);
      // Remove all old flags
      for (let i = 1; i <= 8; i++) {
        localStorage.removeItem(`translation_cache_v${i}_*`);
      }
      localStorage.setItem(CACHE_CLEARED_FLAG, 'true');
    }

    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Проверяем срок годности кеша
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
        Object.assign(cache, parsed.data || {});
      } else {
        // Кеш устарел, удаляем
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (error) {
    // Тихо игнорируем ошибки загрузки кэша
  }
}

// Сохраняем кеш в localStorage
function saveCache() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: cache
      }));
    } catch (error) {
      // Тихо игнорируем ошибки сохранения кэша
    }
  }
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language
): Promise<string> {
  if (fromLang === toLang) return text;
  if (!text.trim()) return text;

  const cacheKey = `${fromLang}-${toLang}-${text}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [text],
        fromLang,
        toLang,
      }),
    });

    if (!response.ok) {
      return text; // Тихо возвращаем оригинал
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      return text; // Тихо возвращаем оригинал
    }

    try {
      const data = JSON.parse(responseText);

      if (data.translations?.[0]) {
        const translated = data.translations[0];
        cache[cacheKey] = translated;
        saveCache(); // Сохраняем в localStorage
        return translated;
      }

      return text; // Возвращаем оригинал при ошибке
    } catch (jsonError) {
      return text; // Тихо возвращаем оригинал
    }
  } catch (error) {
    return text; // Тихо возвращаем оригинал
  }
}

// Функция для перевода батча текстов
async function translateBatch(
  texts: string[],
  fromLang: Language,
  toLang: Language
): Promise<string[]> {
  if (fromLang === toLang) return texts;

  // Проверяем кеш для каждого текста
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  const results: string[] = [];
  let cacheHits = 0;

  texts.forEach((text, index) => {
    // Пропускаем символы и короткие тексты (точки, тире и т.д.)
    if (text.length < 2 || /^[\s\.\-\,\!\?\:\;]+$/.test(text)) {
      results[index] = text;
      return;
    }

    // Пропускаем цены и числа
    if (/^[\d\s¥$€£₽,.]+$/.test(text)) {
      results[index] = text;
      return;
    }

    // Пропускаем артикулы и коды товаров (только латиница, цифры, дефисы)
    // Примеры: "【1-FR8B】", "[ABC-123]", "SKU-12345", "MODEL-X"
    // НО переводим японский текст в скобках: "【送料無料】"
    if (/^[\[\]【】\-A-Z0-9\s]+$/i.test(text) && !/[ぁ-ゔァ-ヴー一-龯々〆〤]/.test(text)) {
      results[index] = text;
      return;
    }

    // Пропускаем очень короткие тексты (1-3 символа) - обычно это символы или аббревиатуры
    if (text.length <= 3) {
      results[index] = text;
      return;
    }

    const cacheKey = `${fromLang}-${toLang}-${text}`;
    if (cache[cacheKey]) {
      results[index] = cache[cacheKey];
      cacheHits++;
    } else {
      uncachedIndices.push(index);
      uncachedTexts.push(text);
    }
  });

  // Если все тексты в кеше, возвращаем их
  if (uncachedTexts.length === 0) {
    if (cacheHits > 0) {
          }
    return results;
  }

  if (cacheHits > 0) {
      }

  try {
    
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: uncachedTexts,
        fromLang,
        toLang,
      }),
    });

    if (!response.ok) {
      console.error(`[Translation API] Failed with status ${response.status}`);
      // Возвращаем оригинальные тексты для непереведенных
      uncachedIndices.forEach((originalIndex, i) => {
        results[originalIndex] = uncachedTexts[i];
      });
      return results;
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      console.error(`[Translation API] Empty response`);
      uncachedIndices.forEach((originalIndex, i) => {
        results[originalIndex] = uncachedTexts[i];
      });
      return results;
    }

    try {
      const data = JSON.parse(responseText);

      if (data.translations && Array.isArray(data.translations)) {
        let translatedCount = 0;
        data.translations.forEach((translated: string, i: number) => {
          const originalIndex = uncachedIndices[i];
          const originalText = uncachedTexts[i];
          results[originalIndex] = translated;

          // Кешируем перевод
          const cacheKey = `${fromLang}-${toLang}-${originalText}`;
          cache[cacheKey] = translated;

          // Логируем только если перевод отличается от оригинала
          if (translated !== originalText) {
            translatedCount++;
          }
        });
        saveCache(); // Сохраняем весь батч в localStorage
      }

      return results;
    } catch (jsonError) {
      console.error('[Translation API] JSON parse error:', jsonError);
      // Возвращаем оригинальные тексты
      uncachedIndices.forEach((originalIndex, i) => {
        results[originalIndex] = uncachedTexts[i];
      });
      return results;
    }
  } catch (error) {
    console.error('[Translation API] Network error:', error);
    // Возвращаем оригинальные тексты при ошибке
    uncachedIndices.forEach((originalIndex, i) => {
      results[originalIndex] = uncachedTexts[i];
    });
    return results;
  }
}

// Глобальная переменная для текущего языка
let currentLanguage: Language = 'ja';
let mutationObserver: MutationObserver | null = null;
let translatedElements: WeakSet<HTMLElement> = new WeakSet();

// Функция для перевода текстовых узлов
async function translateNodes(container: HTMLElement, targetLang: Language) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // Проверяем всех родителей до 5 уровней вверх
        let current: HTMLElement | null = parent;
        let depth = 0;
        while (current && depth < 5) {
          const tagName = current.tagName.toLowerCase();

          // Пропускаем технические элементы
          if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // НЕ переводим элементы с data-no-translate
          if (current.hasAttribute('data-no-translate')) {
            return NodeFilter.FILTER_REJECT;
          }

          // НЕ переводим input элементы
          if (['input', 'textarea', 'select', 'option'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Проверяем только прямого родителя текстового узла (depth === 0).
          // Контейнеры выше не помечаем — иначе блокируем динамически загруженный контент.
          if (depth === 0 && translatedElements.has(current)) {
            const hasJapanese = /[ぁ-ゔァ-ヴー一-龯々〆〤]/.test(node.textContent || '');
            if (!hasJapanese) {
              return NodeFilter.FILTER_REJECT;
            }
            // Японский текст появился снова (React обновил DOM) — переводим
            translatedElements.delete(current);
          }

          current = current.parentElement;
          depth++;
        }

        // Пропускаем пустые или только пробельные узлы
        const text = node.textContent?.trim();
        if (!text || text.length === 0) {
          return NodeFilter.FILTER_REJECT;
        }

        // НЕ переводим текст, который полностью состоит из цифр, символов валюты и пробелов
        // Примеры: "¥1,234", "$99.99", "123", "¥ 1,234"
        if (/^[\d\s¥$€£₽,.]+$/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        // НЕ переводим артикулы и коды товаров (только если нет японских символов)
        // Примеры: "【1-FR8B】", "[ABC-123]", "SKU-12345"
        // НО переводим: "【送料無料】", "【3足で送料無料】"
        if (/^[\[\]【】\-A-Z0-9\s]+$/i.test(text) && !/[ぁ-ゔァ-ヴー一-龯々〆〤]/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: { node: Node; text: string }[] = [];
  let currentNode: Node | null;

  while ((currentNode = walker.nextNode())) {
    const text = currentNode.textContent?.trim();
    if (text) {
      textNodes.push({ node: currentNode, text });
    }
  }

  // Если нет новых узлов для перевода, просто выходим
  if (textNodes.length === 0) {
    return;
  }

  
  // Переводим батчами по 5 узлов (меньше чтобы не перегружать API)
  const batchSize = 5;
  const totalBatches = Math.ceil(textNodes.length / batchSize);

  for (let i = 0; i < textNodes.length; i += batchSize) {
    try {
      const batch = textNodes.slice(i, i + batchSize);
      const texts = batch.map(item => item.text);
      const batchNumber = i / batchSize + 1;

            const translations = await translateBatch(texts, 'ja', targetLang);

      // Применяем переводы
      batch.forEach((item, index) => {
        try {
          const currentText = item.node.textContent?.trim();
          const expectedText = item.text; // Оригинальный текст, который мы отправили на перевод
          const translatedText = translations[index];
          const parent = item.node.parentElement;

          // ВАЖНО: Проверяем что текст узла не изменился с момента сканирования
          if (currentText !== expectedText) {
                        return;
          }

          // Помечаем элемент как обработанный
          if (parent) {
            translatedElements.add(parent);
          }

          // Применяем перевод только если он отличается от оригинала
          if (translatedText && currentText !== translatedText) {
            const originalPreview = currentText.length > 50 ? currentText.substring(0, 50) + '...' : currentText;
            const translatedPreview = translatedText.length > 50 ? translatedText.substring(0, 50) + '...' : translatedText;

            item.node.textContent = translatedText;

                      }
        } catch (nodeError) {
          console.error('[Translation] Error applying translation:', nodeError);
          // Продолжаем с остальными узлами
        }
      });

      // Небольшая задержка между батчами чтобы не перегружать API
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (batchError) {
      console.error(`[Translation] Error processing batch ${i / batchSize + 1}:`, batchError);
      // Продолжаем со следующим батчем
    }
  }

  }

// Функция для перевода всех текстовых узлов на странице
export async function translatePage(targetLang: Language) {
  if (targetLang === 'ja') {
    // Отключаем наблюдатель и перезагружаем страницу
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    currentLanguage = 'ja';
    translatedElements = new WeakSet(); // Очищаем WeakSet
    window.location.reload();
    return;
  }

  // Сбрасываем WeakSet при смене языка
  if (currentLanguage !== targetLang) {
    translatedElements = new WeakSet();
  }

  currentLanguage = targetLang;

  
  // Переводим существующий контент
  await translateNodes(document.body, targetLang);

  
  // Повторяем перевод периодически для динамического контента (React fetch)
  // Первые 10 сек — часто (1.5s), потом реже (5s)
  let runCount = 0;
  let autoTranslateInterval = setInterval(async () => {
    if (currentLanguage === targetLang) {
      await translateNodes(document.body, targetLang);
      runCount++;
      if (runCount >= 7) {
        clearInterval(autoTranslateInterval);
        // Переключаемся на редкий интервал
        setInterval(async () => {
          if (currentLanguage === targetLang) {
            await translateNodes(document.body, targetLang);
          }
        }, 5000);
      }
    } else {
      clearInterval(autoTranslateInterval);
    }
  }, 1500);
}
