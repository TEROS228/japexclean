const fs = require('fs');

// Читаем JSON файл с подкатегориями
const subcategoriesData = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

// Генерируем TypeScript файл
const tsContent = `export interface YahooSubcategory {
  id: number;
  name: string;
  jpName?: string;
  depth: number;
}

export interface YahooCategory {
  id: number;
  name: string;
  jpName: string;
  ruName?: string;
  subcategories?: YahooSubcategory[];
}

export const yahooCategories: YahooCategory[] = ${JSON.stringify(
  Object.values(subcategoriesData).map(cat => ({
    id: cat.id,
    name: cat.name,
    jpName: cat.jpName,
    subcategories: cat.subcategories
  })),
  null,
  2
)};

// Плоский список всех категорий и подкатегорий для быстрого поиска
export const allYahooCategories = new Map<number, { name: string; jpName?: string; parentId?: number }>();

yahooCategories.forEach(category => {
  allYahooCategories.set(category.id, {
    name: category.name,
    jpName: category.jpName
  });

  category.subcategories?.forEach(subcategory => {
    allYahooCategories.set(subcategory.id, {
      name: subcategory.name,
      parentId: category.id
    });
  });
});

// Получить категорию по ID (включая подкатегории)
export function getYahooCategoryById(id: number): { name: string; jpName?: string; parentId?: number } | undefined {
  return allYahooCategories.get(id);
}

// Получить главную категорию по ID
export function getMainYahooCategory(id: number): YahooCategory | undefined {
  return yahooCategories.find(c => c.id === id);
}

// Получить подкатегорию и её главную категорию
export function getYahooSubcategoryWithParent(subcategoryId: number): {
  subcategory: YahooSubcategory;
  parentCategory: YahooCategory;
} | undefined {
  for (const category of yahooCategories) {
    const subcategory = category.subcategories?.find(s => s.id === subcategoryId);
    if (subcategory) {
      return {
        subcategory,
        parentCategory: category
      };
    }
  }
  return undefined;
}
`;

// Сохраняем TypeScript файл
fs.writeFileSync('./data/yahoo-categories.ts', tsContent, 'utf-8');

console.log('✅ Generated yahoo-categories.ts with all categories and subcategories');
console.log(`📊 Total: ${Object.keys(subcategoriesData).length} main categories`);
console.log(`📊 Total subcategories: ${Object.values(subcategoriesData).reduce((sum, cat) => sum + cat.subcategories.length, 0)}`);
