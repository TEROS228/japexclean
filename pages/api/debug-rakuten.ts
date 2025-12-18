// pages/api/debug-rakuten.ts
// Временный endpoint для отладки структуры страницы
import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Собираем отладочную информацию
    const debug: any = {
      htmlLength: html.length,
      selects: [],
      buttons: [],
      dataAttributes: [],
      scripts: [],
      classesWithVariant: [],
      jsonLD: []
    };

    // 1. Все select элементы
    $('select').each((i, el) => {
      const options: string[] = [];
      $(el).find('option').each((_, opt) => {
        options.push($(opt).text().trim());
      });
      debug.selects.push({
        name: $(el).attr('name'),
        id: $(el).attr('id'),
        class: $(el).attr('class'),
        options: options
      });
    });

    // 2. Кнопки с data-атрибутами
    $('button, [role="button"]').each((i, el) => {
      if (i > 50) return; // Ограничение
      
      const $el = $(el);
      const attrs: any = {};
      
      // Получаем все атрибуты через cheerio
      const attrNames = Object.keys($el.attr() || {});
      attrNames.forEach(attr => {
        if (attr.startsWith('data-')) {
          attrs[attr] = $el.attr(attr);
        }
      });
      
      if (Object.keys(attrs).length > 0) {
        debug.buttons.push({
          text: $el.text().trim().substring(0, 100),
          class: $el.attr('class'),
          dataAttrs: attrs
        });
      }
    });

    // 3. Все элементы с data-variant, data-sku и т.д.
    $('[data-variant], [data-sku], [data-option], [data-choice]').each((i, el) => {
      if (i > 30) return;
      
      const $el = $(el);
      const attrs: any = {};
      
      ['data-variant', 'data-sku', 'data-option', 'data-choice'].forEach(attr => {
        const val = $el.attr(attr);
        if (val) attrs[attr] = val;
      });
      
      debug.dataAttributes.push({
        tag: (el as any).tagName,
        class: $el.attr('class'),
        text: $el.text().trim().substring(0, 100),
        attrs: attrs
      });
    });

    // 4. Script теги и их содержимое
    $('script:not([src])').each((i, el) => {
      if (i > 10) return;
      const content = $(el).html() || '';
      if (content.length > 100 && content.length < 50000) {
        // Ищем ключевые слова
        const hasVariant = content.includes('variant') || content.includes('variation');
        const hasSku = content.includes('sku');
        const hasOption = content.includes('option');
        const hasSize = content.includes('size') || content.includes('サイズ');
        const hasColor = content.includes('color') || content.includes('カラー');
        
        if (hasVariant || hasSku || hasOption || hasSize || hasColor) {
          debug.scripts.push({
            length: content.length,
            hasVariant,
            hasSku,
            hasOption,
            hasSize,
            hasColor,
            preview: content.substring(0, 500)
          });
        }
      }
    });

    // 5. Классы содержащие variant/option/size/color
    $('[class*="variant"], [class*="option"], [class*="size"], [class*="color"], [class*="choice"]').each((i, el) => {
      if (i > 30) return;
      
      const $el = $(el);
      debug.classesWithVariant.push({
        tag: (el as any).tagName,
        class: $el.attr('class'),
        id: $el.attr('id'),
        text: $el.text().trim().substring(0, 100),
        childrenCount: $el.children().length
      });
    });

    // 6. JSON-LD данные
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        debug.jsonLD.push(data);
      } catch (e) {
        // Ignore
      }
    });

    // 7. Поиск в тексте HTML паттернов
    const patterns = {
      sizePattern: html.match(/(?:size|サイズ)[:=\s]*[\["]([^\]"]+)[\]"]/i)?.[1] || null,
      colorPattern: html.match(/(?:color|カラー|色)[:=\s]*[\["]([^\]"]+)[\]"]/i)?.[1] || null,
      variantPattern: html.match(/(?:variant|variation|バリエーション)[:=\s]*[\["]([^\]"]+)[\]"]/i)?.[1] || null,
    };

    debug.patterns = patterns;

    res.status(200).json(debug);

  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}