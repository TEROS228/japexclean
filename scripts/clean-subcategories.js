const fs = require('fs');

// Читаем JSON файл
const subcategoriesData = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

// Правила фильтрации для каждой категории
const categoryFilters = {
  // Ladies' Fashion (2494) - только женские
  2494: {
    include: ['レディース', '女性', 'マタニティ', 'ブラ'],
    exclude: ['メンズ', '男性', '紳士']
  },
  // Men's Fashion (2495) - только мужские
  2495: {
    include: ['メンズ', '男性', '紳士'],
    exclude: ['レディース', '女性', 'マタニティ', 'ブラ']
  },
  // Baby, Kids, Maternity (2496) - детские и матernity
  2496: {
    include: ['ベビー', 'キッズ', '子供', 'マタニティ'],
    exclude: []
  },
  // Food (2498) - еда
  2498: {
    include: ['食品', '食材', '米', '肉', '魚', '野菜', 'フルーツ'],
    exclude: []
  },
  // Drinks, Alcohol (2499) - напитки
  2499: {
    include: ['ドリンク', '飲料', 'お酒', 'ビール', 'ワイン', '水', 'コーヒー', '茶'],
    exclude: []
  },
  // Cosmetics, Beauty, Hair Care (2500) - косметика
  2500: {
    include: ['コスメ', '美容', '化粧', 'ヘアケア', 'スキンケア'],
    exclude: []
  },
  // Computer (2501) - компьютеры
  2501: {
    include: ['パソコン', 'PC', 'ノート', 'デスクトップ', 'タブレット'],
    exclude: ['周辺機器']
  },
  // Electronics, AV & Cameras (2505) - электроника, AV, камеры
  2505: {
    include: [],
    exclude: ['フィットネスバイク', '自転車', 'バイク', 'スポーツ', '洗濯機', '冷蔵庫', '掃除機', 'エアコン', 'アイロン', '電子レンジ', 'ヨーグルトメーカー', '電気ケトル', 'ジューサー', 'ロースター', '炭酸水メーカー']
  },
};

// Функция проверки, подходит ли подкатегория для категории
function isValidSubcategory(subcategory, categoryId) {
  const filter = categoryFilters[categoryId];
  if (!filter) return true; // Если нет правил, оставляем как есть

  const jpName = subcategory.jpName || subcategory.name;

  // Проверяем исключения
  for (const excluded of filter.exclude) {
    if (jpName.includes(excluded)) {
      return false;
    }
  }

  // Если есть правила include, проверяем их
  if (filter.include && filter.include.length > 0) {
    for (const included of filter.include) {
      if (jpName.includes(included)) {
        return true;
      }
    }
    // Если ничего не совпало с include, исключаем
    return false;
  }

  return true;
}

// Очищаем подкатегории
let totalRemoved = 0;
for (const categoryId in subcategoriesData) {
  const category = subcategoriesData[categoryId];

  if (category.subcategories && category.subcategories.length > 0) {
    const originalLength = category.subcategories.length;

    // Фильтруем подкатегории
    category.subcategories = category.subcategories.filter(sub => {
      // Удаляем главные категории из подкатегорий (depth <= 2)
      if (sub.depth <= 2) return false;

      // Удаляем подкатегории с ID главных категорий
      const mainCategoryIds = [2494, 2495, 2496, 2497, 2498, 2499, 2500, 2501, 2502, 2503, 2504, 2505, 2506, 2507, 2508, 2509, 2510, 2511, 2512, 2513, 2514, 2515, 2516, 2517, 2518];
      if (mainCategoryIds.includes(sub.id)) return false;

      // Оставляем только подкатегории с depth = 3 (первый уровень подкатегорий)
      // Это убирает нерелевантные подкатегории более глубоких уровней
      if (sub.depth !== 3) return false;

      // Применяем фильтры по названию
      return isValidSubcategory(sub, Number(categoryId));
    });

    const removed = originalLength - category.subcategories.length;
    if (removed > 0) {
      console.log(`📝 ${category.name}: удалено ${removed} неправильных подкатегорий (было ${originalLength}, осталось ${category.subcategories.length})`);
      totalRemoved += removed;
    }
  }
}

// Сохраняем обратно
fs.writeFileSync(
  './data/yahoo-subcategories.json',
  JSON.stringify(subcategoriesData, null, 2),
  'utf-8'
);

console.log('\n✅ Подкатегории очищены');
console.log(`📊 Всего удалено неправильных подкатегорий: ${totalRemoved}`);

// Статистика
let totalCategories = 0;
let totalSubcategories = 0;

for (const categoryId in subcategoriesData) {
  totalCategories++;
  const category = subcategoriesData[categoryId];
  if (category.subcategories) {
    totalSubcategories += category.subcategories.length;
  }
}

console.log(`📊 Осталось: ${totalCategories} категорий, ${totalSubcategories} подкатегорий`);
