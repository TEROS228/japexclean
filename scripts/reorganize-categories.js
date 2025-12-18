const fs = require('fs');

// Читаем JSON файл
const data = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

console.log('🔄 Начинаем реорганизацию подкатегорий...\n');

// Категории для перемещения
const moves = {
  // Из Computers (2501) в Cosmetics & Beauty (2519) - все косметические товары
  'from_2501_to_2519': [
    1753, 1767, 1769, 1774, 1775, 1777, 1792, 1794, 1798, 1800, 1805, 1807,
    1811, 1821, 1828, 1834, 1835, 1839, 1847, 5003, 5004, 5012, 5014, 5019,
    13713, 14835, 38086, 46345, 46350, 46351, 46374, 46437, 46479, 46707,
    46786, 48628, 48902, 48903, 48913, 48920, 49143
  ],

  // Из Cosmetics & Beauty (2519) в Computers (2501) - компьютерные товары
  'from_2519_to_2501': [
    16, 51, 60, 14254, 14255, 21176, 38488, 40116, 40149, 40150, 70204
  ],

  // Из DIY & Tools (2513) в Outdoor & Travel (2511) - outdoor/travel товары
  'from_2513_to_2511': [
    2614, 2635, 2638, 2648, 2716, 4114, 4121, 4137, 21540, 41764, 43000,
    43527, 48536, 48602, 48612, 49625, 66736, 68011, 69331
  ],

  // Из Men's Fashion (2495) в Sports & Leisure (2510) - спортивная обувь
  'from_2495_to_2510': [46592], // マラソン、ランニングシューズ

  // Из Men's Fashion (2495) в Outdoor & Travel (2511) - дорожные сумки
  'from_2495_to_2511': [21540] // 旅行用品　スーツケース、キャリーバッグ (но оно уже есть в 2513)
};

// Напитки для удаления из Food (2498) - оставить только в Drinks & Alcohol (2499)
const drinksToRemoveFromFood = [
  1381, // コーヒー
  1426, // ソフトドリンク、ジュース
  17318, // ハーブティー
  17341, // ココア
  17487, // 健康茶
  17583 // 水、炭酸水
];

// Функция для перемещения подкатегорий
function moveSubcategories(fromCatId, toCatId, subcatIds) {
  const fromCat = data[fromCatId];
  const toCat = data[toCatId];

  if (!fromCat || !toCat) return;

  const movedSubs = [];

  // Находим и удаляем из исходной категории
  fromCat.subcategories = fromCat.subcategories.filter(sub => {
    if (subcatIds.includes(sub.id)) {
      movedSubs.push(sub);
      return false;
    }
    return true;
  });

  // Добавляем в целевую категорию (проверяем на дубликаты)
  movedSubs.forEach(sub => {
    const exists = toCat.subcategories.find(s => s.id === sub.id);
    if (!exists) {
      toCat.subcategories.push(sub);
    }
  });

  if (movedSubs.length > 0) {
    console.log(`📦 ${fromCat.name} → ${toCat.name}: перемещено ${movedSubs.length} подкатегорий`);
  }
}

// Выполняем перемещения
console.log('1️⃣ Перемещаем косметику из Computers в Cosmetics & Beauty:');
moveSubcategories('2501', '2519', moves.from_2501_to_2519);

console.log('\n2️⃣ Перемещаем компьютерные товары из Cosmetics & Beauty в Computers:');
moveSubcategories('2519', '2501', moves.from_2519_to_2501);

console.log('\n3️⃣ Перемещаем outdoor/travel товары из DIY & Tools в Outdoor & Travel:');
moveSubcategories('2513', '2511', moves.from_2513_to_2511);

console.log('\n4️⃣ Перемещаем спортивные кроссовки из Men\'s Fashion в Sports & Leisure:');
moveSubcategories('2495', '2510', moves.from_2495_to_2510);

console.log('\n5️⃣ Удаляем дубликаты напитков из Food (оставляем в Drinks & Alcohol):');
const foodCat = data['2498'];
const originalFoodLength = foodCat.subcategories.length;
foodCat.subcategories = foodCat.subcategories.filter(sub => {
  return !drinksToRemoveFromFood.includes(sub.id);
});
const removedDrinks = originalFoodLength - foodCat.subcategories.length;
if (removedDrinks > 0) {
  console.log(`🗑️  Food: удалено ${removedDrinks} напитков (дубликаты из Drinks & Alcohol)`);
}

// Сохраняем
fs.writeFileSync(
  './data/yahoo-subcategories.json',
  JSON.stringify(data, null, 2),
  'utf-8'
);

console.log('\n✅ Реорганизация завершена!');

// Статистика
console.log('\n📊 Итоговое распределение подкатегорий:');
for (const catId in data) {
  const cat = data[catId];
  if (cat.subcategories && cat.subcategories.length > 0) {
    console.log(`  ${cat.name}: ${cat.subcategories.length} подкатегорий`);
  }
}
