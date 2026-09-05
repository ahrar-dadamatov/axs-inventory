-- 1. Добавляем колонку code в таблицу branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS code TEXT;

-- Обновляем коды для существующих филиалов
UPDATE branches SET code = 'ALM' WHERE name = 'Алматы';
UPDATE branches SET code = 'AST' WHERE name = 'Астана';
UPDATE branches SET code = 'SHY' WHERE name = 'Шымкент';

-- 2. Создаем таблицу companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем компании AURA и GREENLIGHT
INSERT INTO companies (name, code) VALUES 
('AURA', '01'), 
('GREENLIGHT', '02')
ON CONFLICT (name) DO NOTHING;

-- 3. Создаем таблицу categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем базовые категории
INSERT INTO categories (name, code) VALUES 
('Мебель', '01'),
('Компьютерная техника', '02'),
('Оргтехника', '03'),
('Бытовая техника', '04'),
('Инструменты', '05'),
('Канцтовары', '06')
ON CONFLICT (name) DO NOTHING;

-- 4. Добавляем связи в inventory_items
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Убедимся, что колонка inventory_number существует
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS inventory_number TEXT;

-- Включаем RLS для новых таблиц (чтобы пользователи могли их читать)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики, если они есть (чтобы не было ошибок при повторном запуске)
DROP POLICY IF EXISTS "Companies viewable by all authenticated users" ON companies;
DROP POLICY IF EXISTS "Categories viewable by all authenticated users" ON categories;

CREATE POLICY "Companies viewable by all authenticated users" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Categories viewable by all authenticated users" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Триггер для автоматической генерации инвентарного номера
CREATE OR REPLACE FUNCTION generate_inventory_number()
RETURNS trigger AS $$
DECLARE
    branch_code TEXT;
    company_code TEXT;
    category_code TEXT;
    next_seq INTEGER;
    formatted_seq TEXT;
BEGIN
    -- Получаем коды для формирования номера
    SELECT code INTO branch_code FROM branches WHERE id = NEW.branch_id;
    SELECT code INTO company_code FROM companies WHERE id = NEW.company_id;
    SELECT code INTO category_code FROM categories WHERE id = NEW.category_id;
    
    -- Проверяем, что все коды существуют (если нет, ставим дефолтные значения)
    IF branch_code IS NULL THEN branch_code := 'XXX'; END IF;
    IF company_code IS NULL THEN company_code := '00'; END IF;
    IF category_code IS NULL THEN category_code := '00'; END IF;

    -- Ищем максимальный порядковый номер в этой категории
    -- Мы извлекаем последние цифры из строки формата XXX-00-00-001
    SELECT COALESCE(MAX(SUBSTRING(inventory_number FROM '[0-9]+$')::INTEGER), 0) + 1 INTO next_seq
    FROM inventory_items
    WHERE category_id = NEW.category_id 
      AND inventory_number IS NOT NULL
      AND inventory_number LIKE '%-%-%-%';
    
    -- Форматируем номер с ведущими нулями (например 001, 012, 125)
    formatted_seq := lpad(next_seq::text, 3, '0');
    
    -- Собираем полный номер
    NEW.inventory_number := branch_code || '-' || company_code || '-' || category_code || '-' || formatted_seq;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер, если он был (для безопасности)
DROP TRIGGER IF EXISTS trg_generate_inventory_number ON inventory_items;

-- Создаем триггер, который срабатывает ДО вставки
CREATE TRIGGER trg_generate_inventory_number
BEFORE INSERT ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION generate_inventory_number();
