# Yahoo Shopping API - Настройка и использование

## Настройка

### 1. Получение Client ID (App ID)

1. Зарегистрируйтесь на [Yahoo! JAPAN Developer Network](https://e.developer.yahoo.co.jp/)
2. Создайте новое приложение
3. Получите **Client ID** (App ID)

### 2. Добавление App ID в проект

Откройте файл `.env.local` и замените `YOUR_CLIENT_ID` на ваш реальный Client ID:

```env
NEXT_PUBLIC_YAHOO_APP_ID=ваш_реальный_client_id
```

## API Endpoints

### 1. Поиск товаров

**Endpoint:** `/api/yahoo/search`

**Параметры:**
- `keyword` (обязательный) - поисковый запрос
- `page` (опциональный) - номер страницы (default: 1)
- `sort` (опциональный) - сортировка: `lowest`, `highest`, `rating`, `popular`

**Пример:**
```
GET /api/yahoo/search?keyword=商品名&page=1&sort=lowest
```

### 2. Товары по категории

**Endpoint:** `/api/yahoo/products`

**Параметры:**
- `categoryId` (обязательный) - ID категории Yahoo Shopping
- `page` (опциональный) - номер страницы (default: 1)
- `sort` (опциональный) - сортировка

**Пример:**
```
GET /api/yahoo/products?categoryId=2498&page=1
```

## Использование в коде

### Поиск товаров

```typescript
import { searchYahooProducts } from '@/lib/yahoo-shopping';

const products = await searchYahooProducts('スニーカー', 1, 20, '+price');
```

### Получение товаров по категории

```typescript
import { getYahooProductsByCategory } from '@/lib/yahoo-shopping';

const products = await getYahooProductsByCategory(2498, 1, 20, '-review');
```

### Конвертация в формат Rakuten

```typescript
import { convertYahooToRakutenFormat } from '@/lib/yahoo-shopping';

const rakutenFormat = yahooProducts.map(convertYahooToRakutenFormat);
```

## Сортировка

| Rakuten Sort | Yahoo Sort | Описание |
|--------------|------------|----------|
| `lowest` | `+price` | По возрастанию цены |
| `highest` | `-price` | По убыванию цены |
| `rating` | `-review` | По рейтингу |
| `popular` | `-sold` | По популярности (продажам) |
| (default) | `-score` | По релевантности |

## Структура данных

### Yahoo Product

```typescript
interface YahooProduct {
  name: string;           // Название товара
  price: number;          // Цена
  url: string;            // Ссылка на товар
  image: {
    small: string;
    medium: string;
  };
  review: {
    count: number;        // Количество отзывов
    rate: number;         // Средний рейтинг
  };
  seller: {
    name: string;         // Название магазина
    sellerId: string;     // ID продавца
  };
  genreCategory: {
    id: number;           // ID категории
    name: string;         // Название категории
  };
  inStock: boolean;       // В наличии
  shipping: {
    code: number;
    name: string;         // "送料無料" = бесплатная доставка
  };
}
```

## Примеры категорий Yahoo Shopping

| Категория | ID |
|-----------|-----|
| Продукты питания | 2498 |
| Мужская мода | 2495 |
| Женская мода | 2494 |
| Спорт и отдых | 2512 |
| Электроника | 2505 |
| Автомобили | 2514 |

## Тестирование API

Вы можете протестировать API прямо в браузере:

```
https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=ВАШ_APP_ID&query=商品名
```

## Ограничения

- До 1000 запросов в день (для бесплатного плана)
- Максимум 100 результатов за один запрос
- Рекомендуется кэшировать результаты

## Интеграция с существующим кодом

Благодаря функции `convertYahooToRakutenFormat()`, товары Yahoo Shopping автоматически конвертируются в формат Rakuten, что позволяет использовать их с существующими компонентами без изменений.
