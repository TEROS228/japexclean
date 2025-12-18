# План масштабирования для 100+ пользователей

## Текущее состояние
- ✅ VPS или локальный dev
- ✅ In-memory кеш (1 час)
- ✅ 5 одновременных Puppeteer
- ✅ Очередь + таймаут 20 сек

**Выдержит:** 30-50 одновременных пользователей

---

## Шаг 1: Добавить Redis (ПЕРЕД покупкой сервера!)

**Зачем:**
- Кеш НЕ сбрасывается при перезапуске
- Можно увеличить до 24 часов
- Несколько серверов могут использовать один кеш

**Установка:**
```bash
# 1. Установить Redis локально (для теста)
brew install redis  # Mac
sudo apt install redis  # Ubuntu

# 2. Запустить Redis
redis-server

# 3. Установить клиент
npm install ioredis
```

**Код (заменить в parse-variants.ts):**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const CACHE_TTL = 60 * 60 * 24; // 24 часа

// Вместо Map:
// const cache = new Map();

// Читать из кеша:
const cached = await redis.get(cacheKey);
if (cached) {
  return res.json(JSON.parse(cached));
}

// Записать в кеш:
await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
```

**Результат:**
- 80-90% запросов из Redis (мгновенно)
- Puppeteer нужен только для новых товаров

---

## Шаг 2: Выбрать хостинг для 100+ пользователей

### Вариант A: Hetzner VPS (рекомендую)

**Конфигурация:**
- CPX21: 3 vCPU, 4 GB RAM = €4.51/мес
- CPX31: 4 vCPU, 8 GB RAM = €11.90/мес

**Настройка:**
```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Установить Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Установить зависимости для Puppeteer
sudo apt-get install -y \
  chromium-browser \
  fonts-liberation \
  libnss3 \
  libxss1 \
  libasound2

# 4. Клонировать проект
git clone your-repo
cd japexclean
npm install
npm run build

# 5. Установить PM2 (автозапуск)
npm install -g pm2
pm2 start npm --name "japex" -- start
pm2 startup
pm2 save

# 6. Nginx (опционально, для HTTPS)
sudo apt install nginx certbot python3-certbot-nginx
```

**Стоимость:** €4.51-11.90/мес (~$5-13)

---

### Вариант B: Railway.app (если не хочешь настраивать)

**Преимущества:**
- Puppeteer работает из коробки
- Git push → автодеплой
- Логи и мониторинг

**Настройка:**
1. Зарегистрироваться на railway.app
2. Подключить GitHub репо
3. Добавить переменные окружения
4. Готово!

**Стоимость:** $10-20/мес

---

### Вариант C: DigitalOcean App Platform

**Преимущества:**
- Puppeteer поддерживается
- Легкое масштабирование
- Автобэкапы

**Минусы:**
- Дороже (~$12-25/мес)

---

## Шаг 3: Оптимизации для 500+ пользователей

### 1. Предзагрузка популярных товаров
```typescript
// Раз в час парсить топ-100 товаров
// cron job или setInterval
async function preloadPopularProducts() {
  const topProducts = await getTopProducts(); // из аналитики

  for (const product of topProducts) {
    // Запускаем парсинг в фоне
    parseRakutenVariants(product.url).catch(console.error);
    await sleep(2000); // Задержка между запросами
  }
}
```

### 2. Background jobs с BullMQ
```bash
npm install bullmq
```

```typescript
// Вместо синхронного парсинга при запросе:
// 1. Добавить задачу в очередь
await variantsQueue.add('parse', { url });

// 2. Вернуть пользователю "Loading..."
res.json({ success: true, loading: true });

// 3. Worker обрабатывает в фоне
// 4. WebSocket отправляет результат когда готово
```

### 3. CDN для статики
- Cloudflare (бесплатно)
- AWS CloudFront
- Images → Cloudinary или ImageKit

---

## Мониторинг

**Добавить метрики:**
```typescript
// pages/api/metrics.ts
export default function handler(req, res) {
  return res.json({
    activeConnections: activePuppeteerCount,
    cacheHitRate: (cacheHits / totalRequests * 100).toFixed(2),
    totalRequests,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
}
```

**UptimeRobot (бесплатный мониторинг):**
- Проверяет доступность сайта каждые 5 минут
- Отправляет алерты при падении

---

## Бюджет на разных этапах

| Пользователей | Хостинг | Redis | CDN | Итого/мес |
|---|---|---|---|---|
| 0-50 | Локально/Railway $5 | - | - | $5 |
| 50-100 | Hetzner VPS $5 | Встроенный | - | $5 |
| 100-300 | Hetzner VPS $13 | Встроенный | - | $13 |
| 300-500 | Hetzner $13 + Redis Cloud $10 | Redis Cloud | Cloudflare | $23 |
| 500+ | Hetzner 2x + Load Balancer | Redis Cloud | Cloudflare | $50+ |

---

## Когда что делать

### Сейчас (0-30 юзеров):
- ✅ Ничего не делать, текущие настройки ОК

### При 50+ юзерах:
1. ✅ Добавить Redis кеш
2. ✅ Арендовать Hetzner VPS ($5/мес)
3. ✅ Настроить PM2

### При 100+ юзерах:
1. ✅ Upgrade VPS до 4-8 GB RAM ($13/мес)
2. ✅ Предзагрузка популярных товаров
3. ✅ Добавить мониторинг (UptimeRobot)

### При 300+ юзерах:
1. ✅ Отдельный Redis Cloud ($10/мес)
2. ✅ CDN для картинок
3. ✅ Background jobs (BullMQ)

### При 500+ юзерах:
1. ✅ Несколько серверов + Load Balancer
2. ✅ Или переписать на Serverless + Queue
3. ✅ Или отказаться от Puppeteer полностью
