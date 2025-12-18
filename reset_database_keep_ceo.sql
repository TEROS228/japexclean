-- ============================================
-- RESET DATABASE - Keep only CEO@gmail.com
-- ============================================
-- WARNING: This will DELETE ALL data except CEO@gmail.com account!
-- ============================================

DO $$
DECLARE
    ceo_id TEXT;
BEGIN
    -- Получаем ID CEO пользователя
    SELECT id INTO ceo_id FROM users WHERE email = 'CEO@gmail.com';

    IF ceo_id IS NULL THEN
        RAISE EXCEPTION 'CEO@gmail.com user not found! Please create this user first.';
    ELSE
        RAISE NOTICE 'CEO user found with ID: %', ceo_id;
    END IF;

    -- ============================================
    -- УДАЛЕНИЕ ДАННЫХ (сохраняем только CEO)
    -- ============================================

    RAISE NOTICE 'Starting database cleanup...';

    -- 1. Удаляем ВСЕ damaged_item_requests
    DELETE FROM damaged_item_requests;
    RAISE NOTICE 'Deleted ALL damaged_item_requests';

    -- 2. Удаляем ВСЕ compensation_requests
    DELETE FROM compensation_requests;
    RAISE NOTICE 'Deleted ALL compensation_requests';

    -- 3. Удаляем ВСЕ packages
    DELETE FROM packages;
    RAISE NOTICE 'Deleted ALL packages';

    -- 4. Удаляем ВСЕ order_items
    DELETE FROM order_items;
    RAISE NOTICE 'Deleted ALL order_items';

    -- 5. Удаляем ВСЕ orders
    DELETE FROM orders;
    RAISE NOTICE 'Deleted ALL orders';

    -- 6. Удаляем ВСЕ addresses
    DELETE FROM addresses;
    RAISE NOTICE 'Deleted ALL addresses';

    -- 7. Удаляем ВСЕ favourites
    DELETE FROM favourites;
    RAISE NOTICE 'Deleted ALL favourites';

    -- 8. Удаляем ВСЕ messages
    DELETE FROM messages;
    RAISE NOTICE 'Deleted ALL messages';

    -- 9. Удаляем ВСЕ notifications
    DELETE FROM notifications;
    RAISE NOTICE 'Deleted ALL notifications';

    -- 10. Удаляем ВСЕ transactions
    DELETE FROM transactions;
    RAISE NOTICE 'Deleted ALL transactions';

    -- 11. Удаляем всех пользователей кроме CEO
    DELETE FROM users WHERE email != 'CEO@gmail.com';
    RAISE NOTICE 'Deleted all users except CEO';

    -- 12. Удаляем весь кэш переводов (не связан с пользователями)
    DELETE FROM translation_cache;
    RAISE NOTICE 'Deleted translation_cache';

    -- ============================================
    -- ОБНОВЛЕНИЕ CEO АККАУНТА
    -- ============================================

    -- Обнуляем баланс CEO и обновляем данные
    UPDATE users
    SET
        balance = 0,
        "isAdmin" = true,
        name = 'CEO',
        "secondName" = NULL,
        "updatedAt" = NOW()
    WHERE email = 'CEO@gmail.com';

    RAISE NOTICE 'CEO account updated';

    -- ============================================
    -- СБРОС СЧЕТЧИКОВ
    -- ============================================

    -- Сбрасываем последний orderNumber на 0
    -- (следующий заказ будет #1)
    ALTER SEQUENCE IF EXISTS orders_ordernumber_seq RESTART WITH 1;
    RAISE NOTICE 'Reset orderNumber sequence';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE RESET COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Remaining user: CEO@gmail.com (Admin)';
    RAISE NOTICE 'Balance: 0';
    RAISE NOTICE '============================================';

END $$;

-- Финальная проверка
SELECT
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'OrderItems', COUNT(*) FROM order_items
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages
UNION ALL
SELECT 'Addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Favourites', COUNT(*) FROM favourites
UNION ALL
SELECT 'CompensationRequests', COUNT(*) FROM compensation_requests
UNION ALL
SELECT 'DamagedItemRequests', COUNT(*) FROM damaged_item_requests
UNION ALL
SELECT 'TranslationCache', COUNT(*) FROM translation_cache;
