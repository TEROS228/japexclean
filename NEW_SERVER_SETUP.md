# Настройка нового сервера (US West)

## Информация о сервере
- **IP:** 154.12.247.109
- **Локация:** US West
- **Цель:** Решение проблемы с Yahoo Shopping API geo-blocking

## Шаг 1: Первоначальная настройка сервера

Запустите скрипт для установки всех зависимостей:

```bash
./setup-server.sh
```

Этот скрипт установит:
- Node.js 20.x
- PostgreSQL
- PM2 (process manager)
- Создаст базу данных `japexclean_db`
- Настроит firewall

## Шаг 2: Копирование .env файла на сервер

```bash
scp .env.production.full root@154.12.247.109:/var/www/japexclean/.env
```

## Шаг 3: Деплой приложения

```bash
./deploy.sh
```

## Шаг 4: Применение миграций базы данных (если нужно)

Если база данных пустая, нужно применить все миграции:

```bash
ssh root@154.12.247.109
cd /var/www/japexclean
npx prisma migrate deploy
```

## Шаг 5: Запуск приложения

```bash
ssh root@154.12.247.109
cd /var/www/japexclean
pm2 start npm --name "japexclean" -- start
pm2 save
pm2 startup
```

## Проверка работы

После деплоя сайт будет доступен по адресу:
- http://154.12.247.109:3000

## Перенос данных со старого сервера (если нужно)

### 1. Экспорт данных со старого сервера (194.163.170.126)

```bash
ssh root@194.163.170.126
pg_dump -U japexclean "japex clean_db" > /tmp/japexclean_backup.sql
exit

# Скачать на локальный компьютер
scp root@194.163.170.126:/tmp/japexclean_backup.sql ./
```

### 2. Импорт на новый сервер (85.239.237.155)

```bash
# Загрузить на новый сервер
scp ./japexclean_backup.sql root@154.12.247.109:/tmp/

# Импортировать
ssh root@154.12.247.109
PGPASSWORD=Zzllqqppwwaa937 psql -U japexclean japexclean_db < /tmp/japexclean_backup.sql
```

### 3. Перенос файлов uploads

```bash
# Со старого сервера на локальный
scp -r root@194.163.170.126:/var/www/japexclean/public/uploads ./uploads_backup

# С локального на новый сервер
scp -r ./uploads_backup root@154.12.247.109:/var/www/japexclean/public/uploads
```

## Полезные команды

### Проверка статуса приложения
```bash
ssh root@154.12.247.109
pm2 status
pm2 logs japexclean
```

### Проверка базы данных
```bash
ssh root@154.12.247.109
PGPASSWORD=Zzllqqppwwaa937 psql -U japexclean japexclean_db
\dt  # список таблиц
\q   # выход
```

### Перезапуск приложения
```bash
ssh root@154.12.247.109
pm2 restart japexclean
```

### Просмотр логов
```bash
ssh root@154.12.247.109
pm2 logs japexclean --lines 100
```

## Настройка домена (опционально)

Если у вас есть домен, настройте DNS A-record:
- **Type:** A
- **Name:** @ (или subdomain)
- **Value:** 154.12.247.109

Затем настройте Nginx для работы с доменом:

```bash
ssh root@154.12.247.109
apt-get install -y nginx certbot python3-certbot-nginx

# Создать конфиг
nano /etc/nginx/sites-available/japexclean
```

Содержимое конфига:
```nginx
server {
    listen 80;
    server_name ваш-домен.com www.ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/japexclean /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Установить SSL
certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

## Проблемы и решения

### Приложение не запускается
```bash
pm2 logs japexclean --err
```

### База данных недоступна
```bash
systemctl status postgresql
systemctl restart postgresql
```

### Порт 3000 занят
```bash
lsof -ti:3000 | xargs kill -9
pm2 restart japexclean
```
