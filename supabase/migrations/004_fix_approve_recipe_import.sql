-- =============================================
-- Migration 004: Fix approve_recipe_import unit/category/difficulty mapping
-- Gemini kan units teruggeven die niet in de check constraint passen
-- =============================================

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
    CASE WHEN recipe_data->>'difficulty' IN ('easy', 'medium') THEN recipe_data->>'difficulty' ELSE 'medium' END,
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
      -- Converteer kg/liter naar g/ml
      CASE
        WHEN LOWER(COALESCE(ing->>'unit', '')) IN ('kg', 'kilo') THEN (ing->>'amount')::NUMERIC * 1000
        WHEN LOWER(COALESCE(ing->>'unit', '')) IN ('l', 'liter') THEN (ing->>'amount')::NUMERIC * 1000
        ELSE (ing->>'amount')::NUMERIC
      END,
      -- Map unit naar toegestane waarden (g, ml, stuks, el, tl, snuf, plak, teen, tak, blik, zakje)
      CASE LOWER(COALESCE(ing->>'unit', ''))
        WHEN 'g' THEN 'g'
        WHEN 'gram' THEN 'g'
        WHEN 'kg' THEN 'g'
        WHEN 'kilo' THEN 'g'
        WHEN 'ml' THEN 'ml'
        WHEN 'l' THEN 'ml'
        WHEN 'liter' THEN 'ml'
        WHEN 'dl' THEN 'ml'
        WHEN 'el' THEN 'el'
        WHEN 'eetlepel' THEN 'el'
        WHEN 'eetlepels' THEN 'el'
        WHEN 'tl' THEN 'tl'
        WHEN 'theelepel' THEN 'tl'
        WHEN 'theelepels' THEN 'tl'
        WHEN 'stuks' THEN 'stuks'
        WHEN 'stuk' THEN 'stuks'
        WHEN 'snuf' THEN 'snuf'
        WHEN 'snufje' THEN 'snuf'
        WHEN 'plak' THEN 'plak'
        WHEN 'plakken' THEN 'plak'
        WHEN 'teen' THEN 'teen'
        WHEN 'tenen' THEN 'teen'
        WHEN 'tak' THEN 'tak'
        WHEN 'takken' THEN 'tak'
        WHEN 'takjes' THEN 'tak'
        WHEN 'blik' THEN 'blik'
        WHEN 'blikje' THEN 'blik'
        WHEN 'zakje' THEN 'zakje'
        WHEN 'zakjes' THEN 'zakje'
        WHEN '' THEN NULL
        ELSE NULL
      END,
      -- Map category naar toegestane waarden
      CASE LOWER(COALESCE(ing->>'category', 'overig'))
        WHEN 'groente' THEN 'groente'
        WHEN 'groenten' THEN 'groente'
        WHEN 'fruit' THEN 'fruit'
        WHEN 'vlees' THEN 'vlees'
        WHEN 'vis' THEN 'vis'
        WHEN 'zuivel' THEN 'zuivel'
        WHEN 'granen' THEN 'granen'
        WHEN 'kruiden' THEN 'kruiden'
        WHEN 'specerijen' THEN 'kruiden'
        ELSE 'overig'
      END,
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
