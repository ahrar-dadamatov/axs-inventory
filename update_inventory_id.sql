-- Добавляем новую колонку inventory_number
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS inventory_number TEXT;
