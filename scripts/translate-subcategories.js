const fs = require('fs');

// Простой словарь для перевода наиболее частых японских слов на английский
const translations = {
  // Одежда
  'レディース': "Women's",
  'メンズ': "Men's",
  '下着': 'Underwear',
  '靴下': 'Socks',
  '部屋着': 'Loungewear',
  '着物': 'Kimono',
  '浴衣': 'Yukata',
  'バッグ': 'Bags',
  'エコ': 'Eco',
  '折りたたみバッグ': 'Foldable Bags',
  'ファッション小物': 'Fashion Accessories',
  'シューズ': 'Shoes',
  '紳士靴': "Men's Shoes",
  'インナー': 'Inner Wear',
  'マタニティ': 'Maternity',
  'ブラ': 'Bra',
  'ハーフトップ': 'Half Top',
  'コスプレ衣装': 'Cosplay Costumes',
  'コスプレ用コスチューム': 'Cosplay Costumes',
  'リュックサック': 'Backpack',
  'デイパック': 'Daypack',
  'ショルダーバッグ': 'Shoulder Bag',
  'バッグインバッグ': 'Bag in Bag',
  'トランクス': 'Trunks',
  'パンプス': 'Pumps',
  'スニーカー': 'Sneakers',
  'ブーツ': 'Boots',
  'サンダル': 'Sandals',

  // Электроника
  'スマホ': 'Smartphone',
  'タブレット': 'Tablet',
  'パソコン': 'PC',
  'テレビ': 'TV',
  'オーディオ': 'Audio',
  'カメラ': 'Camera',
  '家電': 'Home Electronics',
  'コンピュータ': 'Computer',
  '光学機器': 'Optical Equipment',

  // Еда и напитки
  '食品': 'Food',
  'ドリンク': 'Drinks',
  'お酒': 'Alcohol',

  // Другое
  'ベビー': 'Baby',
  'キッズ': 'Kids',
  'コスメ': 'Cosmetics',
  '美容': 'Beauty',
  'ヘアケア': 'Hair Care',
  'ダイエット': 'Diet',
  '健康': 'Health',
  'スポーツ': 'Sports',
  'レジャー': 'Leisure',
  'アウトドア': 'Outdoor',
  '釣り': 'Fishing',
  '旅行用品': 'Travel Goods',
  '自転車': 'Bicycle',
  '車': 'Car',
  'バイク用品': 'Motorcycle',
  '住まい': 'Housing',
  'インテリア': 'Interior',
  'キッチン': 'Kitchen',
  '日用品': 'Daily Goods',
  '文具': 'Stationery',
  'おもちゃ': 'Toys',
  'ゲーム': 'Games',
  'ホビー': 'Hobby',
  'カルチャー': 'Culture',
  '音楽': 'Music',
  '映画': 'Movies',
  'テレビゲーム': 'Video Games',
  'アンティーク': 'Antiques',
  'コレクション': 'Collections',
  'ペット用品': 'Pet Supplies',
  '生き物': 'Living Things',
  '楽器': 'Musical Instruments',
  '器材': 'Equipment',
  'DIY': 'DIY',
  '工具': 'Tools',

  // Общие слова
  '、': ', ',
  '用': ' for ',
  'その他': 'Other',
};

function translateJapaneseToEnglish(japaneseText) {
  let english = japaneseText;

  // Применяем переводы из словаря
  for (const [jp, en] of Object.entries(translations)) {
    english = english.replace(new RegExp(jp, 'g'), en);
  }

  // Очищаем пробелы
  english = english.replace(/\s+/g, ' ').trim();

  // Исправляем апострофы
  english = english.replace(/(\w)'s(\w)/g, "$1's $2");

  // Если перевод не полный (остались японские символы), возвращаем оригинал
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(english)) {
    // Если осталось много японских символов (>30%), возвращаем оригинал
    const japChars = (english.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
    const totalChars = english.length;

    if (japChars / totalChars > 0.3) {
      return japaneseText; // Возвращаем оригинал
    }

    // Иначе возвращаем частичный перевод
    return english;
  }

  return english;
}

// Читаем JSON файл
const subcategoriesData = JSON.parse(
  fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8')
);

// Переводим подкатегории
for (const categoryId in subcategoriesData) {
  const category = subcategoriesData[categoryId];

  if (category.subcategories && category.subcategories.length > 0) {
    category.subcategories = category.subcategories.map(subcat => ({
      ...subcat,
      jpName: subcat.name, // Сохраняем японское название
      name: translateJapaneseToEnglish(subcat.name) // Переводим на английский
    }));
  }
}

// Сохраняем обратно
fs.writeFileSync(
  './data/yahoo-subcategories.json',
  JSON.stringify(subcategoriesData, null, 2),
  'utf-8'
);

console.log('✅ Subcategories translated to English');

// Статистика
let totalTranslated = 0;
let partialTranslated = 0;
let notTranslated = 0;

for (const categoryId in subcategoriesData) {
  const category = subcategoriesData[categoryId];
  if (category.subcategories) {
    for (const subcat of category.subcategories) {
      if (subcat.name === subcat.jpName) {
        notTranslated++;
      } else if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(subcat.name)) {
        partialTranslated++;
      } else {
        totalTranslated++;
      }
    }
  }
}

console.log(`📊 Translation stats:`);
console.log(`  Fully translated: ${totalTranslated}`);
console.log(`  Partially translated: ${partialTranslated}`);
console.log(`  Not translated: ${notTranslated}`);
