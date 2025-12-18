// Утилита для генерации ключевых слов Yahoo категорий
import { yahooCategories } from '@/data/yahoo-categories';

/**
 * Генерирует объект маппинга Yahoo категорий на ключевые слова
 * Используется для улучшения релевантности результатов Yahoo API
 */
export function generateYahooKeywords(): Record<number, string> {
  const keywords: Record<number, string> = {};

  yahooCategories.forEach(category => {
    // Для главной категории используем японское имя
    if (category.jpName) {
      keywords[category.id] = category.jpName;
    }

    // Для подкатегорий комбинируем имя главной категории и подкатегории
    category.subcategories?.forEach(subcategory => {
      if (subcategory.jpName && category.jpName) {
        // Комбинируем японские имена для максимальной релевантности
        keywords[subcategory.id] = `${category.jpName} ${subcategory.jpName}`;
      } else if (subcategory.jpName) {
        keywords[subcategory.id] = subcategory.jpName;
      } else {
        // Fallback на английское имя если нет японского
        keywords[subcategory.id] = subcategory.name;
      }
    });
  });

  return keywords;
}

// Экспортируем для использования в других местах
export const YAHOO_KEYWORDS = generateYahooKeywords();
