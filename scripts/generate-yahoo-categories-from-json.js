const fs = require('fs');

// Читаем JSON с подкатегориями
const subcategoriesData = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

// Функция для перевода японского названия на английский (упрощенная)
function translateToEnglish(jpName) {
  const translations = {
    // Women's Fashion
    'レディース下着、靴下、部屋着': "Women's Underwear, Socks, Loungewear",
    '女性用着物、浴衣': "Women's Kimono, Yukata",
    'レディースバッグ': "Women's Bags",
    'レディースファッション小物': "Women's Fashion Accessories",
    'レディースシューズ': "Women's Shoes",
    'インナー、マタニティ下着': "Maternity Underwear",
    'コスプレ用コスチューム': "Cosplay Costumes",
    'レディーストップス': "Women's Tops",
    'ワンピース、チュニック': "Dresses, Tunics",
    'レディースボトムス、パンツ': "Women's Bottoms, Pants",

    // Men's Fashion
    'メンズ下着、靴下、部屋着': "Men's Underwear, Socks, Loungewear",
    'メンズバッグ': "Men's Bags",
    'メンズファッション小物': "Men's Fashion Accessories",
    'メンズシューズ、紳士靴': "Men's Shoes",
    'メンズトップス': "Men's Tops",
    'メンズコート、ジャケット': "Men's Coats, Jackets",
    'メンズボトムス、パンツ': "Men's Bottoms, Pants",
    'メンズスーツ、フォーマル': "Men's Suits, Formal Wear",
  };

  return translations[jpName] || jpName;
}

// Генерируем TypeScript файл
const output = `export interface YahooSubcategory {
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

export const yahooCategories: YahooCategory[] = [
${Object.values(subcategoriesData).map(category => {
  const subcategoriesStr = category.subcategories
    .filter(sub => sub.depth === 3) // Берем только подкатегории уровня 3
    .slice(0, 15) // Ограничиваем до 15 подкатегорий
    .map(sub => `      {
        "id": ${sub.id},
        "name": "${translateToEnglish(sub.name)}",
        "depth": ${sub.depth},
        "jpName": "${sub.name}"
      }`)
    .join(',\n');

  return `  {
    "id": ${category.id},
    "name": "${category.name}",
    "jpName": "${category.jpName}",
    "subcategories": [
${subcategoriesStr}
    ]
  }`;
}).join(',\n')}
];

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

// Сохраняем файл
fs.writeFileSync('./data/yahoo-categories-new.ts', output, 'utf-8');
console.log('✅ Generated data/yahoo-categories-new.ts');
