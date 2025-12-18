-- Добавить поля bankName и swiftCode в таблицу compensation_requests
ALTER TABLE compensation_requests
ADD COLUMN "bankName" TEXT,
ADD COLUMN "swiftCode" TEXT;
