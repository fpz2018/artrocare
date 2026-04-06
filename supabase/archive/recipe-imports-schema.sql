-- Recipe Imports Pipeline Schema
-- Automatische import van recepten via Google Sheets URLs

-- 1. Tabel voor recept-imports
CREATE TABLE IF NOT EXISTS recipe_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fetching', 'extracted', 'approved', 'rejected', 'error')),
  title TEXT,
  raw_html TEXT,
  extracted_data JSONB,
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_imports_source_url ON recipe_imports(source_url);

ALTER TABLE recipe_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin beheert recipe imports" ON recipe_imports
  FOR ALL USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Service mag recipe imports inserten" ON recipe_imports
  FOR INSERT WITH CHECK (true);

-- 2. Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-images', 'recipe-images', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Iedereen kan recept-afbeeldingen zien" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');
CREATE POLICY "Service kan recept-afbeeldingen uploaden" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images');
CREATE POLICY "Admin kan recept-afbeeldingen verwijderen" ON storage.objects
  FOR DELETE USING (bucket_id = 'recipe-images'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 3. Approve functie
CREATE OR REPLACE FUNCTION approve_recipe_import(
  import_id UUID, admin_id UUID, edited_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  imp RECORD;
  recipe_data JSONB;
  new_recipe_id UUID;
  ing JSONB;
  i INTEGER := 0;
BEGIN
  SELECT * INTO imp FROM recipe_imports WHERE id = import_id AND status = 'extracted';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import niet gevonden of niet in status extracted: %', import_id;
  END IF;

  recipe_data := COALESCE(edited_data, imp.extracted_data);

  INSERT INTO recipes (
    title_nl, title_en, description_nl, description_en,
    instructions_nl, instructions_en,
    prep_time_minutes, cook_time_minutes, servings,
    difficulty, calories_per_serving, protein_g,
    image_url, tags, season, is_premium, sort_order
  ) VALUES (
    recipe_data->>'title_nl',
    COALESCE(recipe_data->>'title_en', recipe_data->>'title_nl'),
    recipe_data->>'description_nl',
    COALESCE(recipe_data->>'description_en', recipe_data->>'description_nl'),
    recipe_data->>'instructions_nl',
    COALESCE(recipe_data->>'instructions_en', recipe_data->>'instructions_nl'),
    (recipe_data->>'prep_time_minutes')::INTEGER,
    (recipe_data->>'cook_time_minutes')::INTEGER,
    COALESCE((recipe_data->>'servings')::INTEGER, 4),
    COALESCE(recipe_data->>'difficulty', 'medium'),
    (recipe_data->>'calories')::INTEGER,
    (recipe_data->>'protein_g')::NUMERIC,
    recipe_data->>'image_url',
    COALESCE(
      (SELECT array_agg(t) FROM jsonb_array_elements_text(recipe_data->'tags') t),
      ARRAY[]::TEXT[]
    ),
    COALESCE(recipe_data->>'season', 'all'),
    COALESCE((recipe_data->>'is_premium')::BOOLEAN, false),
    COALESCE((recipe_data->>'sort_order')::INTEGER, 0)
  ) RETURNING id INTO new_recipe_id;

  FOR ing IN SELECT * FROM jsonb_array_elements(COALESCE(recipe_data->'ingredients', '[]'::JSONB))
  LOOP
    INSERT INTO recipe_ingredients (recipe_id, name_nl, name_en, amount, unit, category, sort_order)
    VALUES (
      new_recipe_id,
      ing->>'name_nl',
      COALESCE(ing->>'name_en', ing->>'name_nl', ing->>'name'),
      (ing->>'amount')::NUMERIC,
      COALESCE(ing->>'unit', ''),
      COALESCE(ing->>'category', 'overig'),
      i
    );
    i := i + 1;
  END LOOP;

  UPDATE recipe_imports SET
    status = 'approved', approved_by = admin_id, approved_at = NOW(),
    recipe_id = new_recipe_id, updated_at = NOW()
  WHERE id = import_id;

  RETURN new_recipe_id;
END;
$$;
