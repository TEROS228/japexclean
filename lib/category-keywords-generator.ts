// Утилита для генерации ключевых слов категорий
import { allCategories } from '@/data/categories';

/**
 * Генерирует объект маппинга категорий на ключевые слова
 * Используется для улучшения релевантности результатов Rakuten API
 */
export function generateCategoryKeywords(): Record<number, string> {
  const keywords: Record<number, string> = {};

  allCategories.forEach(category => {
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
      }
    });
  });

  return keywords;
}

/**
 * Генерирует TypeScript код для вставки в rakuten.ts
 */
export function generateKeywordsCode(): string {
  const keywords = generateCategoryKeywords();

  let code = '// Маппинг категорий на ключевые слова для улучшения релевантности\n';
  code += 'const CATEGORY_KEYWORDS: Record<number, string> = {\n';

  // Группируем по главным категориям для лучшей читаемости
  allCategories.forEach(category => {
    code += `  // ${category.name}\n`;

    if (keywords[category.id]) {
      code += `  ${category.id}: "${keywords[category.id]}", // ${category.name}\n`;
    }

    category.subcategories?.forEach(subcategory => {
      if (keywords[subcategory.id]) {
        code += `  ${subcategory.id}: "${keywords[subcategory.id]}", // ${subcategory.name}\n`;
      }
    });

    code += '\n';
  });

  code += '};\n';
  return code;
}

// Экспортируем для использования в других местах
export const GENERATED_KEYWORDS = generateCategoryKeywords();
