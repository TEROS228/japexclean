/**
 * Система ранжирования результатов поиска
 * Оценивает релевантность товаров на основе нескольких факторов
 */

interface Product {
  itemName: string;
  itemPrice: number;
  reviewAverage?: number;
  reviewCount?: number;
  affiliateRate?: number;
  imageUrl?: string;
  mediumImageUrls?: Array<{ imageUrl: string }>;
}

/**
 * Рассчитывает score релевантности товара для поискового запроса
 */
export function calculateRelevanceScore(product: Product, searchQuery: string): number {
  let score = 0;
  const query = searchQuery.toLowerCase().trim();
  const productName = product.itemName.toLowerCase();

  // 1. Точное совпадение названия (максимальный приоритет)
  if (productName === query) {
    score += 300; // Увеличено с 100
  }

  // 2. Название начинается с запроса (очень высокий приоритет)
  if (productName.startsWith(query)) {
    score += 150; // Увеличено с 50
  }

  // 3. Запрос содержится в начале названия (высокий приоритет)
  const words = query.split(/\s+/).filter(w => w.length > 0);
  const nameWords = productName.split(/\s+/).filter(w => w.length > 0);

  // Проверяем совпадение первых слов
  if (words.length > 0 && nameWords.length > 0 && nameWords[0].includes(words[0])) {
    score += 80; // Увеличено с 30
  }

  // 4. Все слова запроса присутствуют в названии (очень важно)
  const allWordsPresent = words.every(word => productName.includes(word));
  if (allWordsPresent) {
    score += 100; // Увеличено с 25
  }

  // 5. Количество совпадающих слов (важный фактор)
  const matchingWords = words.filter(word => productName.includes(word)).length;
  score += matchingWords * 25; // Увеличено с 10

  // 6. Штраф за несовпадающие слова
  const missingWords = words.length - matchingWords;
  score -= missingWords * 30; // Штраф за каждое отсутствующее слово

  // 7. ПОПУЛЯРНОСТЬ - умеренный фактор (уменьшаем вес)
  // Бонус за количество отзывов (показатель популярности)
  if (product.reviewCount) {
    if (product.reviewCount >= 10000) {
      score += 80; // Снижено с 200
    } else if (product.reviewCount >= 5000) {
      score += 60; // Снижено с 150
    } else if (product.reviewCount >= 1000) {
      score += 40; // Снижено с 100
    } else if (product.reviewCount >= 500) {
      score += 30; // Снижено с 70
    } else if (product.reviewCount >= 100) {
      score += 20; // Снижено с 50
    } else if (product.reviewCount >= 50) {
      score += 12; // Снижено с 30
    } else if (product.reviewCount >= 10) {
      score += 6; // Снижено с 15
    }
  }

  // 8. Бонус за высокий рейтинг (умеренный вес)
  if (product.reviewAverage && product.reviewCount) {
    // Популярные товары с хорошим рейтингом получают небольшой бонус
    if (product.reviewAverage >= 4.5 && product.reviewCount >= 100) {
      score += 25; // Снижено с 50
    } else if (product.reviewAverage >= 4.0 && product.reviewCount >= 50) {
      score += 15; // Снижено с 30
    } else if (product.reviewAverage >= 4.5) {
      score += 10; // Снижено с 20
    } else if (product.reviewAverage >= 4.0) {
      score += 8; // Снижено с 15
    } else if (product.reviewAverage >= 3.5) {
      score += 4; // Снижено с 8
    }
  } else if (product.reviewAverage) {
    // Если есть только рейтинг без отзывов
    if (product.reviewAverage >= 4.5) {
      score += 5; // Снижено с 10
    } else if (product.reviewAverage >= 4.0) {
      score += 3; // Снижено с 5
    }
  }

  // 9. Штраф за отсутствие изображения
  const hasImage = product.imageUrl || (product.mediumImageUrls && product.mediumImageUrls.length > 0);
  if (!hasImage) {
    score -= 20;
  }

  // 10. Позиция первого совпадения (чем раньше, тем лучше)
  const firstMatchIndex = productName.indexOf(query);
  if (firstMatchIndex !== -1) {
    // Штраф за позднее появление запроса в названии
    score -= Math.floor(firstMatchIndex / 10);
  }

  // 11. Длина названия (более короткие названия часто более релевантны)
  const nameLength = product.itemName.length;
  if (nameLength < 50 && allWordsPresent) {
    score += 5;
  } else if (nameLength > 150) {
    score -= 5;
  }

  return Math.max(0, score); // Не даём отрицательный score
}

/**
 * Сортирует массив товаров по релевантности для поискового запроса
 */
export function rankSearchResults(products: Product[], searchQuery: string): Product[] {
  // Добавляем score к каждому товару
  const productsWithScores = products.map(product => ({
    product,
    score: calculateRelevanceScore(product, searchQuery)
  }));

  // Сортируем по убыванию score
  productsWithScores.sort((a, b) => b.score - a.score);

  // Возвращаем только товары
  return productsWithScores.map(item => item.product);
}

/**
 * Расширяет поисковый запрос синонимами и связанными терминами
 */
export function expandSearchQuery(query: string): string[] {
  const queries = [query];
  const lowerQuery = query.toLowerCase();

  // Словарь синонимов (можно расширять)
  const synonyms: Record<string, string[]> = {
    // Электроника
    'laptop': ['notebook', 'ノートパソコン', 'ノートPC'],
    'phone': ['smartphone', 'スマホ', 'スマートフォン', '携帯'],
    'tablet': ['タブレット', 'ipad'],
    'headphones': ['イヤホン', 'ヘッドホン', 'earphones'],

    // Одежда
    'shirt': ['シャツ', 'tシャツ', 'tee'],
    'shoes': ['靴', 'シューズ', 'スニーカー', 'sneakers'],
    'jacket': ['ジャケット', 'アウター'],
    'dress': ['ドレス', 'ワンピース'],

    // Общие термины
    'bag': ['バッグ', 'かばん', 'カバン'],
    'watch': ['時計', '腕時計'],
    'book': ['本', 'ブック'],
    'game': ['ゲーム', 'ビデオゲーム'],
  };

  // Добавляем синонимы
  for (const [key, values] of Object.entries(synonyms)) {
    if (lowerQuery.includes(key)) {
      queries.push(...values);
    }
    // Проверяем обратное направление
    for (const synonym of values) {
      if (lowerQuery.includes(synonym.toLowerCase())) {
        queries.push(key, ...values);
        break;
      }
    }
  }

  // Удаляем дубликаты
  return Array.from(new Set(queries));
}

/**
 * Нормализует японский текст для лучшего поиска
 */
export function normalizeJapaneseQuery(query: string): string {
  // Конвертация полной ширины в половинную
  let normalized = query.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });

  // Удаление пробелов между японскими символами
  normalized = normalized.replace(/([ぁ-んァ-ヶー一-龯])\s+([ぁ-んァ-ヶー一-龯])/g, '$1$2');

  return normalized;
}
