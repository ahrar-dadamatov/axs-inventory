-- Инструкция: Скопируйте весь этот код и вставьте в SQL Editor в вашем проекте Supabase, затем нажмите RUN.

-- 1. Создаем таблицу филиалов
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем базовые филиалы (можете добавить свои)
INSERT INTO branches (name) VALUES ('Алматы'), ('Астана'), ('Шымкент');

-- 2. Создаем перечисление ролей
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- 3. Создаем таблицу профилей (связана с авторизацией)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'employee',
    branch_id UUID REFERENCES branches(id),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создаем таблицу инвентаря
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    usage_location TEXT, -- Где используется
    image_url TEXT,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Включаем RLS (Row Level Security)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 6. Настраиваем политики безопасности (Policies)

-- Филиалы: читать могут все авторизованные
CREATE POLICY "Branches are viewable by all authenticated users" ON branches
    FOR SELECT USING (auth.role() = 'authenticated');

-- Функция для проверки, является ли текущий пользователь админом (SECURITY DEFINER обходит RLS, избегая рекурсии)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Профили: 
-- Админ может читать и обновлять все профили.
-- Пользователь может читать только свой профиль.
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update profiles" ON profiles
    FOR UPDATE USING (public.is_admin());

-- Инвентарь:
-- Админ видит и редактирует всё.
-- Пользователь видит и добавляет только для своего филиала, только если он подтвержден.
CREATE POLICY "Admins can do everything on inventory" ON inventory_items
    FOR ALL USING (public.is_admin());

CREATE POLICY "Approved employees can view their branch inventory" ON inventory_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND branch_id = inventory_items.branch_id AND is_approved = TRUE)
    );

CREATE POLICY "Approved employees can insert into their branch" ON inventory_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND branch_id = inventory_items.branch_id AND is_approved = TRUE)
    );

-- 7. Автоматическое создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT count(*) = 0 INTO is_first_user FROM public.profiles;
  
  INSERT INTO public.profiles (id, email, role, is_approved)
  VALUES (
      new.id, 
      new.email, 
      CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'employee'::user_role END,
      CASE WHEN is_first_user THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Создание бакета для хранения изображений
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory_images', 'inventory_images', true);

-- Политики для хранилища изображений
CREATE POLICY "Images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'inventory_images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');
