const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const YAHOO_APP_ID = process.env.NEXT_PUBLIC_YAHOO_APP_ID;
const YAHOO_API_URL = "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

const mainCategories = [
  { id: 2494, jpName: "レディースファッション", name: "Ladies' Fashion" },
  { id: 2495, jpName: "メンズファッション", name: "Men's Fashion" },
  { id: 2502, jpName: "ファッション、アクセサリー", name: "Fashion & Accessories" },
  { id: 2521, jpName: "ベビー、キッズ、マタニティ", name: "Baby, Kids & Maternity" },
  { id: 2522, jpName: "スマホ、タブレット、パソコン", name: "Smartphones, Tablets & PC" },
  { id: 2505, jpName: "家電、AV、カメラ", name: "Electronics, AV & Cameras" },
  { id: 2524, jpName: "テレビ、オーディオ、カメラ", name: "TV, Audio & Cameras" },
  { id: 2519, jpName: "コスメ、美容、ヘアケア", name: "Cosmetics & Beauty" },
  { id: 2520, jpName: "ダイエット、健康", name: "Diet & Health" },
  { id: 2498, jpName: "食品", name: "Food" },
  { id: 2499, jpName: "ドリンク、お酒", name: "Drinks & Alcohol" },
  { id: 2510, jpName: "スポーツ、レジャー", name: "Sports & Leisure" },
  { id: 2511, jpName: "アウトドア、釣り、旅行用品", name: "Outdoor & Travel" },
  { id: 2512, jpName: "自転車、車、バイク用品", name: "Bicycles, Cars & Motorcycles" },
  { id: 2514, jpName: "住まい、インテリア", name: "Home & Interior" },
  { id: 2515, jpName: "キッチン、日用品、文具", name: "Kitchen & Daily Goods" },
  { id: 2507, jpName: "おもちゃ、ゲーム", name: "Toys & Games" },
  { id: 2508, jpName: "ホビー、カルチャー", name: "Hobby & Culture" },
  { id: 2506, jpName: "音楽、映画、テレビゲーム", name: "Music, Movies & Video Games" },
  { id: 2509, jpName: "アンティーク、コレクション", name: "Antiques & Collectibles" },
  { id: 2516, jpName: "ペット用品、生き物", name: "Pet Supplies" },
  { id: 2517, jpName: "楽器、器材", name: "Musical Instruments" },
  { id: 2513, jpName: "DIY、工具", name: "DIY & Tools" },
  { id: 2501, jpName: "コンピュータ", name: "Computers" },
  { id: 2503, jpName: "カメラ、光学機器", name: "Cameras & Optics" },
];

async function getProductsByCategory(categoryId) {
  const params = new URLSearchParams({
    appid: YAHOO_APP_ID,
    genre_category_id: String(categoryId),
    results: '100', // Получаем 100 товаров для лучшего покрытия подкатегорий
    start: '1',
  });

  const url = `${YAHOO_API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error.message);
    return [];
  }
}

async function extractSubcategories(categoryId) {
  console.log(`Fetching subcategories for category ${categoryId}...`);

  const products = await getProductsByCategory(categoryId);
  console.log(`  Found ${products.length} products`);

  const subcategoriesMap = new Map();

  for (const product of products) {
    // Проверяем parentGenreCategories
    if (product.parentGenreCategories && Array.isArray(product.parentGenreCategories)) {
      for (const cat of product.parentGenreCategories) {
        // Берем только подкатегории (depth > 1 или depth = 2)
        if (cat.id !== categoryId && cat.depth >= 2) {
          if (!subcategoriesMap.has(cat.id)) {
            subcategoriesMap.set(cat.id, {
              id: cat.id,
              name: cat.name,
              depth: cat.depth
            });
          }
        }
      }
    }

    // Также проверяем текущую категорию товара
    if (product.genreCategory && product.genreCategory.id !== categoryId) {
      const cat = product.genreCategory;
      if (!subcategoriesMap.has(cat.id)) {
        subcategoriesMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          depth: cat.depth || 2
        });
      }
    }
  }

  const subcategories = Array.from(subcategoriesMap.values())
    .sort((a, b) => a.id - b.id);

  console.log(`  Extracted ${subcategories.length} unique subcategories`);

  return subcategories;
}

async function main() {
  console.log('Starting Yahoo Shopping subcategories extraction...\n');

  const result = {};

  for (const category of mainCategories) {
    const subcategories = await extractSubcategories(category.id);

    result[category.id] = {
      id: category.id,
      name: category.name,
      jpName: category.jpName,
      subcategories: subcategories
    };

    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Сохраняем результат в файл
  const outputPath = './data/yahoo-subcategories.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`\n✅ Subcategories saved to ${outputPath}`);

  // Выводим статистику
  console.log('\n📊 Statistics:');
  for (const [categoryId, data] of Object.entries(result)) {
    console.log(`  ${data.name}: ${data.subcategories.length} subcategories`);
  }

  const totalSubcategories = Object.values(result).reduce(
    (sum, cat) => sum + cat.subcategories.length, 0
  );
  console.log(`\n  Total: ${totalSubcategories} subcategories across ${mainCategories.length} categories`);
}

main().catch(console.error);
