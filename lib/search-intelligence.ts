/**
 * Интеллектуальная система поиска
 * Анализирует запросы и определяет релевантность товаров
 */

interface Product {
  itemName: string;
  itemPrice: number;
  reviewAverage?: number;
  reviewCount?: number;
  shopName?: string;
  itemCaption?: string;
}

// Категории товаров с ключевыми словами
const CATEGORIES = {
  electronics: {
    keywords: ['phone', 'smartphone', 'laptop', 'tablet', 'camera', 'headphone', 'speaker', 'tv', 'monitor', 'keyboard', 'mouse', 'pc', 'computer', 'gaming pc', 'desktop', 'gpu', 'graphics card', 'cpu', 'processor', 'スマホ', 'パソコン', 'タブレット', 'カメラ', 'イヤホン', 'スピーカー', 'モニター', 'キーボード', 'マウス', 'ゲーミングPC', 'デスクトップ', 'グラフィックカード', 'ビデオカード'],
    japaneseNames: ['電化製品', '家電', 'PC', 'スマートフォン', 'パソコン', 'カメラ', 'オーディオ', 'コンピューター', 'ゲーミング'],
    excludeIfContains: ['ケース', 'カバー', 'フィルム', 'シール', 'ステッカー', '保護', 'アクセサリー', '机', 'デスク', '椅子', 'チェア', 'テーブル'],
  },
  fashion: {
    keywords: ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat', 'hat', 'bag', 'watch', 'シャツ', 'パンツ', 'ドレス', '靴', 'ジャケット', 'コート', '帽子', 'バッグ', '時計', 'スニーカー', 'ブーツ'],
    japaneseNames: ['ファッション', '服', '衣類', 'アパレル', 'ウェア'],
    excludeIfContains: ['ミニチュア', 'おもちゃ', 'フィギュア', 'ぬいぐるみ'],
  },
  toys: {
    keywords: ['toy', 'rc', 'drone', 'robot', 'doll', 'figure', 'lego', 'puzzle', 'おもちゃ', 'ラジコン', 'ロボット', '人形', 'フィギュア', 'レゴ', 'パズル', 'プラモデル'],
    japaneseNames: ['おもちゃ', '玩具', 'ホビー'],
    excludeIfContains: [],
  },
  sports: {
    keywords: ['ball', 'bat', 'racket', 'bike', 'bicycle', 'fitness', 'yoga', 'gym', 'running', 'ボール', 'バット', 'ラケット', '自転車', 'フィットネス', 'ヨガ', 'ジム', 'ランニング', 'スポーツ'],
    japaneseNames: ['スポーツ', '運動', 'アウトドア'],
    excludeIfContains: [],
  },
  beauty: {
    keywords: ['cosmetic', 'makeup', 'skincare', 'perfume', 'cream', 'lotion', 'serum', 'shampoo', 'conditioner', '化粧品', 'コスメ', 'スキンケア', '香水', 'クリーム', 'ローション', '美容液', 'シャンプー', 'コンディショナー'],
    japaneseNames: ['化粧品', 'コスメ', '美容', 'スキンケア'],
    excludeIfContains: [],
  },
  home: {
    keywords: ['furniture', 'chair', 'table', 'bed', 'sofa', 'lamp', 'curtain', 'carpet', 'storage', 'desk', 'gaming chair', 'gaming desk', '家具', '椅子', 'テーブル', 'ベッド', 'ソファ', 'ランプ', 'カーテン', 'カーペット', '収納', '机', 'デスク', 'ゲーミングチェア', 'ゲーミングデスク'],
    japaneseNames: ['家具', 'インテリア', '生活雑貨'],
    excludeIfContains: ['ミニチュア', 'おもちゃ', 'フィギュア', 'PC', 'パソコン', 'コンピューター', 'グラフィック', 'プロセッサー', 'CPU', 'GPU'],
  },
  books: {
    keywords: ['book', 'manga', 'magazine', 'novel', 'comic', '本', '書籍', '漫画', 'マンガ', '雑誌', '小説'],
    japaneseNames: ['本', '書籍', '漫画', '雑誌'],
    excludeIfContains: ['グッズ', 'フィギュア', 'ポスター'],
  },
};

/**
 * Определяет категорию товара на основе запроса
 */
export function detectCategory(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  for (const [category, data] of Object.entries(CATEGORIES)) {
    // Проверяем ключевые слова
    if (data.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return null;
}

/**
 * Проверяет соответствие товара определенной категории
 */
export function matchesCategory(product: Product, category: string): boolean {
  if (!category || !CATEGORIES[category as keyof typeof CATEGORIES]) {
    return true; // Если категория не определена, не фильтруем
  }

  const categoryData = CATEGORIES[category as keyof typeof CATEGORIES];
  const productText = `${product.itemName} ${product.itemCaption || ''}`.toLowerCase();

  // Проверяем исключения (если содержит эти слова - точно не та категория)
  if (categoryData.excludeIfContains.length > 0) {
    const hasExcluded = categoryData.excludeIfContains.some(
      exclude => productText.includes(exclude.toLowerCase())
    );
    if (hasExcluded) {
      return false;
    }
  }

  // Проверяем наличие ключевых слов категории
  const hasKeyword = categoryData.keywords.some(
    keyword => productText.includes(keyword.toLowerCase())
  );

  const hasJapaneseName = categoryData.japaneseNames.some(
    name => productText.includes(name.toLowerCase())
  );

  return hasKeyword || hasJapaneseName;
}

/**
 * Извлекает ключевые термины из запроса
 */
export function extractKeyTerms(query: string): string[] {
  const terms: string[] = [];
  const lowerQuery = query.toLowerCase().trim();

  // Разбиваем на слова
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 1);

  // Определяем важные термины (существительные, прилагательные)
  // Удаляем служебные слова
  const stopWords = ['for', 'with', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'from'];
  const importantWords = words.filter(w => !stopWords.includes(w));

  terms.push(...importantWords);

  // Добавляем биграммы (пары слов) для составных терминов
  for (let i = 0; i < words.length - 1; i++) {
    terms.push(`${words[i]} ${words[i + 1]}`);
  }

  return terms;
}

/**
 * Вычисляет процент покрытия ключевых терминов в названии товара
 */
export function calculateTermCoverage(product: Product, keyTerms: string[]): number {
  if (keyTerms.length === 0) return 1;

  const productText = product.itemName.toLowerCase();
  const matchedTerms = keyTerms.filter(term => productText.includes(term));

  return matchedTerms.length / keyTerms.length;
}

/**
 * Определяет является ли товар точным совпадением с запросом
 */
export function isExactMatch(product: Product, query: string): boolean {
  const productName = product.itemName.toLowerCase();
  const cleanQuery = query.toLowerCase().trim();

  // 1. Точное совпадение
  if (productName === cleanQuery) return true;

  // 2. Название начинается с запроса
  if (productName.startsWith(cleanQuery)) return true;

  // 3. Все слова запроса присутствуют в первых 50 символах названия
  const words = cleanQuery.split(/\s+/).filter(w => w.length > 1);
  const firstPart = productName.substring(0, 50);
  const allWordsInStart = words.every(word => firstPart.includes(word));

  return allWordsInStart && words.length >= 2;
}

/**
 * Фильтрует нерелевантные товары
 */
export function filterIrrelevantProducts(products: Product[], query: string): Product[] {
  const category = detectCategory(query);
  const keyTerms = extractKeyTerms(query);

  // Debug logs отключены для производительности
  // console.log(`[Search Intelligence] Query: "${query}"`);
  // console.log(`[Search Intelligence] Detected category: ${category || 'none'}`);
  // console.log(`[Search Intelligence] Key terms: ${keyTerms.join(', ')}`);

  return products.filter((product, index) => {
    let relevant = true;
    const reasons: string[] = [];

    // 1. Проверка исключений категории (только строгие исключения)
    if (category) {
      const categoryData = CATEGORIES[category as keyof typeof CATEGORIES];
      const productText = `${product.itemName} ${product.itemCaption || ''}`.toLowerCase();

      // Проверяем только явные исключения
      if (categoryData.excludeIfContains.length > 0) {
        const hasExcluded = categoryData.excludeIfContains.some(
          exclude => productText.includes(exclude.toLowerCase())
        );
        if (hasExcluded && index < 15) {
          relevant = false;
          reasons.push('excluded item');
        }
      }
    }

    // 2. Проверка покрытия терминов (очень мягкая проверка только для топ-15)
    if (index < 15) {
      const coverage = calculateTermCoverage(product, keyTerms);
      if (coverage < 0.15) {
        relevant = false;
        reasons.push(`low coverage ${(coverage * 100).toFixed(0)}%`);
      }
    }

    // 3. Фильтрация явно нерелевантных товаров
    const productName = product.itemName.toLowerCase();

    // Исключаем аксессуары если ищем основной товар
    const searchingMainProduct = !query.toLowerCase().includes('case') &&
                                 !query.toLowerCase().includes('cover') &&
                                 !query.toLowerCase().includes('ケース') &&
                                 !query.toLowerCase().includes('カバー');

    if (searchingMainProduct && index < 10) {
      const isAccessory =
        (productName.includes('ケースのみ') || productName.includes('カバーのみ')) ||
        (productName.includes('フィルム') && !productName.includes('カメラ')) ||
        productName.includes('保護シート');

      if (isAccessory) {
        relevant = false;
        reasons.push('accessory');
      }
    }

    // Debug logs отключены для производительности
    // if (!relevant && index < 20) {
    //   console.log(`[Search Intelligence] Filtered out #${index + 1}: "${product.itemName.substring(0, 60)}..." - ${reasons.join(', ')}`);
    // }

    return relevant;
  });
}

/**
 * Ранжирует товары с учетом намерения пользователя
 */
export function intelligentRanking(products: Product[], query: string): Product[] {
  const category = detectCategory(query);
  const keyTerms = extractKeyTerms(query);

  const scoredProducts = products.map(product => {
    let score = 0;

    // 1. Бонус за точное совпадение
    if (isExactMatch(product, query)) {
      score += 500;
    }

    // 2. Бонус за соответствие категории
    if (category && matchesCategory(product, category)) {
      score += 100;
    }

    // 3. Бонус за покрытие ключевых терминов
    const coverage = calculateTermCoverage(product, keyTerms);
    score += coverage * 200;

    // 4. Бонус за позицию ключевых слов в начале названия
    const productName = product.itemName.toLowerCase();
    const firstWord = keyTerms[0];
    if (firstWord && productName.indexOf(firstWord) === 0) {
      score += 150;
    } else if (firstWord && productName.indexOf(firstWord) < 20) {
      score += 80;
    }

    // 5. Умеренный бонус за популярность
    if (product.reviewCount) {
      score += Math.min(product.reviewCount / 100, 50);
    }

    // 6. Штраф за слишком длинное название (обычно это спам)
    if (product.itemName.length > 150) {
      score -= 50;
    }

    // 7. Штраф за подозрительные товары
    if (product.itemPrice && product.itemPrice < 100 && !category?.includes('beauty')) {
      score -= 30; // Слишком дешево
    }

    return { product, score };
  });

  // Сортируем по score
  scoredProducts.sort((a, b) => b.score - a.score);

  // Debug logs отключены для производительности
  // console.log('[Search Intelligence] Top 5 after intelligent ranking:');
  // scoredProducts.slice(0, 5).forEach((item, i) => {
  //   console.log(`  ${i + 1}. [${item.score.toFixed(0)}] ${item.product.itemName.substring(0, 60)}...`);
  // });

  return scoredProducts.map(item => item.product);
}
