-- =============================================
-- Migration 003: Recipes & Shopping Lists
-- Recepten, ingrediënten en boodschappenlijsten
-- =============================================

-- ─── RECIPES ────────────────────────────────────────────────────────────────

CREATE TABLE public.recipes (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_nl             TEXT NOT NULL,
  title_en             TEXT NOT NULL,
  description_nl       TEXT,
  description_en       TEXT,
  instructions_nl      TEXT,
  instructions_en      TEXT,
  prep_time_minutes    INT,
  cook_time_minutes    INT,
  servings             INT NOT NULL DEFAULT 2,
  difficulty           TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium')),
  calories_per_serving INT,
  protein_g            NUMERIC,
  image_url            TEXT,
  tags                 TEXT[] DEFAULT '{}',
  season               TEXT NOT NULL CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all')) DEFAULT 'all',
  week_number          INT CHECK (week_number IS NULL OR week_number BETWEEN 1 AND 12),
  is_premium           BOOLEAN NOT NULL DEFAULT false,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECIPE_INGREDIENTS ─────────────────────────────────────────────────────

CREATE TABLE public.recipe_ingredients (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id   UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name_nl     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  amount      NUMERIC,
  unit        TEXT CHECK (unit IN ('g', 'ml', 'stuks', 'el', 'tl', 'snuf', 'plak', 'teen', 'tak', 'blik', 'zakje')),
  category    TEXT NOT NULL CHECK (category IN ('groente', 'fruit', 'vlees', 'vis', 'zuivel', 'granen', 'kruiden', 'overig')),
  sort_order  INT NOT NULL DEFAULT 0
);

-- ─── SHOPPING_LISTS ─────────────────────────────────────────────────────────

CREATE TABLE public.shopping_lists (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  items       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, week_start)
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX idx_recipes_week ON public.recipes(week_number);
CREATE INDEX idx_recipes_season ON public.recipes(season);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN(tags);
CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- recipes: leesbaar voor alle ingelogde users, CRUD alleen admin

CREATE POLICY "recipes_select"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "recipes_admin_insert"
  ON public.recipes FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "recipes_admin_update"
  ON public.recipes FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "recipes_admin_delete"
  ON public.recipes FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- recipe_ingredients: leesbaar voor alle ingelogde users, CRUD alleen admin

CREATE POLICY "recipe_ingredients_select"
  ON public.recipe_ingredients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "recipe_ingredients_admin_insert"
  ON public.recipe_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "recipe_ingredients_admin_update"
  ON public.recipe_ingredients FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "recipe_ingredients_admin_delete"
  ON public.recipe_ingredients FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- shopping_lists: alleen eigen data

CREATE POLICY "shopping_lists_select"
  ON public.shopping_lists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "shopping_lists_insert"
  ON public.shopping_lists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shopping_lists_update"
  ON public.shopping_lists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shopping_lists_delete"
  ON public.shopping_lists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- ─── FUNCTION: generate_shopping_list ───────────────────────────────────────
-- Haalt alle ingrediënten op voor recepten van een bepaalde week,
-- groepeert per category, en telt amounts op waar naam+unit gelijk zijn.

CREATE OR REPLACE FUNCTION public.generate_shopping_list(user_uuid UUID, week_int INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', name_nl,
      'amount', total_amount,
      'unit', unit,
      'category', category,
      'checked', false
    )
    ORDER BY category, name_nl
  )
  INTO result
  FROM (
    SELECT
      ri.name_nl,
      ri.unit,
      ri.category,
      SUM(ri.amount) AS total_amount
    FROM public.recipe_ingredients ri
    JOIN public.recipes r ON r.id = ri.recipe_id
    WHERE r.week_number = week_int
      AND (r.is_premium = false OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = user_uuid AND p.subscription_tier IN ('premium', 'practice')
      ))
    GROUP BY ri.name_nl, ri.unit, ri.category
  ) grouped;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ─── GRANTS ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.recipes TO authenticated;
GRANT SELECT ON public.recipe_ingredients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recipe_ingredients TO authenticated;
