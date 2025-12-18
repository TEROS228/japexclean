import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';
import puppeteer from 'puppeteer';

// Функция для парсинга материалов из текста (японского или английского)
function parseMaterialFromText(html: string): string {
  if (!html) return '';

  // Список известных материалов для валидации
  const knownMaterials = [
    '綿', 'コットン', 'cotton',
    'ポリエステル', 'polyester',
    'ポリウレタン', 'polyurethane', 'spandex', 'elastane',
    'ナイロン', 'nylon',
    'レーヨン', 'rayon',
    'アクリル', 'acrylic',
    'ウール', 'wool',
    'シルク', 'silk', '絹',
    'リネン', 'linen', '麻',
    'レザー', 'leather', '革',
    'ポリ', 'poly'
  ];

  // Слова-исключения (скидки, промо и т.д.)
  const excludeWords = [
    '最大', '割引', 'OFF', 'ポイント', 'point', 'クーポン', 'coupon',
    'セール', 'sale', '還元', '送料', 'shipping', 'まで'
  ];

  // 1. Сначала ищем явную секцию "■素材：" или "【素材】" в тексте
  const materialPatterns = [
    /■素材[：:]\s*([^\n<]+)/i,
    /【素材】\s*<br\s*\/?>\s*([^<]+(?:<br\s*\/?>(?!【)[^<]+)*)/i,  // Для Yahoo: "【素材】<br>текст<br>текст"
    /【素材】\s*([^\n【]+)/i,  // Для Yahoo без <br>
  ];

  for (const pattern of materialPatterns) {
    const match = html.match(pattern);
    if (match) {
      let material = match[1]
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (material && /\d+[%％]/.test(material)) {
        return material;
      }
    }
  }

  // 2. Ищем секцию с материалами через HTML структуру (для Rakuten)
  const materialSectionMatch = html.match(/<td[^>]*class="info-l"[^>]*>素材<\/td>\s*<td[^>]*class="info-r"[^>]*>([\s\S]*?)<\/td>/i);

  let textToSearch = html;
  if (materialSectionMatch) {
    // Если нашли секцию "素材", парсим только её содержимое
    textToSearch = materialSectionMatch[1];
  }

  // Убираем HTML теги, но сохраняем переводы строк
  const cleanText = textToSearch
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Паттерны для поиска материалов (в порядке приоритета)
  const patterns = [
    // 1. Множественные материалы через запятую: "アクリル 49%、ナイロン 33%、ウール 13%"
    /([一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％](?:\s*[、,]\s*[一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％])+)/gi,

    // 2. Комбинированные материалы с &: "綿97%＆ポリウレタン3％"
    /([一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％]\s*[&＆・]+\s*[一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％])/gi,

    // 3. Комбинированные материалы через пробел: "コットン97% ポリウレタン3%"
    /([一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％]\s+[一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％])/gi,

    // 4. Одиночные материалы с процентами: "綿100%"
    /([一-龯ぁ-んァ-ヶーa-zA-Z（）()]+\s*\d+\s*[%％])/gi,
  ];

  const materials: string[] = [];

  for (const pattern of patterns) {
    const matches = cleanText.matchAll(pattern);
    for (const match of matches) {
      let material = (match[1] || match[0]).trim();

      // Очистка от лишних символов
      material = material
        .replace(/^[:：\s]+/, '')
        .replace(/[\s]+/g, ' ')
        .trim();

      // Проверяем что это не исключение (скидка, промо)
      const hasExcludeWord = excludeWords.some(word =>
        material.toLowerCase().includes(word.toLowerCase())
      );

      if (hasExcludeWord) {
        continue;
      }

      // Проверяем что содержит известный материал
      const hasKnownMaterial = knownMaterials.some(mat =>
        material.toLowerCase().includes(mat.toLowerCase())
      );

      // Фильтруем
      if (material.length > 0 && material.length < 150 && /\d+[%％]/.test(material) && hasKnownMaterial) {
        materials.push(material);
      }
    }
  }

  // Удаляем дубликаты и возвращаем первое совпадение
  const uniqueMaterials = [...new Set(materials)];
  return uniqueMaterials.length > 0 ? uniqueMaterials[0] : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Проверка авторизации
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { itemUrl } = req.body;

    if (!itemUrl) {
      return res.status(400).json({ error: 'Item URL is required' });
    }

    console.log('[Parse Material] Fetching URL:', itemUrl);

    let browser;
    let html = '';

    try {
      // Используем Puppeteer для обхода защиты от скрейпинга
      browser = await puppeteer.launch({
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

      // Устанавливаем User-Agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Переходим на страницу и ждем загрузки
      await page.goto(itemUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Ждем немного чтобы динамический контент загрузился
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Получаем HTML
      html = await page.content();

      await browser.close();

      console.log('[Parse Material] HTML length:', html.length);
      console.log('[Parse Material] Looking for 素材 section...');

      // Парсим материалы
      const material = parseMaterialFromText(html);

      console.log('[Parse Material] Result:', material);

      if (material) {
        return res.status(200).json({ material });
      } else {
        // Отладка - проверяем что есть в HTML
        const has素材 = html.includes('素材');
        const hasMaterial = html.includes('material');
        const hasPercent = html.includes('%') || html.includes('％');

        console.log('[Parse Material] Debug - has 素材:', has素材, 'has material:', hasMaterial, 'has %:', hasPercent);

        return res.status(200).json({
          material: '',
          message: 'Material not found',
          debug: { has素材, hasMaterial, hasPercent }
        });
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error: any) {
    console.error('Error parsing material:', error);
    return res.status(500).json({ error: 'Failed to parse material', details: error.message });
  }
}
