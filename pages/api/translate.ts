import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DeepL API Free - Best quality translation (500k chars/month)
// Docs: https://www.deepl.com/docs-api
const DEEPL_API_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Language code mapping for DeepL
const DEEPL_LANG_CODES: { [key: string]: string } = {
  'ja': 'JA',
  'en': 'EN',
  'es': 'ES',
  'de': 'DE',
  'pt': 'PT',
  'th': 'EN', // Thai not supported by DeepL, fallback to English
  'fil': 'EN', // Filipino not supported by DeepL, fallback to English
};

// Функция для исправления слипшихся слов
function fixConcatenatedWords(text: string): string {
  // Список частых паттернов, где слова слипаются
  const patterns = [
    // Знаки валюты и числа со словами
    { regex: /([¥$€£₽])(\d+)([a-zA-Z])/g, replacement: '$1$2 $3' }, // ¥900if -> ¥900 if
    { regex: /([a-z])([¥$€£₽]\d)/g, replacement: '$1 $2' }, // pay¥900 -> pay ¥900
    { regex: /(\d)([a-zA-Z]{2,})/g, replacement: '$1 $2' }, // 900if -> 900 if

    // Артикли и предлоги
    { regex: /([a-z])([A-Z])/g, replacement: '$1 $2' }, // camelCase -> camel Case
    { regex: /(\d)([A-Z][a-z])/g, replacement: '$1 $2' }, // 3Day -> 3 Day
    { regex: /([a-z])(\d)/g, replacement: '$1 $2' }, // day3 -> day 3

    // Частые английские слова, которые слипаются
    { regex: /([a-z])(The|And|For|With|From|Into|Over|Under|About|After|Before|If|Or|But)/g, replacement: '$1 $2' },
    { regex: /(The|And|For|With|From|Into|Over|Under|About|After|Before|If|Or|But)([A-Z][a-z])/g, replacement: '$1 $2' },

    // Предлоги в конце слов
    { regex: /([a-z])(In|On|At|To|Of|By)([A-Z])/g, replacement: '$1 $2 $3' },

    // Двойные пробелы убираем
    { regex: /\s{2,}/g, replacement: ' ' },
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }

  return result.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { texts, fromLang, toLang } = req.body;

  if (!texts || !Array.isArray(texts) || !fromLang || !toLang) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (fromLang === toLang) {
    return res.json({ translations: texts });
  }

  try {
    const translations: string[] = [];
    const textsToTranslate: string[] = [];
    const indexMap: number[] = [];

    // Проверяем кэш для каждого текста
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];

      const cached = await prisma.translationCache.findUnique({
        where: {
          sourceText_sourceLang_targetLang: {
            sourceText: text,
            sourceLang: fromLang,
            targetLang: toLang,
          },
        },
      });

      if (cached) {
        translations[i] = cached.translation;
      } else {
        textsToTranslate.push(text);
        indexMap.push(i);
      }
    }

    // Переводим только тексты, которых нет в кэше
    if (textsToTranslate.length > 0) {
      console.log(`🔄 Translating ${textsToTranslate.length} texts from ${fromLang} to ${toLang} using DeepL`);

      // DeepL - переводим батчами по 50 текстов (DeepL поддерживает до 50 текстов за раз)
      const BATCH_SIZE = 50;
      const BATCH_DELAY = 100; // 100ms между батчами

      for (let batchStart = 0; batchStart < textsToTranslate.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, textsToTranslate.length);
        const batch = textsToTranslate.slice(batchStart, batchEnd);
        const batchIndices = indexMap.slice(batchStart, batchEnd);

        // DeepL API принимает массив текстов
        try {
          const sourceLang = DEEPL_LANG_CODES[fromLang] || fromLang.toUpperCase();
          const targetLang = DEEPL_LANG_CODES[toLang] || toLang.toUpperCase();

          // Создаем URLSearchParams для form data
          const formData = new URLSearchParams();
          batch.forEach(text => formData.append('text', text));
          formData.append('source_lang', sourceLang);
          formData.append('target_lang', targetLang);

          const response = await fetch(DEEPL_API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            console.error(`[DeepL API] Failed with status ${response.status}`);
            const errorText = await response.text();
            console.error(`[DeepL API] Error:`, errorText);

            // Возвращаем оригинальные тексты
            batchIndices.forEach((originalIndex, i) => {
              translations[originalIndex] = batch[i];
            });

            // Задержка перед следующим батчем
            if (batchEnd < textsToTranslate.length) {
              await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
            continue;
          }

          const data = await response.json();

          // DeepL возвращает массив переводов в translations[]
          if (data.translations && Array.isArray(data.translations)) {
            data.translations.forEach((item: any, i: number) => {
              const originalIndex = batchIndices[i];
              const originalText = batch[i];
              let translatedText = item.text || originalText;

              // Исправляем слипшиеся слова
              translatedText = fixConcatenatedWords(translatedText);

              translations[originalIndex] = translatedText;

              // Сохраняем в кэш (асинхронно, не ждем)
              prisma.translationCache.upsert({
                where: {
                  sourceText_sourceLang_targetLang: {
                    sourceText: originalText,
                    sourceLang: fromLang,
                    targetLang: toLang,
                  },
                },
                update: {
                  translation: translatedText,
                },
                create: {
                  sourceText: originalText,
                  sourceLang: fromLang,
                  targetLang: toLang,
                  translation: translatedText,
                },
              }).catch(() => {}); // Игнорируем ошибки кэша
            });

            console.log(`✅ DeepL translated ${data.translations.length} texts`);
          }
        } catch (error) {
          console.error(`[DeepL API] Error:`, error);
          // Возвращаем оригинальные тексты при ошибке
          batchIndices.forEach((originalIndex, i) => {
            translations[originalIndex] = batch[i];
          });
        }

        // Задержка перед следующим батчем (кроме последнего)
        if (batchEnd < textsToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      console.log(`✅ Translation complete!`);
    }

    return res.json({ translations });
  } catch (error) {
    // Тихо возвращаем оригинальные тексты при критической ошибке
    return res.status(500).json({ error: 'Translation failed', translations: texts });
  }
}
