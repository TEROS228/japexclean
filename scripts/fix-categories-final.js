const fs = require('fs');

// Читаем JSON файл
const subcategoriesData = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

// Категории, которые нужно ПОЛНОСТЬЮ очистить (там неправильные подкатегории от Yahoo API)
const categoriesToClear = [
  2502, // Fashion & Accessories - там компьютерные товары
  2503, // Cameras & Optics - там посудомойки и стройматериалы
  2506, // Music, Movies & Video Games - там мебель
  2507, // Toys & Games - там садовые инструменты
  2508, // Hobby & Culture - там бытовая химия
  2509, // Antiques & Collectibles - там товары для животных
  2510, // Sports & Leisure - неясное содержимое
  2511, // Outdoor & Travel - игрушки вместо outdoor
  2512, // Bicycles, Cars & Motorcycles - спортивные товары
  2514, // Home & Interior - автомобильные товары
  2515, // Kitchen & Daily Goods - пустая
  2516, // Pet Supplies - музыка вместо pet supplies
  2517, // Musical Instruments - фильмы вместо музыкальных инструментов
  2520, // Diet & Health - пустая
  2521, // Baby, Kids & Maternity - пустая
  2522, // Smartphones, Tablets & PC - outdoor товары
  2524, // TV, Audio & Cameras - пустая
];

// Подкатегории для Men's и Women's Fashion - оставляем только очевидно правильные
const fashionKeywords = {
  ladies: ['レディース', '女性', 'ブラ', 'マタニティ', 'ワンピース', 'スカート'],
  mens: ['メンズ', '男性', '紳士', 'スーツ'],
  exclude: ['自転車', 'バイク', 'カメラ', 'パソコン', 'コンピュータ', '食品', 'ドリンク']
};

// Очищаем проблемные категории
let totalRemoved = 0;
for (const categoryId in subcategoriesData) {
  const category = subcategoriesData[categoryId];
  const catIdNum = Number(categoryId);

  if (!category.subcategories) continue;

  const originalLength = category.subcategories.length;

  // Полностью очищаем проблемные категории
  if (categoriesToClear.includes(catIdNum)) {
    category.subcategories = [];
    console.log(`🗑️  ${category.name}: удалены ВСЕ ${originalLength} подкатегорий (неправильные данные от API)`);
    totalRemoved += originalLength;
    continue;
  }

  // Для Ladies' Fashion - оставляем depth=3 + фильтруем
  if (catIdNum === 2494) {
    category.subcategories = category.subcategories.filter(sub => {
      if (sub.depth !== 3) return false;

      const jpName = sub.jpName || sub.name;

      // Исключаем очевидно неправильные
      for (const excluded of fashionKeywords.exclude) {
        if (jpName.includes(excluded)) return false;
      }

      // Исключаем мужские
      if (jpName.includes('メンズ') || jpName.includes('男性') || jpName.includes('紳士')) {
        return false;
      }

      return true;
    });

    const removed = originalLength - category.subcategories.length;
    if (removed > 0) {
      console.log(`📝 ${category.name}: удалено ${removed}, осталось ${category.subcategories.length}`);
      totalRemoved += removed;
    }
    continue;
  }

  // Для Men's Fashion - оставляем depth=3 + фильтруем
  if (catIdNum === 2495) {
    category.subcategories = category.subcategories.filter(sub => {
      if (sub.depth !== 3) return false;

      const jpName = sub.jpName || sub.name;

      // Исключаем очевидно неправильные
      for (const excluded of fashionKeywords.exclude) {
        if (jpName.includes(excluded)) return false;
      }

      // Исключаем женские
      if (jpName.includes('レディース') || jpName.includes('女性') || jpName.includes('マタニティ') || jpName.includes('ブラ')) {
        return false;
      }

      return true;
    });

    const removed = originalLength - category.subcategories.length;
    if (removed > 0) {
      console.log(`📝 ${category.name}: удалено ${removed}, осталось ${category.subcategories.length}`);
      totalRemoved += removed;
    }
    continue;
  }

  // Для остальных - оставляем только depth=3 и убираем главные категории
  category.subcategories = category.subcategories.filter(sub => {
    if (sub.depth <= 2) return false;
    if (sub.depth !== 3) return false;

    const mainCategoryIds = [2494, 2495, 2496, 2497, 2498, 2499, 2500, 2501, 2502, 2503, 2504, 2505, 2506, 2507, 2508, 2509, 2510, 2511, 2512, 2513, 2514, 2515, 2516, 2517, 2518, 2519, 2520, 2521, 2522, 2524];
    if (mainCategoryIds.includes(sub.id)) return false;

    return true;
  });

  const removed = originalLength - category.subcategories.length;
  if (removed > 0) {
    console.log(`📝 ${category.name}: удалено ${removed}, осталось ${category.subcategories.length}`);
    totalRemoved += removed;
  }
}

// Сохраняем
fs.writeFileSync(
  './data/yahoo-subcategories.json',
  JSON.stringify(subcategoriesData, null, 2),
  'utf-8'
);

console.log('\n✅ Категории исправлены');
console.log(`📊 Всего удалено: ${totalRemoved}`);

// Статистика
let totalCategories = 0;
let totalSubcategories = 0;
let categoriesWithSubs = 0;

for (const categoryId in subcategoriesData) {
  totalCategories++;
  const category = subcategoriesData[categoryId];
  if (category.subcategories && category.subcategories.length > 0) {
    totalSubcategories += category.subcategories.length;
    categoriesWithSubs++;
  }
}

console.log(`📊 Осталось: ${totalCategories} категорий`);
console.log(`📊 Категорий с подкатегориями: ${categoriesWithSubs}`);
console.log(`📊 Всего подкатегорий: ${totalSubcategories}`);
