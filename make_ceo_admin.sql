-- Сделать CEO@gmail.com администратором
UPDATE users
SET "isAdmin" = true
WHERE email = 'CEO@gmail.com';
