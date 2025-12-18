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
        "id": 68707,
        "name": "Women's Wallets",
        "depth": 3,
        "jpName": "レディース財布"
      },
      {
        "id": 68728,
        "name": "Women's Umbrellas",
        "depth": 3,
        "jpName": "レディース傘"
      },
      {
        "id": 68749,
        "name": "Women's Hats",
        "depth": 3,
        "jpName": "レディース帽子"
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
        "id": 1582,
        "name": "Men's Bags",
        "depth": 3,
        "jpName": "メンズバッグ"
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
        "name": "Surf Pants",
        "depth": 3,
        "jpName": "サーフパンツ"
      },
      {
        "id": 21540,
        "name": "Suitcases, Carry Bags",
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
        "id": 48895,
        "name": "Men's Jerseys, Sweatwear",
        "depth": 3,
        "jpName": "メンズジャージ、スウェット"
      },
      {
        "id": 69577,
        "name": "Men's Umbrellas",
        "depth": 3,
        "jpName": "メンズ傘"
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
        "name": "Crab",
        "depth": 3,
        "jpName": "カニ"
      },
      {
        "id": 962,
        "name": "Fish, Fresh Fish",
        "depth": 3,
        "jpName": "魚、鮮魚"
      },
      {
        "id": 1036,
        "name": "Persimmon",
        "depth": 3,
        "jpName": "フルーツ 柿"
      },
      {
        "id": 1037,
        "name": "Tangerines, Citrus Fruits",
        "depth": 3,
        "jpName": "みかん、柑橘類"
      },
      {
        "id": 1057,
        "name": "Pickled Plums",
        "depth": 3,
        "jpName": "梅干し"
      },
      {
        "id": 1082,
        "name": "Pickles",
        "depth": 3,
        "jpName": "漬物"
      },
      {
        "id": 1161,
        "name": "Nuts",
        "depth": 3,
        "jpName": "ナッツ類"
      },
      {
        "id": 1202,
        "name": "Udon, Cup Noodles",
        "depth": 3,
        "jpName": "うどん、カップうどん"
      },
      {
        "id": 1242,
        "name": "Rice",
        "depth": 3,
        "jpName": "米、ごはん"
      },
      {
        "id": 13451,
        "name": "Snacks, Sweets, Appetizers",
        "depth": 3,
        "jpName": "その他スナック、お菓子、おつまみ"
      },
      {
        "id": 14628,
        "name": "Chocolate",
        "depth": 3,
        "jpName": "チョコレート"
      },
      {
        "id": 14642,
        "name": "Dagashi (Japanese Candy)",
        "depth": 3,
        "jpName": "駄菓子"
      },
      {
        "id": 15885,
        "name": "Pudding",
        "depth": 3,
        "jpName": "プリン"
      },
      {
        "id": 15920,
        "name": "Cheesecake",
        "depth": 3,
        "jpName": "チーズケーキ"
      },
      {
        "id": 15957,
        "name": "Grapes",
        "depth": 3,
        "jpName": "フルーツ ブドウ"
      },
      {
        "id": 18669,
        "name": "Baked Goods, Cookies",
        "depth": 3,
        "jpName": "焼き菓子、クッキー"
      },
      {
        "id": 18728,
        "name": "Baumkuchen",
        "depth": 3,
        "jpName": "バウムクーヘン"
      },
      {
        "id": 18778,
        "name": "Snacks, Delicacies",
        "depth": 3,
        "jpName": "スナック、お菓子 、おつまみ珍味"
      },
      {
        "id": 18799,
        "name": "Seaweed",
        "depth": 3,
        "jpName": "海苔"
      },
      {
        "id": 18917,
        "name": "Cereals, Grains",
        "depth": 3,
        "jpName": "雑穀"
      },
      {
        "id": 19393,
        "name": "Seafood, Shellfish",
        "depth": 3,
        "jpName": "魚介類、海産物、貝類"
      },
      {
        "id": 41278,
        "name": "Dried Sweet Potato",
        "depth": 3,
        "jpName": "干し芋"
      },
      {
        "id": 41432,
        "name": "Meat Delicacies",
        "depth": 3,
        "jpName": "肉惣菜、料理"
      },
      {
        "id": 41436,
        "name": "Rice Dishes",
        "depth": 3,
        "jpName": "ごはんもの"
      },
      {
        "id": 41439,
        "name": "Soup",
        "depth": 3,
        "jpName": "スープ"
      },
      {
        "id": 41555,
        "name": "Osechi Cuisine",
        "depth": 3,
        "jpName": "おせち料理"
      },
      {
        "id": 41642,
        "name": "Rice Seasoning",
        "depth": 3,
        "jpName": "ふりかけ"
      },
      {
        "id": 41645,
        "name": "Rice Ball Mix",
        "depth": 3,
        "jpName": "おむすびの素"
      },
      {
        "id": 48758,
        "name": "Snack Foods",
        "depth": 3,
        "jpName": "スナック菓子"
      },
      {
        "id": 65279,
        "name": "Beef, Beef Offal",
        "depth": 3,
        "jpName": "牛肉、牛ホルモン"
      },
      {
        "id": 65285,
        "name": "Chicken",
        "depth": 3,
        "jpName": "鶏肉"
      },
      {
        "id": 68806,
        "name": "Ramen",
        "depth": 3,
        "jpName": "ラーメン"
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
        "name": "Shochu",
        "depth": 3,
        "jpName": "焼酎"
      },
      {
        "id": 1371,
        "name": "Wine",
        "depth": 3,
        "jpName": "ワイン"
      },
      {
        "id": 1381,
        "name": "Coffee",
        "depth": 3,
        "jpName": "コーヒー"
      },
      {
        "id": 1385,
        "name": "Black Tea",
        "depth": 3,
        "jpName": "紅茶"
      },
      {
        "id": 1399,
        "name": "Green Tea, Japanese Tea",
        "depth": 3,
        "jpName": "緑茶、日本茶"
      },
      {
        "id": 1426,
        "name": "Soft Drinks, Juice",
        "depth": 3,
        "jpName": "ソフトドリンク、ジュース"
      },
      {
        "id": 1892,
        "name": "Vinegar Drinks",
        "depth": 3,
        "jpName": "お酢飲料、飲む酢"
      },
      {
        "id": 15152,
        "name": "Beer, Happoshu",
        "depth": 3,
        "jpName": "ビール類、発泡酒"
      },
      {
        "id": 17318,
        "name": "Herbal Tea",
        "depth": 3,
        "jpName": "ハーブティー"
      },
      {
        "id": 17341,
        "name": "Cocoa",
        "depth": 3,
        "jpName": "ココア"
      },
      {
        "id": 17487,
        "name": "Health Tea",
        "depth": 3,
        "jpName": "健康茶"
      },
      {
        "id": 17583,
        "name": "Water, Sparkling Water",
        "depth": 3,
        "jpName": "水、炭酸水"
      },
      {
        "id": 68641,
        "name": "Whiskey",
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
        "id": 16,
        "name": "External Hard Drives",
        "depth": 3,
        "jpName": "外付けハードディスク、ドライブ"
      },
      {
        "id": 51,
        "name": "Routers, Network Equipment",
        "depth": 3,
        "jpName": "ルーター、ネットワーク機器"
      },
      {
        "id": 60,
        "name": "Splitters, Switches",
        "depth": 3,
        "jpName": "分配器、切替器"
      },
      {
        "id": 14254,
        "name": "PC Keyboards",
        "depth": 3,
        "jpName": "パソコン用キーボード"
      },
      {
        "id": 14255,
        "name": "Mouse, Trackball",
        "depth": 3,
        "jpName": "マウス、トラックボール"
      },
      {
        "id": 21176,
        "name": "Projectors",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 38488,
        "name": "Mobile Routers",
        "depth": 3,
        "jpName": "モバイルルーター"
      },
      {
        "id": 40116,
        "name": "PC Cables, Connectors",
        "depth": 3,
        "jpName": "PCケーブル、コネクタ"
      },
      {
        "id": 40149,
        "name": "PC Speakers",
        "depth": 3,
        "jpName": "PCスピーカー"
      },
      {
        "id": 40150,
        "name": "Web Cameras",
        "depth": 3,
        "jpName": "Webカメラ"
      },
      {
        "id": 70204,
        "name": "Earphones, Headsets",
        "depth": 3,
        "jpName": "イヤホンマイク、ヘッドセット"
      }
    ]
  },
  {
    "id": 2502,
    "name": "Fashion & Accessories",
    "jpName": "ファッション、アクセサリー",
    "subcategories": [
      {
        "id": 36497,
        "name": "Smart Watches",
        "depth": 3,
        "jpName": "スマートウォッチ本体"
      },
      {
        "id": 36498,
        "name": "Smart Watch Accessories",
        "depth": 3,
        "jpName": "スマートウォッチアクセサリー"
      }
    ]
  },
  {
    "id": 2503,
    "name": "Cameras & Optics",
    "jpName": "カメラ、光学機器",
    "subcategories": [
      {
        "id": 2468,
        "name": "Digital Cameras",
        "depth": 3,
        "jpName": "その他カメラ"
      },
      {
        "id": 19782,
        "name": "Binoculars, Opera Glasses",
        "depth": 3,
        "jpName": "双眼鏡、オペラグラス"
      },
      {
        "id": 49418,
        "name": "Action Cameras",
        "depth": 3,
        "jpName": "アクションカメラ、ウェアラブルカメラ"
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
        "name": "Vacuum Cleaners",
        "depth": 3,
        "jpName": "掃除機、クリーナー"
      },
      {
        "id": 26222,
        "name": "Washing Machines",
        "depth": 3,
        "jpName": "洗濯機"
      },
      {
        "id": 26236,
        "name": "Irons, Trouser Presses",
        "depth": 3,
        "jpName": "アイロン、ズボンプレッサー"
      },
      {
        "id": 26249,
        "name": "Refrigerators, Freezers",
        "depth": 3,
        "jpName": "冷蔵庫、冷凍庫"
      },
      {
        "id": 26259,
        "name": "Microwaves, Ovens",
        "depth": 3,
        "jpName": "電子レンジ、オーブン"
      },
      {
        "id": 26308,
        "name": "Air Conditioners",
        "depth": 3,
        "jpName": "エアコン"
      },
      {
        "id": 26323,
        "name": "Dehumidifiers",
        "depth": 3,
        "jpName": "除湿機、アクセサリー"
      },
      {
        "id": 38053,
        "name": "Electric Kettles",
        "depth": 3,
        "jpName": "電気ケトル"
      },
      {
        "id": 38072,
        "name": "Juicers, Blenders, Food Processors",
        "depth": 3,
        "jpName": "ジューサー、ミキサー、フードプロセッサー"
      },
      {
        "id": 38079,
        "name": "Fish Roasters",
        "depth": 3,
        "jpName": "フィッシュロースター、魚焼き器"
      },
      {
        "id": 48441,
        "name": "Yogurt Makers",
        "depth": 3,
        "jpName": "ヨーグルトメーカー"
      },
      {
        "id": 49132,
        "name": "Carbonated Water Makers",
        "depth": 3,
        "jpName": "炭酸水メーカー"
      }
    ]
  },
  {
    "id": 2506,
    "name": "Music, Movies & Video Games",
    "jpName": "音楽、映画、テレビゲーム",
    "subcategories": [
      {
        "id": 16004,
        "name": "PlayStation 4",
        "depth": 3,
        "jpName": "プレイステーション4"
      },
      {
        "id": 38153,
        "name": "Nintendo 3DS",
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
    "id": 2507,
    "name": "Toys & Games",
    "jpName": "おもちゃ、ゲーム",
    "subcategories": [
      {
        "id": 2120,
        "name": "Dress-up Play",
        "depth": 3,
        "jpName": "おしゃれ遊び、ヒロイン遊び"
      },
      {
        "id": 2125,
        "name": "Educational Toys",
        "depth": 3,
        "jpName": "知育玩具"
      },
      {
        "id": 2127,
        "name": "Electronic Toys",
        "depth": 3,
        "jpName": "電子玩具"
      },
      {
        "id": 2136,
        "name": "Hero Play",
        "depth": 3,
        "jpName": "ヒーロー遊び"
      },
      {
        "id": 2138,
        "name": "Building Blocks",
        "depth": 3,
        "jpName": "ブロック"
      },
      {
        "id": 15170,
        "name": "Action Figures",
        "depth": 3,
        "jpName": "フィギュア本体"
      }
    ]
  },
  {
    "id": 2508,
    "name": "Hobby & Culture",
    "jpName": "ホビー、カルチャー",
    "subcategories": [
      {
        "id": 2258,
        "name": "Art Supplies",
        "depth": 3,
        "jpName": "その他画材、アート用品"
      },
      {
        "id": 2267,
        "name": "Knitting Tools, Yarn",
        "depth": 3,
        "jpName": "編物道具、毛糸"
      },
      {
        "id": 2301,
        "name": "Beads, Accessory Materials",
        "depth": 3,
        "jpName": "ビーズ、アクセサリー道具、材料"
      },
      {
        "id": 2317,
        "name": "Model Kits, Robots",
        "depth": 3,
        "jpName": "模型、プラモデルのロボット"
      },
      {
        "id": 2320,
        "name": "Drones, Helicopters",
        "depth": 3,
        "jpName": "ドローン、ヘリ、航空機"
      },
      {
        "id": 26241,
        "name": "Sewing Machines",
        "depth": 3,
        "jpName": "ミシン"
      },
      {
        "id": 44953,
        "name": "Fabric",
        "depth": 3,
        "jpName": "生地"
      }
    ]
  },
  {
    "id": 2509,
    "name": "Antiques & Collectibles",
    "jpName": "アンティーク、コレクション",
    "subcategories": [
      {
        "id": 2419,
        "name": "TV, Anime Character Goods",
        "depth": 3,
        "jpName": "テレビ、アニメ、キャラクターグッズ"
      },
      {
        "id": 15170,
        "name": "Collectible Figures",
        "depth": 3,
        "jpName": "フィギュア本体"
      },
      {
        "id": 17156,
        "name": "Figure Cases",
        "depth": 3,
        "jpName": "フィギュアケース"
      }
    ]
  },
  {
    "id": 2510,
    "name": "Sports & Leisure",
    "jpName": "スポーツ、レジャー",
    "subcategories": [
      {
        "id": 3060,
        "name": "Golf Accessories",
        "depth": 3,
        "jpName": "ゴルフラウンド用品、アクセサリー"
      },
      {
        "id": 3083,
        "name": "Golf Men's Wear",
        "depth": 3,
        "jpName": "ゴルフ　メンズウエア"
      },
      {
        "id": 3110,
        "name": "Golf Balls",
        "depth": 3,
        "jpName": "ゴルフボール"
      },
      {
        "id": 3143,
        "name": "Soccer, Futsal Spikes, Shoes",
        "depth": 3,
        "jpName": "サッカー、フットサル　スパイク　シューズ"
      },
      {
        "id": 3224,
        "name": "Fitness, Training Equipment",
        "depth": 3,
        "jpName": "その他フィットネス、トレーニング用品"
      },
      {
        "id": 3261,
        "name": "Tennis Wear",
        "depth": 3,
        "jpName": "テニスウエア"
      },
      {
        "id": 3337,
        "name": "Baseball Uniforms, Wear",
        "depth": 3,
        "jpName": "野球ユニフォーム、ウエア"
      },
      {
        "id": 46592,
        "name": "Marathon, Running Shoes",
        "depth": 3,
        "jpName": "マラソン、ランニングシューズ"
      }
    ]
  },
  {
    "id": 2511,
    "name": "Outdoor & Travel",
    "jpName": "アウトドア、釣り、旅行用品",
    "subcategories": [
      {
        "id": 2614,
        "name": "Outdoor Bedding",
        "depth": 3,
        "jpName": "アウトドア　寝具"
      },
      {
        "id": 2635,
        "name": "Outdoor Tables, Chairs, Hammocks",
        "depth": 3,
        "jpName": "アウトドア　テーブル、チェア、ハンモック"
      },
      {
        "id": 2638,
        "name": "Leisure Sheets",
        "depth": 3,
        "jpName": "レジャーシート"
      },
      {
        "id": 2648,
        "name": "Outdoor Lights, Lanterns",
        "depth": 3,
        "jpName": "アウトドア　ライト、ランタン"
      },
      {
        "id": 2716,
        "name": "Fishing Tackle",
        "depth": 3,
        "jpName": "釣り仕掛け、仕掛け用品"
      },
      {
        "id": 4114,
        "name": "Travel Comfort Goods",
        "depth": 3,
        "jpName": "旅行用品　快適グッズ、小物"
      },
      {
        "id": 4137,
        "name": "Travel Bags, Pouches",
        "depth": 3,
        "jpName": "旅行かばん、ポーチ、小分けバッグ"
      },
      {
        "id": 21540,
        "name": "Suitcases, Carry Bags",
        "depth": 3,
        "jpName": "旅行用品　スーツケース、キャリーバッグ"
      },
      {
        "id": 41764,
        "name": "Tarps, Tent Equipment",
        "depth": 3,
        "jpName": "タープ、テント設営用品"
      },
      {
        "id": 43527,
        "name": "Climbing Equipment",
        "depth": 3,
        "jpName": "登山、クライミング用品"
      },
      {
        "id": 48536,
        "name": "Outdoor Shoes",
        "depth": 3,
        "jpName": "アウトドアシューズ"
      },
      {
        "id": 48602,
        "name": "Outdoor Precision Equipment",
        "depth": 3,
        "jpName": "アウトドア精密機器"
      },
      {
        "id": 68011,
        "name": "Water Bottles",
        "depth": 3,
        "jpName": "水筒"
      }
    ]
  },
  {
    "id": 2512,
    "name": "Bicycles, Cars & Motorcycles",
    "jpName": "自転車、車、バイク用品",
    "subcategories": [
      {
        "id": 24334,
        "name": "Bicycles",
        "depth": 3,
        "jpName": "自転車車体"
      },
      {
        "id": 42417,
        "name": "Car Tires, Wheels",
        "depth": 3,
        "jpName": "自動車用タイヤ、ホイール"
      },
      {
        "id": 42617,
        "name": "Car Lights, Lenses",
        "depth": 3,
        "jpName": "車 ライト、レンズ"
      },
      {
        "id": 42843,
        "name": "Car Security, Keyless",
        "depth": 3,
        "jpName": "自動車用　セキュリティ、キーレス"
      },
      {
        "id": 43672,
        "name": "Car Safety Products",
        "depth": 3,
        "jpName": "自動車用セーフティー用品"
      },
      {
        "id": 43835,
        "name": "Baby Seats, Child Seats",
        "depth": 3,
        "jpName": "ベビーシート、チャイルドシート本体"
      },
      {
        "id": 72382,
        "name": "Motorcycle Helmets",
        "depth": 3,
        "jpName": "バイク用ヘルメット"
      }
    ]
  },
  {
    "id": 2513,
    "name": "DIY & Tools",
    "jpName": "DIY、工具",
    "subcategories": [
      {
        "id": 4062,
        "name": "Fertilizers, Pesticides",
        "depth": 3,
        "jpName": "肥料、農薬"
      },
      {
        "id": 38597,
        "name": "Ladders",
        "depth": 3,
        "jpName": "脚立、はしご"
      },
      {
        "id": 38842,
        "name": "Painting Tools",
        "depth": 3,
        "jpName": "塗装用具"
      }
    ]
  },
  {
    "id": 2514,
    "name": "Home & Interior",
    "jpName": "住まい、インテリア",
    "subcategories": [
      {
        "id": 3670,
        "name": "Sheets, Covers",
        "depth": 3,
        "jpName": "シーツ、カバー"
      },
      {
        "id": 3678,
        "name": "Futons",
        "depth": 3,
        "jpName": "布団"
      },
      {
        "id": 14916,
        "name": "Ceiling Lights",
        "depth": 3,
        "jpName": "シーリングライト、天井照明"
      },
      {
        "id": 14917,
        "name": "Table Lamps",
        "depth": 3,
        "jpName": "卓上ライト"
      },
      {
        "id": 27821,
        "name": "Pillows",
        "depth": 3,
        "jpName": "枕、ピロー、腰枕、足枕"
      },
      {
        "id": 36937,
        "name": "Floor Chairs",
        "depth": 3,
        "jpName": "座椅子、高座椅子"
      }
    ]
  },
  {
    "id": 2515,
    "name": "Kitchen & Daily Goods",
    "jpName": "キッチン、日用品、文具",
    "subcategories": [
      {
        "id": 3957,
        "name": "Laundry Detergent",
        "depth": 3,
        "jpName": "衣類洗剤"
      },
      {
        "id": 34852,
        "name": "Toilet Paper",
        "depth": 3,
        "jpName": "トイレットペーパー"
      },
      {
        "id": 47286,
        "name": "Writing Instruments",
        "depth": 3,
        "jpName": "筆記用具"
      },
      {
        "id": 47405,
        "name": "Files, Cases",
        "depth": 3,
        "jpName": "ファイル、ケース"
      }
    ]
  },
  {
    "id": 2516,
    "name": "Pet Supplies",
    "jpName": "ペット用品、生き物",
    "subcategories": [
      {
        "id": 4789,
        "name": "Dog Food",
        "depth": 3,
        "jpName": "ドッグフード"
      },
      {
        "id": 4822,
        "name": "Cat Food",
        "depth": 3,
        "jpName": "キャットフード"
      },
      {
        "id": 4833,
        "name": "Cat Litter",
        "depth": 3,
        "jpName": "猫用トイレ用品"
      },
      {
        "id": 32625,
        "name": "Dog Collars, Harnesses, Leashes",
        "depth": 3,
        "jpName": "犬用首輪、ハーネス、リード"
      },
      {
        "id": 32723,
        "name": "Dog Toys",
        "depth": 3,
        "jpName": "犬用おもちゃ"
      },
      {
        "id": 32790,
        "name": "Cat Towers",
        "depth": 3,
        "jpName": "キャットタワー"
      }
    ]
  },
  {
    "id": 2517,
    "name": "Musical Instruments",
    "jpName": "楽器、器材",
    "subcategories": [
      {
        "id": 2396,
        "name": "Digital Instruments",
        "depth": 3,
        "jpName": "デジタル楽器"
      },
      {
        "id": 2404,
        "name": "Instrument Accessories",
        "depth": 3,
        "jpName": "楽器アクセサリー"
      }
    ]
  },
  {
    "id": 2519,
    "name": "Cosmetics & Beauty",
    "jpName": "コスメ、美容、ヘアケア",
    "subcategories": [
      {
        "id": 1753,
        "name": "Skin Care Cream",
        "depth": 3,
        "jpName": "スキンケアクリーム"
      },
      {
        "id": 1767,
        "name": "Face Packs",
        "depth": 3,
        "jpName": "フェイス用パック"
      },
      {
        "id": 1769,
        "name": "Beauty Serum",
        "depth": 3,
        "jpName": "美容液"
      },
      {
        "id": 1774,
        "name": "Eye Shadow",
        "depth": 3,
        "jpName": "アイシャドウ"
      },
      {
        "id": 1775,
        "name": "Eyebrow",
        "depth": 3,
        "jpName": "アイブロウ"
      },
      {
        "id": 1777,
        "name": "Mascara",
        "depth": 3,
        "jpName": "マスカラ"
      },
      {
        "id": 1792,
        "name": "Concealer",
        "depth": 3,
        "jpName": "コンシーラー"
      },
      {
        "id": 1794,
        "name": "Face Color",
        "depth": 3,
        "jpName": "フェイスカラー"
      },
      {
        "id": 1798,
        "name": "Lipstick",
        "depth": 3,
        "jpName": "口紅"
      },
      {
        "id": 1800,
        "name": "Lip Gloss",
        "depth": 3,
        "jpName": "リップグロス"
      },
      {
        "id": 1805,
        "name": "Women's Perfume",
        "depth": 3,
        "jpName": "女性用香水、フレグランス"
      },
      {
        "id": 1807,
        "name": "Men's Perfume",
        "depth": 3,
        "jpName": "男性用香水、フレグランス"
      },
      {
        "id": 1834,
        "name": "Hair Shampoo",
        "depth": 3,
        "jpName": "ヘアシャンプー"
      },
      {
        "id": 1835,
        "name": "Hair Treatment",
        "depth": 3,
        "jpName": "トリートメント、ヘアパック"
      },
      {
        "id": 1988,
        "name": "Women's Shavers",
        "depth": 3,
        "jpName": "レディースシェーバー"
      },
      {
        "id": 1997,
        "name": "Hair Care, Scalp Care",
        "depth": 3,
        "jpName": "ヘアケア、頭皮ケア"
      },
      {
        "id": 38086,
        "name": "Men's Shavers",
        "depth": 3,
        "jpName": "メンズシェーバー"
      },
      {
        "id": 46351,
        "name": "Foundation",
        "depth": 3,
        "jpName": "ファンデーション"
      },
      {
        "id": 48903,
        "name": "Face Wash",
        "depth": 3,
        "jpName": "洗顔"
      }
    ]
  },
  {
    "id": 2520,
    "name": "Diet & Health",
    "jpName": "ダイエット、健康",
    "subcategories": [
      {
        "id": 1944,
        "name": "Low Frequency Therapy Devices",
        "depth": 3,
        "jpName": "低周波治療器"
      },
      {
        "id": 26382,
        "name": "Fitness Bikes",
        "depth": 3,
        "jpName": "フィットネスバイク"
      },
      {
        "id": 45899,
        "name": "Thermometers",
        "depth": 3,
        "jpName": "体温計"
      },
      {
        "id": 45906,
        "name": "Body Weight Scales",
        "depth": 3,
        "jpName": "体重計、体脂肪計、体組成計"
      },
      {
        "id": 45910,
        "name": "Blood Pressure Monitors",
        "depth": 3,
        "jpName": "血圧計"
      }
    ]
  },
  {
    "id": 2521,
    "name": "Baby, Kids & Maternity",
    "jpName": "ベビー、キッズ、マタニティ",
    "subcategories": [
      {
        "id": 43835,
        "name": "Baby Seats, Child Seats",
        "depth": 3,
        "jpName": "ベビーシート、チャイルドシート本体"
      }
    ]
  },
  {
    "id": 2522,
    "name": "Smartphones, Tablets & PC",
    "jpName": "スマホ、タブレット、パソコン",
    "subcategories": [
      {
        "id": 36497,
        "name": "Smart Watches",
        "depth": 3,
        "jpName": "スマートウォッチ本体"
      },
      {
        "id": 38347,
        "name": "Phone Cases, Covers",
        "depth": 3,
        "jpName": "スマホケース、カバー"
      },
      {
        "id": 38348,
        "name": "Phone Screen Protectors",
        "depth": 3,
        "jpName": "スマホ液晶保護フィルム"
      },
      {
        "id": 38351,
        "name": "Mobile Batteries",
        "depth": 3,
        "jpName": "モバイルバッテリー"
      },
      {
        "id": 38356,
        "name": "Phone, Tablet Chargers",
        "depth": 3,
        "jpName": "スマホ、タブレット充電器"
      }
    ]
  },
  {
    "id": 2524,
    "name": "TV, Audio & Cameras",
    "jpName": "テレビ、オーディオ、カメラ",
    "subcategories": [
      {
        "id": 21176,
        "name": "Projectors",
        "depth": 3,
        "jpName": "プロジェクター"
      },
      {
        "id": 49482,
        "name": "Earphones, Headphones",
        "depth": 3,
        "jpName": "イヤホン、ヘッドホン"
      },
      {
        "id": 49483,
        "name": "Audio Speakers",
        "depth": 3,
        "jpName": "スピーカー"
      },
      {
        "id": 49515,
        "name": "Blu-ray, DVD Recorders",
        "depth": 3,
        "jpName": "ブルーレイ、DVDレコーダー"
      },
      {
        "id": 49517,
        "name": "AV Cables",
        "depth": 3,
        "jpName": "AVケーブル"
      },
      {
        "id": 49518,
        "name": "AV Peripherals",
        "depth": 3,
        "jpName": "AV周辺機器"
      }
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
