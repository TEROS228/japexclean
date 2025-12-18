export interface YahooSubcategory {
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
  {
    "id": 2494,
    "name": "Ladies' Fashion",
    "jpName": "レディースファッション",
    "subcategories": [
      {
        "id": 1462,
        "name": "Women's Underwear, Socks, Loungewear",
        "depth": 3,
        "jpName": "レディース下着、靴下、部屋着"
      },
      {
        "id": 1503,
        "name": "Women's Kimono, Yukata",
        "depth": 3,
        "jpName": "女性用着物、浴衣"
      },
      {
        "id": 1574,
        "name": "Women's Bags",
        "depth": 3,
        "jpName": "レディースバッグ"
      },
      {
        "id": 1582,
        "name": "Men's Bags",
        "depth": 3,
        "jpName": "メンズバッグ"
      },
      {
        "id": 1667,
        "name": "Women's Fashion Accessories",
        "depth": 3,
        "jpName": "レディースファッション小物"
      },
      {
        "id": 1729,
        "name": "Women's Shoes",
        "depth": 3,
        "jpName": "レディースシューズ"
      },
      {
        "id": 1740,
        "name": "Men's Shoes",
        "depth": 3,
        "jpName": "メンズシューズ、紳士靴"
      },
      {
        "id": 4337,
        "name": "Maternity Underwear",
        "depth": 3,
        "jpName": "インナー、マタニティ下着"
      },
      {
        "id": 14830,
        "name": "Cosplay Costumes",
        "depth": 3,
        "jpName": "コスプレ用コスチューム"
      },
      {
        "id": 36861,
        "name": "Women's Tops",
        "depth": 3,
        "jpName": "レディーストップス"
      },
      {
        "id": 36887,
        "name": "Dresses, Tunics",
        "depth": 3,
        "jpName": "ワンピース、チュニック"
      },
      {
        "id": 36913,
        "name": "Women's Bottoms, Pants",
        "depth": 3,
        "jpName": "レディースボトムス、パンツ"
      },
      {
        "id": 49412,
        "name": "ノートパソコンアクセサリー、周辺機器",
        "depth": 3,
        "jpName": "ノートパソコンアクセサリー、周辺機器"
      },
      {
        "id": 68707,
        "name": "レディース財布",
        "depth": 3,
        "jpName": "レディース財布"
      },
      {
        "id": 68728,
        "name": "レディース傘",
        "depth": 3,
        "jpName": "レディース傘"
      }
    ]
  },
  {
    "id": 2495,
    "name": "Men's Fashion",
    "jpName": "メンズファッション",
    "subcategories": [
      {
        "id": 1545,
        "name": "Men's Underwear, Socks, Loungewear",
        "depth": 3,
        "jpName": "メンズ下着、靴下、部屋着"
      },
      {
        "id": 1574,
        "name": "Women's Bags",
        "depth": 3,
        "jpName": "レディースバッグ"
      },
      {
        "id": 1582,
        "name": "Men's Bags",
        "depth": 3,
        "jpName": "メンズバッグ"
      },
      {
        "id": 1667,
        "name": "Women's Fashion Accessories",
        "depth": 3,
        "jpName": "レディースファッション小物"
      },
      {
        "id": 1695,
        "name": "Men's Fashion Accessories",
        "depth": 3,
        "jpName": "メンズファッション小物"
      },
      {
        "id": 1740,
        "name": "Men's Shoes",
        "depth": 3,
        "jpName": "メンズシューズ、紳士靴"
      },
      {
        "id": 16191,
        "name": "サーフパンツ",
        "depth": 3,
        "jpName": "サーフパンツ"
      },
      {
        "id": 21540,
        "name": "旅行用品　スーツケース、キャリーバッグ",
        "depth": 3,
        "jpName": "旅行用品　スーツケース、キャリーバッグ"
      },
      {
        "id": 36504,
        "name": "Men's Tops",
        "depth": 3,
        "jpName": "メンズトップス"
      },
      {
        "id": 36571,
        "name": "Men's Coats, Jackets",
        "depth": 3,
        "jpName": "メンズコート、ジャケット"
      },
      {
        "id": 36624,
        "name": "Men's Bottoms, Pants",
        "depth": 3,
        "jpName": "メンズボトムス、パンツ"
      },
      {
        "id": 36672,
        "name": "Men's Suits, Formal Wear",
        "depth": 3,
        "jpName": "メンズスーツ、フォーマル"
      },
      {
        "id": 46592,
        "name": "マラソン、ランニングシューズ",
        "depth": 3,
        "jpName": "マラソン、ランニングシューズ"
      },
      {
        "id": 48895,
        "name": "メンズジャージ、スウェット",
        "depth": 3,
        "jpName": "メンズジャージ、スウェット"
      },
      {
        "id": 49412,
        "name": "ノートパソコンアクセサリー、周辺機器",
        "depth": 3,
        "jpName": "ノートパソコンアクセサリー、周辺機器"
      }
    ]
  },
  {
    "id": 2498,
    "name": "Food",
    "jpName": "食品",
    "subcategories": [
      {
        "id": 951,
        "name": "カニ",
        "depth": 3,
        "jpName": "カニ"
      },
      {
        "id": 962,
        "name": "魚、鮮魚",
        "depth": 3,
        "jpName": "魚、鮮魚"
      },
      {
        "id": 1036,
        "name": "フルーツ 柿",
        "depth": 3,
        "jpName": "フルーツ 柿"
      },
      {
        "id": 1037,
        "name": "みかん、柑橘類",
        "depth": 3,
        "jpName": "みかん、柑橘類"
      },
      {
        "id": 1057,
        "name": "梅干し",
        "depth": 3,
        "jpName": "梅干し"
      },
      {
        "id": 1082,
        "name": "漬物",
        "depth": 3,
        "jpName": "漬物"
      },
      {
        "id": 1161,
        "name": "ナッツ類",
        "depth": 3,
        "jpName": "ナッツ類"
      },
      {
        "id": 1202,
        "name": "うどん、カップうどん",
        "depth": 3,
        "jpName": "うどん、カップうどん"
      },
      {
        "id": 1242,
        "name": "米、ごはん",
        "depth": 3,
        "jpName": "米、ごはん"
      },
      {
        "id": 1381,
        "name": "コーヒー",
        "depth": 3,
        "jpName": "コーヒー"
      },
      {
        "id": 1426,
        "name": "ソフトドリンク、ジュース",
        "depth": 3,
        "jpName": "ソフトドリンク、ジュース"
      },
      {
        "id": 13451,
        "name": "その他スナック、お菓子、おつまみ",
        "depth": 3,
        "jpName": "その他スナック、お菓子、おつまみ"
      },
      {
        "id": 14628,
        "name": "チョコレート",
        "depth": 3,
        "jpName": "チョコレート"
      },
      {
        "id": 14642,
        "name": "駄菓子",
        "depth": 3,
        "jpName": "駄菓子"
      },
      {
        "id": 15885,
        "name": "プリン",
        "depth": 3,
        "jpName": "プリン"
      }
    ]
  },
  {
    "id": 2499,
    "name": "Drinks & Alcohol",
    "jpName": "ドリンク、お酒",
    "subcategories": [
      {
        "id": 1348,
        "name": "焼酎",
        "depth": 3,
        "jpName": "焼酎"
      },
      {
        "id": 1371,
        "name": "ワイン",
        "depth": 3,
        "jpName": "ワイン"
      },
      {
        "id": 1381,
        "name": "コーヒー",
        "depth": 3,
        "jpName": "コーヒー"
      },
      {
        "id": 1385,
        "name": "紅茶",
        "depth": 3,
        "jpName": "紅茶"
      },
      {
        "id": 1399,
        "name": "緑茶、日本茶",
        "depth": 3,
        "jpName": "緑茶、日本茶"
      },
      {
        "id": 1426,
        "name": "ソフトドリンク、ジュース",
        "depth": 3,
        "jpName": "ソフトドリンク、ジュース"
      },
      {
        "id": 1892,
        "name": "お酢飲料、飲む酢",
        "depth": 3,
        "jpName": "お酢飲料、飲む酢"
      },
      {
        "id": 15152,
        "name": "ビール類、発泡酒",
        "depth": 3,
        "jpName": "ビール類、発泡酒"
      },
      {
        "id": 17318,
        "name": "ハーブティー",
        "depth": 3,
        "jpName": "ハーブティー"
      },
      {
        "id": 17341,
        "name": "ココア",
        "depth": 3,
        "jpName": "ココア"
      },
      {
        "id": 17487,
        "name": "健康茶",
        "depth": 3,
        "jpName": "健康茶"
      },
      {
        "id": 17583,
        "name": "水、炭酸水",
        "depth": 3,
        "jpName": "水、炭酸水"
      },
      {
        "id": 68641,
        "name": "洋酒 ウィスキー",
        "depth": 3,
        "jpName": "洋酒 ウィスキー"
      }
    ]
  },
  {
    "id": 2501,
    "name": "Computers",
    "jpName": "コンピュータ",
    "subcategories": [
      {
        "id": 1753,
        "name": "スキンケアクリーム",
        "depth": 3,
        "jpName": "スキンケアクリーム"
      },
      {
        "id": 1764,
        "name": "スキンケア、フェイスケア化粧水",
        "depth": 3,
        "jpName": "スキンケア、フェイスケア化粧水"
      },
      {
        "id": 1766,
        "name": "乳液",
        "depth": 3,
        "jpName": "乳液"
      },
      {
        "id": 1767,
        "name": "フェイス用パック",
        "depth": 3,
        "jpName": "フェイス用パック"
      },
      {
        "id": 1769,
        "name": "美容液",
        "depth": 3,
        "jpName": "美容液"
      },
      {
        "id": 1774,
        "name": "アイシャドウ",
        "depth": 3,
        "jpName": "アイシャドウ"
      },
      {
        "id": 1775,
        "name": "アイブロウ",
        "depth": 3,
        "jpName": "アイブロウ"
      },
      {
        "id": 1777,
        "name": "マスカラ",
        "depth": 3,
        "jpName": "マスカラ"
      },
      {
        "id": 1792,
        "name": "コンシーラー",
        "depth": 3,
        "jpName": "コンシーラー"
      },
      {
        "id": 1794,
        "name": "フェイスカラー",
        "depth": 3,
        "jpName": "フェイスカラー"
      },
      {
        "id": 1798,
        "name": "口紅",
        "depth": 3,
        "jpName": "口紅"
      },
      {
        "id": 1800,
        "name": "リップグロス",
        "depth": 3,
        "jpName": "リップグロス"
      },
      {
        "id": 1805,
        "name": "女性用香水、フレグランス",
        "depth": 3,
        "jpName": "女性用香水、フレグランス"
      },
      {
        "id": 1807,
        "name": "男性用香水、フレグランス",
        "depth": 3,
        "jpName": "男性用香水、フレグランス"
      },
      {
        "id": 1811,
        "name": "ネイルリムーバー",
        "depth": 3,
        "jpName": "ネイルリムーバー"
      }
    ]
  },
  {
    "id": 2502,
    "name": "Fashion & Accessories",
    "jpName": "ファッション、アクセサリー",
    "subcategories": [
      {
        "id": 16,
        "name": "外付けハードディスク、ドライブ",
        "depth": 3,
        "jpName": "外付けハードディスク、ドライブ"
      },
      {
        "id": 51,
        "name": "ルーター、ネットワーク機器",
        "depth": 3,
        "jpName": "ルーター、ネットワーク機器"
      },
      {
        "id": 207,
        "name": "OS（オペレーティングシステム）（コード販売）",
        "depth": 3,
        "jpName": "OS（オペレーティングシステム）（コード販売）"
      },
      {
        "id": 254,
        "name": "パソコン用ビジネスソフト（コード販売）",
        "depth": 3,
        "jpName": "パソコン用ビジネスソフト（コード販売）"
      },
      {
        "id": 14249,
        "name": "Windowsノート",
        "depth": 3,
        "jpName": "Windowsノート"
      },
      {
        "id": 14255,
        "name": "マウス、トラックボール",
        "depth": 3,
        "jpName": "マウス、トラックボール"
      },
      {
        "id": 21176,
        "name": "プロジェクター",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 36497,
        "name": "スマートウォッチ本体",
        "depth": 3,
        "jpName": "スマートウォッチ本体"
      },
      {
        "id": 36498,
        "name": "スマートウォッチアクセサリー",
        "depth": 3,
        "jpName": "スマートウォッチアクセサリー"
      },
      {
        "id": 38347,
        "name": "スマホケース、カバー",
        "depth": 3,
        "jpName": "スマホケース、カバー"
      },
      {
        "id": 38348,
        "name": "スマホ液晶保護フィルム",
        "depth": 3,
        "jpName": "スマホ液晶保護フィルム"
      },
      {
        "id": 38349,
        "name": "イヤホンジャック、ピアス",
        "depth": 3,
        "jpName": "イヤホンジャック、ピアス"
      },
      {
        "id": 38351,
        "name": "モバイルバッテリー",
        "depth": 3,
        "jpName": "モバイルバッテリー"
      },
      {
        "id": 38356,
        "name": "スマホ、タブレット充電器",
        "depth": 3,
        "jpName": "スマホ、タブレット充電器"
      },
      {
        "id": 38357,
        "name": "スマホ自撮り棒、一脚、三脚",
        "depth": 3,
        "jpName": "スマホ自撮り棒、一脚、三脚"
      }
    ]
  },
  {
    "id": 2503,
    "name": "Cameras & Optics",
    "jpName": "カメラ、光学機器",
    "subcategories": [
      {
        "id": 579,
        "name": "食器洗い機、乾燥機",
        "depth": 3,
        "jpName": "食器洗い機、乾燥機"
      },
      {
        "id": 4062,
        "name": "肥料、農薬",
        "depth": 3,
        "jpName": "肥料、農薬"
      },
      {
        "id": 4223,
        "name": "インターホン",
        "depth": 3,
        "jpName": "インターホン"
      },
      {
        "id": 4390,
        "name": "プレゼンテーション用品",
        "depth": 3,
        "jpName": "プレゼンテーション用品"
      },
      {
        "id": 14441,
        "name": "コピー機",
        "depth": 3,
        "jpName": "コピー機"
      },
      {
        "id": 21176,
        "name": "プロジェクター",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 27892,
        "name": "金庫、キーボックス",
        "depth": 3,
        "jpName": "金庫、キーボックス"
      },
      {
        "id": 30267,
        "name": "動物避け用品",
        "depth": 3,
        "jpName": "動物避け用品"
      },
      {
        "id": 38597,
        "name": "脚立、はしご",
        "depth": 3,
        "jpName": "脚立、はしご"
      },
      {
        "id": 38842,
        "name": "塗装用具",
        "depth": 3,
        "jpName": "塗装用具"
      },
      {
        "id": 40532,
        "name": "キッチン",
        "depth": 3,
        "jpName": "キッチン"
      },
      {
        "id": 40548,
        "name": "浴室、浴槽、洗面所",
        "depth": 3,
        "jpName": "浴室、浴槽、洗面所"
      },
      {
        "id": 40572,
        "name": "トイレ",
        "depth": 3,
        "jpName": "トイレ"
      },
      {
        "id": 40614,
        "name": "ドア、扉、板戸、障子",
        "depth": 3,
        "jpName": "ドア、扉、板戸、障子"
      },
      {
        "id": 49358,
        "name": "インクカートリッジ、トナー",
        "depth": 3,
        "jpName": "インクカートリッジ、トナー"
      }
    ]
  },
  {
    "id": 2505,
    "name": "Electronics, AV & Cameras",
    "jpName": "家電、AV、カメラ",
    "subcategories": [
      {
        "id": 583,
        "name": "掃除機、クリーナー",
        "depth": 3,
        "jpName": "掃除機、クリーナー"
      },
      {
        "id": 1944,
        "name": "低周波治療器",
        "depth": 3,
        "jpName": "低周波治療器"
      },
      {
        "id": 1988,
        "name": "レディースシェーバー",
        "depth": 3,
        "jpName": "レディースシェーバー"
      },
      {
        "id": 1997,
        "name": "ヘアケア、頭皮ケア",
        "depth": 3,
        "jpName": "ヘアケア、頭皮ケア"
      },
      {
        "id": 2468,
        "name": "その他カメラ",
        "depth": 3,
        "jpName": "その他カメラ"
      },
      {
        "id": 19782,
        "name": "双眼鏡、オペラグラス",
        "depth": 3,
        "jpName": "双眼鏡、オペラグラス"
      },
      {
        "id": 21176,
        "name": "プロジェクター",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 26222,
        "name": "洗濯機",
        "depth": 3,
        "jpName": "洗濯機"
      },
      {
        "id": 26236,
        "name": "アイロン、ズボンプレッサー",
        "depth": 3,
        "jpName": "アイロン、ズボンプレッサー"
      },
      {
        "id": 26249,
        "name": "冷蔵庫、冷凍庫",
        "depth": 3,
        "jpName": "冷蔵庫、冷凍庫"
      },
      {
        "id": 26259,
        "name": "電子レンジ、オーブン",
        "depth": 3,
        "jpName": "電子レンジ、オーブン"
      },
      {
        "id": 26308,
        "name": "エアコン",
        "depth": 3,
        "jpName": "エアコン"
      },
      {
        "id": 26323,
        "name": "除湿機、アクセサリー",
        "depth": 3,
        "jpName": "除湿機、アクセサリー"
      },
      {
        "id": 26375,
        "name": "マッサージ器",
        "depth": 3,
        "jpName": "マッサージ器"
      },
      {
        "id": 26382,
        "name": "フィットネスバイク",
        "depth": 3,
        "jpName": "フィットネスバイク"
      }
    ]
  },
  {
    "id": 2506,
    "name": "Music, Movies & Video Games",
    "jpName": "音楽、映画、テレビゲーム",
    "subcategories": [
      {
        "id": 570,
        "name": "ブラケットライト、壁掛け灯",
        "depth": 3,
        "jpName": "ブラケットライト、壁掛け灯"
      },
      {
        "id": 3670,
        "name": "シーツ、カバー",
        "depth": 3,
        "jpName": "シーツ、カバー"
      },
      {
        "id": 3678,
        "name": "布団",
        "depth": 3,
        "jpName": "布団"
      },
      {
        "id": 4356,
        "name": "オフィスチェア",
        "depth": 3,
        "jpName": "オフィスチェア"
      },
      {
        "id": 14916,
        "name": "シーリングライト、天井照明",
        "depth": 3,
        "jpName": "シーリングライト、天井照明"
      },
      {
        "id": 14917,
        "name": "卓上ライト",
        "depth": 3,
        "jpName": "卓上ライト"
      },
      {
        "id": 27430,
        "name": "タイル、パネルカーペット",
        "depth": 3,
        "jpName": "タイル、パネルカーペット"
      },
      {
        "id": 27591,
        "name": "テーブル、デスクマット",
        "depth": 3,
        "jpName": "テーブル、デスクマット"
      },
      {
        "id": 27642,
        "name": "その他ベッド、マットレス",
        "depth": 3,
        "jpName": "その他ベッド、マットレス"
      },
      {
        "id": 27787,
        "name": "毛布、ブランケット、かいまき",
        "depth": 3,
        "jpName": "毛布、ブランケット、かいまき"
      },
      {
        "id": 27821,
        "name": "枕、ピロー、腰枕、足枕",
        "depth": 3,
        "jpName": "枕、ピロー、腰枕、足枕"
      },
      {
        "id": 27892,
        "name": "金庫、キーボックス",
        "depth": 3,
        "jpName": "金庫、キーボックス"
      },
      {
        "id": 36937,
        "name": "座椅子、高座椅子",
        "depth": 3,
        "jpName": "座椅子、高座椅子"
      },
      {
        "id": 47979,
        "name": "椅子付属品、パーツ",
        "depth": 3,
        "jpName": "椅子付属品、パーツ"
      },
      {
        "id": 47982,
        "name": "フリーデスク、平机",
        "depth": 3,
        "jpName": "フリーデスク、平机"
      }
    ]
  },
  {
    "id": 2507,
    "name": "Toys & Games",
    "jpName": "おもちゃ、ゲーム",
    "subcategories": [
      {
        "id": 4053,
        "name": "植木鉢、プランター",
        "depth": 3,
        "jpName": "植木鉢、プランター"
      },
      {
        "id": 4062,
        "name": "肥料、農薬",
        "depth": 3,
        "jpName": "肥料、農薬"
      },
      {
        "id": 5215,
        "name": "プリザーブドフラワー花束、アレンジメント",
        "depth": 3,
        "jpName": "プリザーブドフラワー花束、アレンジメント"
      },
      {
        "id": 5221,
        "name": "花束、切花",
        "depth": 3,
        "jpName": "花束、切花"
      },
      {
        "id": 15634,
        "name": "フラワーアレンジメント（生花）",
        "depth": 3,
        "jpName": "フラワーアレンジメント（生花）"
      },
      {
        "id": 15677,
        "name": "花束、アレンジメント",
        "depth": 3,
        "jpName": "花束、アレンジメント"
      },
      {
        "id": 20089,
        "name": "園芸用土",
        "depth": 3,
        "jpName": "園芸用土"
      },
      {
        "id": 20323,
        "name": "種、種子の栽培キット",
        "depth": 3,
        "jpName": "種、種子の栽培キット"
      },
      {
        "id": 20330,
        "name": "花の種",
        "depth": 3,
        "jpName": "花の種"
      },
      {
        "id": 20489,
        "name": "花の球根",
        "depth": 3,
        "jpName": "花の球根"
      },
      {
        "id": 20684,
        "name": "花の苗",
        "depth": 3,
        "jpName": "花の苗"
      },
      {
        "id": 20722,
        "name": "果菜の苗",
        "depth": 3,
        "jpName": "果菜の苗"
      },
      {
        "id": 37955,
        "name": "スタンド花",
        "depth": 3,
        "jpName": "スタンド花"
      },
      {
        "id": 37960,
        "name": "鉢花",
        "depth": 3,
        "jpName": "鉢花"
      },
      {
        "id": 38286,
        "name": "苗の栽培キット",
        "depth": 3,
        "jpName": "苗の栽培キット"
      }
    ]
  },
  {
    "id": 2508,
    "name": "Hobby & Culture",
    "jpName": "ホビー、カルチャー",
    "subcategories": [
      {
        "id": 1834,
        "name": "ヘアシャンプー",
        "depth": 3,
        "jpName": "ヘアシャンプー"
      },
      {
        "id": 3957,
        "name": "衣類洗剤",
        "depth": 3,
        "jpName": "衣類洗剤"
      },
      {
        "id": 3969,
        "name": "ゴミ袋、ポリ袋、レジ袋",
        "depth": 3,
        "jpName": "ゴミ袋、ポリ袋、レジ袋"
      },
      {
        "id": 4223,
        "name": "インターホン",
        "depth": 3,
        "jpName": "インターホン"
      },
      {
        "id": 4234,
        "name": "防犯カメラ",
        "depth": 3,
        "jpName": "防犯カメラ"
      },
      {
        "id": 34852,
        "name": "トイレットペーパー",
        "depth": 3,
        "jpName": "トイレットペーパー"
      },
      {
        "id": 34876,
        "name": "衛生用品マスク",
        "depth": 3,
        "jpName": "衛生用品マスク"
      },
      {
        "id": 38351,
        "name": "モバイルバッテリー",
        "depth": 3,
        "jpName": "モバイルバッテリー"
      },
      {
        "id": 46607,
        "name": "その他バス、洗面所用品",
        "depth": 3,
        "jpName": "その他バス、洗面所用品"
      },
      {
        "id": 46653,
        "name": "浴室用具",
        "depth": 3,
        "jpName": "浴室用具"
      },
      {
        "id": 47137,
        "name": "印鑑、印章、スタンプ",
        "depth": 3,
        "jpName": "印鑑、印章、スタンプ"
      },
      {
        "id": 47286,
        "name": "筆記用具",
        "depth": 3,
        "jpName": "筆記用具"
      },
      {
        "id": 47405,
        "name": "ファイル、ケース",
        "depth": 3,
        "jpName": "ファイル、ケース"
      },
      {
        "id": 50041,
        "name": "シール、ラベル",
        "depth": 3,
        "jpName": "シール、ラベル"
      },
      {
        "id": 67444,
        "name": "蛇口用浄水器",
        "depth": 3,
        "jpName": "蛇口用浄水器"
      }
    ]
  },
  {
    "id": 2509,
    "name": "Antiques & Collectibles",
    "jpName": "アンティーク、コレクション",
    "subcategories": [
      {
        "id": 4787,
        "name": "犬用お手入れ、トリミング用品",
        "depth": 3,
        "jpName": "犬用お手入れ、トリミング用品"
      },
      {
        "id": 4789,
        "name": "ドッグフード",
        "depth": 3,
        "jpName": "ドッグフード"
      },
      {
        "id": 4795,
        "name": "犬服、アクセサリー",
        "depth": 3,
        "jpName": "犬服、アクセサリー"
      },
      {
        "id": 4822,
        "name": "キャットフード",
        "depth": 3,
        "jpName": "キャットフード"
      },
      {
        "id": 4833,
        "name": "猫用トイレ用品",
        "depth": 3,
        "jpName": "猫用トイレ用品"
      },
      {
        "id": 32618,
        "name": "犬用ベッド、マット、カバー",
        "depth": 3,
        "jpName": "犬用ベッド、マット、カバー"
      },
      {
        "id": 32625,
        "name": "犬用首輪、ハーネス、リード",
        "depth": 3,
        "jpName": "犬用首輪、ハーネス、リード"
      },
      {
        "id": 32662,
        "name": "犬用しつけ用品",
        "depth": 3,
        "jpName": "犬用しつけ用品"
      },
      {
        "id": 32687,
        "name": "犬用　食器、餌やり、水やり用品",
        "depth": 3,
        "jpName": "犬用　食器、餌やり、水やり用品"
      },
      {
        "id": 32696,
        "name": "犬用トイレ用品、ペットシーツ、おむつ",
        "depth": 3,
        "jpName": "犬用トイレ用品、ペットシーツ、おむつ"
      },
      {
        "id": 32723,
        "name": "犬用おもちゃ",
        "depth": 3,
        "jpName": "犬用おもちゃ"
      },
      {
        "id": 32747,
        "name": "犬用サプリメント",
        "depth": 3,
        "jpName": "犬用サプリメント"
      },
      {
        "id": 32759,
        "name": "犬用ヘルスケア、介護用品",
        "depth": 3,
        "jpName": "犬用ヘルスケア、介護用品"
      },
      {
        "id": 32790,
        "name": "キャットタワー",
        "depth": 3,
        "jpName": "キャットタワー"
      },
      {
        "id": 32798,
        "name": "猫用ケージ",
        "depth": 3,
        "jpName": "猫用ケージ"
      }
    ]
  },
  {
    "id": 2510,
    "name": "Sports & Leisure",
    "jpName": "スポーツ、レジャー",
    "subcategories": [
      {
        "id": 2258,
        "name": "その他画材、アート用品",
        "depth": 3,
        "jpName": "その他画材、アート用品"
      },
      {
        "id": 2267,
        "name": "編物道具、毛糸",
        "depth": 3,
        "jpName": "編物道具、毛糸"
      },
      {
        "id": 2301,
        "name": "ビーズ、アクセサリー道具、材料",
        "depth": 3,
        "jpName": "ビーズ、アクセサリー道具、材料"
      },
      {
        "id": 2396,
        "name": "デジタル楽器",
        "depth": 3,
        "jpName": "デジタル楽器"
      },
      {
        "id": 2404,
        "name": "楽器アクセサリー",
        "depth": 3,
        "jpName": "楽器アクセサリー"
      },
      {
        "id": 2419,
        "name": "テレビ、アニメ、キャラクターグッズ",
        "depth": 3,
        "jpName": "テレビ、アニメ、キャラクターグッズ"
      },
      {
        "id": 14830,
        "name": "Cosplay Costumes",
        "depth": 3,
        "jpName": "コスプレ用コスチューム"
      },
      {
        "id": 14833,
        "name": "コスプレサポート用品",
        "depth": 3,
        "jpName": "コスプレサポート用品"
      },
      {
        "id": 26241,
        "name": "ミシン",
        "depth": 3,
        "jpName": "ミシン"
      },
      {
        "id": 44953,
        "name": "生地",
        "depth": 3,
        "jpName": "生地"
      },
      {
        "id": 49482,
        "name": "イヤホン、ヘッドホン",
        "depth": 3,
        "jpName": "イヤホン、ヘッドホン"
      },
      {
        "id": 65611,
        "name": "加熱式たばこ、電子たばこ",
        "depth": 3,
        "jpName": "加熱式たばこ、電子たばこ"
      }
    ]
  },
  {
    "id": 2511,
    "name": "Outdoor & Travel",
    "jpName": "アウトドア、釣り、旅行用品",
    "subcategories": [
      {
        "id": 2120,
        "name": "おしゃれ遊び、ヒロイン遊び",
        "depth": 3,
        "jpName": "おしゃれ遊び、ヒロイン遊び"
      },
      {
        "id": 2125,
        "name": "知育玩具",
        "depth": 3,
        "jpName": "知育玩具"
      },
      {
        "id": 2127,
        "name": "電子玩具",
        "depth": 3,
        "jpName": "電子玩具"
      },
      {
        "id": 2136,
        "name": "ヒーロー遊び",
        "depth": 3,
        "jpName": "ヒーロー遊び"
      },
      {
        "id": 2138,
        "name": "ブロック",
        "depth": 3,
        "jpName": "ブロック"
      },
      {
        "id": 2159,
        "name": "その他おもちゃ",
        "depth": 3,
        "jpName": "その他おもちゃ"
      },
      {
        "id": 2317,
        "name": "模型、プラモデルのロボット",
        "depth": 3,
        "jpName": "模型、プラモデルのロボット"
      },
      {
        "id": 2320,
        "name": "ドローン、ヘリ、航空機",
        "depth": 3,
        "jpName": "ドローン、ヘリ、航空機"
      },
      {
        "id": 14830,
        "name": "Cosplay Costumes",
        "depth": 3,
        "jpName": "コスプレ用コスチューム"
      },
      {
        "id": 15170,
        "name": "フィギュア本体",
        "depth": 3,
        "jpName": "フィギュア本体"
      },
      {
        "id": 16004,
        "name": "プレイステーション4",
        "depth": 3,
        "jpName": "プレイステーション4"
      },
      {
        "id": 17156,
        "name": "フィギュアケース",
        "depth": 3,
        "jpName": "フィギュアケース"
      },
      {
        "id": 24334,
        "name": "自転車車体",
        "depth": 3,
        "jpName": "自転車車体"
      },
      {
        "id": 38153,
        "name": "ニンテンドー3DS",
        "depth": 3,
        "jpName": "ニンテンドー3DS"
      },
      {
        "id": 48838,
        "name": "Nintendo Switch",
        "depth": 3,
        "jpName": "Nintendo Switch"
      }
    ]
  },
  {
    "id": 2512,
    "name": "Bicycles, Cars & Motorcycles",
    "jpName": "自転車、車、バイク用品",
    "subcategories": [
      {
        "id": 1964,
        "name": "ダイエットウエア、サポーター",
        "depth": 3,
        "jpName": "ダイエットウエア、サポーター"
      },
      {
        "id": 3060,
        "name": "ゴルフラウンド用品、アクセサリー",
        "depth": 3,
        "jpName": "ゴルフラウンド用品、アクセサリー"
      },
      {
        "id": 3083,
        "name": "ゴルフ　メンズウエア",
        "depth": 3,
        "jpName": "ゴルフ　メンズウエア"
      },
      {
        "id": 3096,
        "name": "ゴルフ用バッグ",
        "depth": 3,
        "jpName": "ゴルフ用バッグ"
      },
      {
        "id": 3110,
        "name": "ゴルフボール",
        "depth": 3,
        "jpName": "ゴルフボール"
      },
      {
        "id": 3143,
        "name": "サッカー、フットサル　スパイク　シューズ",
        "depth": 3,
        "jpName": "サッカー、フットサル　スパイク　シューズ"
      },
      {
        "id": 3218,
        "name": "ウエア",
        "depth": 3,
        "jpName": "ウエア"
      },
      {
        "id": 3224,
        "name": "その他フィットネス、トレーニング用品",
        "depth": 3,
        "jpName": "その他フィットネス、トレーニング用品"
      },
      {
        "id": 3250,
        "name": "卓球 ラバー",
        "depth": 3,
        "jpName": "卓球 ラバー"
      },
      {
        "id": 3261,
        "name": "テニスウエア",
        "depth": 3,
        "jpName": "テニスウエア"
      },
      {
        "id": 3290,
        "name": "バドミントン シャトル",
        "depth": 3,
        "jpName": "バドミントン シャトル"
      },
      {
        "id": 3337,
        "name": "野球ユニフォーム、ウエア",
        "depth": 3,
        "jpName": "野球ユニフォーム、ウエア"
      },
      {
        "id": 14867,
        "name": "鉄棒",
        "depth": 3,
        "jpName": "鉄棒"
      },
      {
        "id": 15252,
        "name": "ゴルフ練習器具",
        "depth": 3,
        "jpName": "ゴルフ練習器具"
      },
      {
        "id": 15315,
        "name": "ランニング、ジョギング用アクセサリー",
        "depth": 3,
        "jpName": "ランニング、ジョギング用アクセサリー"
      }
    ]
  },
  {
    "id": 2513,
    "name": "DIY & Tools",
    "jpName": "DIY、工具",
    "subcategories": [
      {
        "id": 2614,
        "name": "アウトドア　寝具",
        "depth": 3,
        "jpName": "アウトドア　寝具"
      },
      {
        "id": 2635,
        "name": "アウトドア　テーブル、チェア、ハンモック",
        "depth": 3,
        "jpName": "アウトドア　テーブル、チェア、ハンモック"
      },
      {
        "id": 2638,
        "name": "レジャーシート",
        "depth": 3,
        "jpName": "レジャーシート"
      },
      {
        "id": 2648,
        "name": "アウトドア　ライト、ランタン",
        "depth": 3,
        "jpName": "アウトドア　ライト、ランタン"
      },
      {
        "id": 2716,
        "name": "釣り仕掛け、仕掛け用品",
        "depth": 3,
        "jpName": "釣り仕掛け、仕掛け用品"
      },
      {
        "id": 2801,
        "name": "フィッシング用品ウェーダー",
        "depth": 3,
        "jpName": "フィッシング用品ウェーダー"
      },
      {
        "id": 4114,
        "name": "旅行用品　快適グッズ、小物",
        "depth": 3,
        "jpName": "旅行用品　快適グッズ、小物"
      },
      {
        "id": 4121,
        "name": "耳栓",
        "depth": 3,
        "jpName": "耳栓"
      },
      {
        "id": 4137,
        "name": "旅行かばん、ポーチ、小分けバッグ",
        "depth": 3,
        "jpName": "旅行かばん、ポーチ、小分けバッグ"
      },
      {
        "id": 21540,
        "name": "旅行用品　スーツケース、キャリーバッグ",
        "depth": 3,
        "jpName": "旅行用品　スーツケース、キャリーバッグ"
      },
      {
        "id": 41764,
        "name": "タープ、テント設営用品",
        "depth": 3,
        "jpName": "タープ、テント設営用品"
      },
      {
        "id": 43527,
        "name": "登山、クライミング用品",
        "depth": 3,
        "jpName": "登山、クライミング用品"
      },
      {
        "id": 46562,
        "name": "コンプレッションウェア　トップス",
        "depth": 3,
        "jpName": "コンプレッションウェア　トップス"
      },
      {
        "id": 48536,
        "name": "アウトドアシューズ",
        "depth": 3,
        "jpName": "アウトドアシューズ"
      },
      {
        "id": 48602,
        "name": "アウトドア精密機器",
        "depth": 3,
        "jpName": "アウトドア精密機器"
      }
    ]
  },
  {
    "id": 2514,
    "name": "Home & Interior",
    "jpName": "住まい、インテリア",
    "subcategories": [
      {
        "id": 13721,
        "name": "サイクルウェア、ヘルメット",
        "depth": 3,
        "jpName": "サイクルウェア、ヘルメット"
      },
      {
        "id": 24334,
        "name": "自転車車体",
        "depth": 3,
        "jpName": "自転車車体"
      },
      {
        "id": 41823,
        "name": "バイクウェア",
        "depth": 3,
        "jpName": "バイクウェア"
      },
      {
        "id": 42082,
        "name": "バイク用電子機器類",
        "depth": 3,
        "jpName": "バイク用電子機器類"
      },
      {
        "id": 42417,
        "name": "自動車用タイヤ、ホイール",
        "depth": 3,
        "jpName": "自動車用タイヤ、ホイール"
      },
      {
        "id": 42617,
        "name": "車 ライト、レンズ",
        "depth": 3,
        "jpName": "車 ライト、レンズ"
      },
      {
        "id": 42843,
        "name": "自動車用　セキュリティ、キーレス",
        "depth": 3,
        "jpName": "自動車用　セキュリティ、キーレス"
      },
      {
        "id": 42945,
        "name": "ドレスアップ用品",
        "depth": 3,
        "jpName": "ドレスアップ用品"
      },
      {
        "id": 43672,
        "name": "自動車用セーフティー用品",
        "depth": 3,
        "jpName": "自動車用セーフティー用品"
      },
      {
        "id": 43835,
        "name": "ベビーシート、チャイルドシート本体",
        "depth": 3,
        "jpName": "ベビーシート、チャイルドシート本体"
      },
      {
        "id": 43914,
        "name": "バイク用　ハンドル",
        "depth": 3,
        "jpName": "バイク用　ハンドル"
      },
      {
        "id": 44208,
        "name": "バイク用　盗難防止用品",
        "depth": 3,
        "jpName": "バイク用　盗難防止用品"
      },
      {
        "id": 46627,
        "name": "スポーツサングラス",
        "depth": 3,
        "jpName": "スポーツサングラス"
      },
      {
        "id": 49418,
        "name": "アクションカメラ、ウェアラブルカメラ",
        "depth": 3,
        "jpName": "アクションカメラ、ウェアラブルカメラ"
      },
      {
        "id": 72382,
        "name": "バイク用ヘルメット",
        "depth": 3,
        "jpName": "バイク用ヘルメット"
      }
    ]
  },
  {
    "id": 2515,
    "name": "Kitchen & Daily Goods",
    "jpName": "キッチン、日用品、文具",
    "subcategories": [

    ]
  },
  {
    "id": 2516,
    "name": "Pet Supplies",
    "jpName": "ペット用品、生き物",
    "subcategories": [
      {
        "id": 724,
        "name": "邦楽ロック、ポップスの音楽ソフト",
        "depth": 3,
        "jpName": "邦楽ロック、ポップスの音楽ソフト"
      },
      {
        "id": 725,
        "name": "邦楽その他の音楽ソフト",
        "depth": 3,
        "jpName": "邦楽その他の音楽ソフト"
      },
      {
        "id": 741,
        "name": "洋楽ロック、ポップスの音楽ソフト",
        "depth": 3,
        "jpName": "洋楽ロック、ポップスの音楽ソフト"
      },
      {
        "id": 771,
        "name": "ワールドミュージックその他の音楽ソフト",
        "depth": 3,
        "jpName": "ワールドミュージックその他の音楽ソフト"
      },
      {
        "id": 838,
        "name": "アニメソング、声優の音楽ソフト",
        "depth": 3,
        "jpName": "アニメソング、声優の音楽ソフト"
      },
      {
        "id": 5322,
        "name": "邦楽アイドルの音楽ソフト",
        "depth": 3,
        "jpName": "邦楽アイドルの音楽ソフト"
      },
      {
        "id": 5332,
        "name": "洋楽R&B音楽ソフト",
        "depth": 3,
        "jpName": "洋楽R&B音楽ソフト"
      }
    ]
  },
  {
    "id": 2517,
    "name": "Musical Instruments",
    "jpName": "楽器、器材",
    "subcategories": [
      {
        "id": 855,
        "name": "洋画アクションの映像ソフト",
        "depth": 3,
        "jpName": "洋画アクションの映像ソフト"
      },
      {
        "id": 867,
        "name": "洋画その他の映像ソフト",
        "depth": 3,
        "jpName": "洋画その他の映像ソフト"
      },
      {
        "id": 870,
        "name": "邦画アクションの映像ソフト",
        "depth": 3,
        "jpName": "邦画アクションの映像ソフト"
      },
      {
        "id": 882,
        "name": "海外アニメ映像ソフト",
        "depth": 3,
        "jpName": "海外アニメ映像ソフト"
      },
      {
        "id": 905,
        "name": "邦楽の音楽映像ソフト",
        "depth": 3,
        "jpName": "邦楽の音楽映像ソフト"
      },
      {
        "id": 907,
        "name": "音楽映像ソフトその他",
        "depth": 3,
        "jpName": "音楽映像ソフトその他"
      },
      {
        "id": 924,
        "name": "バラエティその他の映像ソフト",
        "depth": 3,
        "jpName": "バラエティその他の映像ソフト"
      },
      {
        "id": 5547,
        "name": "劇場アニメ映像ソフト",
        "depth": 3,
        "jpName": "劇場アニメ映像ソフト"
      },
      {
        "id": 5550,
        "name": "キッズ＆ファミリーアニメの映像ソフト",
        "depth": 3,
        "jpName": "キッズ＆ファミリーアニメの映像ソフト"
      },
      {
        "id": 5552,
        "name": "アニメーションその他の映像ソフト",
        "depth": 3,
        "jpName": "アニメーションその他の映像ソフト"
      },
      {
        "id": 5609,
        "name": "テレビ番組の映像ソフト",
        "depth": 3,
        "jpName": "テレビ番組の映像ソフト"
      },
      {
        "id": 65290,
        "name": "日本のテレビドラマ",
        "depth": 3,
        "jpName": "日本のテレビドラマ"
      },
      {
        "id": 65296,
        "name": "韓国のテレビドラマ",
        "depth": 3,
        "jpName": "韓国のテレビドラマ"
      },
      {
        "id": 65299,
        "name": "諸外国のテレビドラマ",
        "depth": 3,
        "jpName": "諸外国のテレビドラマ"
      }
    ]
  },
  {
    "id": 2519,
    "name": "Cosmetics & Beauty",
    "jpName": "コスメ、美容、ヘアケア",
    "subcategories": [
      {
        "id": 16,
        "name": "外付けハードディスク、ドライブ",
        "depth": 3,
        "jpName": "外付けハードディスク、ドライブ"
      },
      {
        "id": 51,
        "name": "ルーター、ネットワーク機器",
        "depth": 3,
        "jpName": "ルーター、ネットワーク機器"
      },
      {
        "id": 60,
        "name": "分配器、切替器",
        "depth": 3,
        "jpName": "分配器、切替器"
      },
      {
        "id": 14254,
        "name": "パソコン用キーボード",
        "depth": 3,
        "jpName": "パソコン用キーボード"
      },
      {
        "id": 14255,
        "name": "マウス、トラックボール",
        "depth": 3,
        "jpName": "マウス、トラックボール"
      },
      {
        "id": 21176,
        "name": "プロジェクター",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 38488,
        "name": "モバイルルーター",
        "depth": 3,
        "jpName": "モバイルルーター"
      },
      {
        "id": 40116,
        "name": "PCケーブル、コネクタ",
        "depth": 3,
        "jpName": "PCケーブル、コネクタ"
      },
      {
        "id": 40149,
        "name": "PCスピーカー",
        "depth": 3,
        "jpName": "PCスピーカー"
      },
      {
        "id": 40150,
        "name": "Webカメラ",
        "depth": 3,
        "jpName": "Webカメラ"
      },
      {
        "id": 70204,
        "name": "イヤホンマイク、ヘッドセット",
        "depth": 3,
        "jpName": "イヤホンマイク、ヘッドセット"
      }
    ]
  },
  {
    "id": 2520,
    "name": "Diet & Health",
    "jpName": "ダイエット、健康",
    "subcategories": [

    ]
  },
  {
    "id": 2521,
    "name": "Baby, Kids & Maternity",
    "jpName": "ベビー、キッズ、マタニティ",
    "subcategories": [

    ]
  },
  {
    "id": 2522,
    "name": "Smartphones, Tablets & PC",
    "jpName": "スマホ、タブレット、パソコン",
    "subcategories": [
      {
        "id": 2614,
        "name": "アウトドア　寝具",
        "depth": 3,
        "jpName": "アウトドア　寝具"
      },
      {
        "id": 2635,
        "name": "アウトドア　テーブル、チェア、ハンモック",
        "depth": 3,
        "jpName": "アウトドア　テーブル、チェア、ハンモック"
      },
      {
        "id": 2638,
        "name": "レジャーシート",
        "depth": 3,
        "jpName": "レジャーシート"
      },
      {
        "id": 2648,
        "name": "アウトドア　ライト、ランタン",
        "depth": 3,
        "jpName": "アウトドア　ライト、ランタン"
      },
      {
        "id": 21210,
        "name": "アウトドア燃料",
        "depth": 3,
        "jpName": "アウトドア燃料"
      },
      {
        "id": 21304,
        "name": "アウトドアナイフ",
        "depth": 3,
        "jpName": "アウトドアナイフ"
      },
      {
        "id": 41764,
        "name": "タープ、テント設営用品",
        "depth": 3,
        "jpName": "タープ、テント設営用品"
      },
      {
        "id": 43527,
        "name": "登山、クライミング用品",
        "depth": 3,
        "jpName": "登山、クライミング用品"
      },
      {
        "id": 46560,
        "name": "コンプレッションウェア　ボトムス",
        "depth": 3,
        "jpName": "コンプレッションウェア　ボトムス"
      },
      {
        "id": 46562,
        "name": "コンプレッションウェア　トップス",
        "depth": 3,
        "jpName": "コンプレッションウェア　トップス"
      },
      {
        "id": 48475,
        "name": "アウトドアリュック、バッグ",
        "depth": 3,
        "jpName": "アウトドアリュック、バッグ"
      },
      {
        "id": 48496,
        "name": "アウトドアウェア",
        "depth": 3,
        "jpName": "アウトドアウェア"
      },
      {
        "id": 48536,
        "name": "アウトドアシューズ",
        "depth": 3,
        "jpName": "アウトドアシューズ"
      },
      {
        "id": 48602,
        "name": "アウトドア精密機器",
        "depth": 3,
        "jpName": "アウトドア精密機器"
      },
      {
        "id": 48612,
        "name": "登山、クライミング　エマージェンシーグッズ",
        "depth": 3,
        "jpName": "登山、クライミング　エマージェンシーグッズ"
      }
    ]
  },
  {
    "id": 2524,
    "name": "TV, Audio & Cameras",
    "jpName": "テレビ、オーディオ、カメラ",
    "subcategories": [

    ]
  }
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
