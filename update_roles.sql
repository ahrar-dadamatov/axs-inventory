-- Добавляем новую роль в ENUM (если её ещё нет)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'boss';

-- Обновляем политики для таблицы профилей (чтобы босс видел всех пользователей)
CREATE POLICY "Boss can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'boss'
        )
    );

-- Обновляем политики для таблицы инвентаря (чтобы босс видел всё и мог добавлять)
CREATE POLICY "Boss can view all inventory" ON inventory_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'boss'
        )
    );

CREATE POLICY "Boss can insert inventory" ON inventory_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'boss'
        )
    );
