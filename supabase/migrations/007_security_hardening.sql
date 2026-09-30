-- =============================================
-- Migration 007: Security hardening
-- =============================================
-- Dicht de autorisatiegaten die uit de code-analyse van 30-09-2026 kwamen.
-- Alles is additief en herhaalbaar: de migratie kan zonder gegevensverlies
-- opnieuw worden gedraaid (DROP IF EXISTS / CREATE OR REPLACE).
--
-- Wat deze migratie doet:
--   1. De rol van een gebruiker kan niet meer door de client worden bepaald
--      (registratiemetadata, eigen profielupdate, uitnodigingsrij).
--   2. Uitnodigingstokens zijn niet meer publiek op te vragen.
--   3. De contentpijplijn accepteert geen anonieme inserts meer.
--   4. Beheerfuncties (SECURITY DEFINER) controleren zelf de rol.
--   5. De boodschappenlijst-functie gebruikt auth.uid() in plaats van een
--      meegegeven user_uuid (paywall-bypass).
--   6. Uploads naar de exercise-media bucket zijn beperkt tot beheerders.
--   7. Tabel voor Stripe-webhook-idempotentie.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PROFIELEN: rol en abonnement zijn niet client-bepaalbaar ─────────────
-- De policy "Eigen profiel aanpassen" staat alleen auth.uid() = id toe en
-- beperkt geen kolommen. Zonder deze trigger kan een patiënt zichzelf via
-- PostgREST op 'admin' of 'premium' zetten.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Anonieme clients hebben hier niets te zoeken.
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Niet geautoriseerd';
  END IF;

  -- Server-side context (trigger, service_role, directe DB-toegang): toestaan.
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Beheerders mogen alles.
  IF public.get_my_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Iedereen anders: deze velden blijven ongewijzigd.
  NEW.role               := OLD.role;
  NEW.subscription_tier  := OLD.subscription_tier;
  NEW.practice_id        := OLD.practice_id;
  NEW.therapist_id       := OLD.therapist_id;
  NEW.email              := OLD.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Een zelf aangemaakte profielrij mag nooit een bevoorrechte rol hebben.
-- (De trigger handle_new_user draait als table-owner en omzeilt RLS, dus
--  registratie blijft werken.)
DROP POLICY IF EXISTS "Eigen profiel aanmaken" ON public.profiles;
CREATE POLICY "Eigen profiel aanmaken" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
    AND role = 'patient'
    AND subscription_tier = 'free'
    AND practice_id IS NULL
    AND therapist_id IS NULL
  );

-- ─── 2. REGISTRATIE: rol komt nooit meer uit client-metadata ────────────────
-- raw_user_meta_data is door de client gevuld bij supabase.auth.signUp().
-- 'admin' uit metadata accepteren betekende zelfservice-beheerderschap.
-- De therapeut- en praktijkrollen lopen nu uitsluitend via een geldige,
-- openstaande uitnodiging voor hetzelfde e-mailadres.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_practice_id uuid;
  v_role        text;
  v_invite      RECORD;
  v_token       text;
  v_requested   text;
BEGIN
  v_requested := NEW.raw_user_meta_data->>'register_as';
  v_token     := NEW.raw_user_meta_data->>'invitation_token';

  -- Alleen 'patient' en 'practice_admin' zijn zonder uitnodiging toegestaan.
  -- 'practice_admin' is de zelfaanmelding van een praktijk: die krijgt status
  -- 'pending' en moet daarna door een beheerder worden goedgekeurd.
  -- 'admin' valt hier bewust buiten.
  v_role := CASE
    WHEN v_requested IN ('patient', 'practice_admin') THEN v_requested
    ELSE 'patient'
  END;

  -- Een uitnodiging is de enige route naar een therapeut- of praktijkrol.
  IF v_token IS NOT NULL AND length(v_token) >= 16 THEN
    SELECT i.role, i.practice_id
      INTO v_invite
      FROM public.invitations i
     WHERE i.token = v_token
       AND lower(i.email) = lower(NEW.email)
       AND i.status = 'pending'
       AND i.expires_at > NOW()
     LIMIT 1;

    IF FOUND THEN
      v_role        := v_invite.role;
      v_practice_id := v_invite.practice_id;
      UPDATE public.invitations
         SET status = 'accepted'
       WHERE token = v_token;
    END IF;
  END IF;

  IF v_role = 'practice_admin' THEN
    -- Zelfaanmelding van een praktijk: alleen een nieuwe praktijk aanmaken
    -- als er geen uitnodiging met een bestaande praktijk aan hing.
    IF v_practice_id IS NULL THEN
      INSERT INTO public.practices (name, city, address, postal_code, phone, email, website, status)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'practice_name', 'Onbekend'),
        COALESCE(NEW.raw_user_meta_data->>'practice_city', ''),
        COALESCE(NEW.raw_user_meta_data->>'practice_address', ''),
        COALESCE(NEW.raw_user_meta_data->>'practice_postal_code', ''),
        COALESCE(NEW.raw_user_meta_data->>'practice_phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'practice_email', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'practice_website', ''),
        'pending'
      )
      RETURNING id INTO v_practice_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, practice_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'practice_admin',
      v_practice_id
    );
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role, practice_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      v_role,
      v_practice_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 3. UITNODIGINGEN: niet meer publiek aan te maken of uit te lezen ───────
-- "Service mag uitnodiging aanmaken" had WITH CHECK (true) en gold daarmee
-- voor iedereen, inclusief anon. "Publiek: uitnodiging lezen via token" had
-- USING (true) en gaf elke bezoeker alle tokens, e-mailadressen en rollen.
DROP POLICY IF EXISTS "Service mag uitnodiging aanmaken" ON public.invitations;
DROP POLICY IF EXISTS "Publiek: uitnodiging lezen via token" ON public.invitations;
DROP POLICY IF EXISTS "Uitgenodigde ziet eigen uitnodiging" ON public.invitations;
DROP POLICY IF EXISTS "Uitnodiger beheert eigen uitnodigingen" ON public.invitations;

-- De uitnodiger beheert alleen zijn eigen rijen, en mag alleen rollen
-- uitdelen die bij zijn eigen rol passen.
CREATE POLICY "Uitnodiger beheert eigen uitnodigingen" ON public.invitations
  FOR ALL
  USING (invited_by = auth.uid() OR public.get_my_role() = 'admin')
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      (public.get_my_role() = 'therapist'      AND role = 'patient')
      OR (public.get_my_role() = 'practice_admin' AND role IN ('therapist', 'patient'))
      OR public.get_my_role() = 'admin'
    )
    AND (
      practice_id IS NULL
      OR public.get_my_role() = 'admin'
      OR practice_id = public.get_my_practice_id()
    )
  );

-- Het acceptatiescherm leest de uitnodiging via deze functie in plaats van
-- via een publieke SELECT. De functie geeft alleen de velden terug die het
-- scherm nodig heeft, en alleen bij een openstaande, niet-verlopen uitnodiging.
-- Die twee voorwaarden staan in de query zelf: een verlopen of al geaccepteerd
-- token hoort geen e-mailadres, rol of praktijk meer terug te geven.
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id            UUID,
  email         TEXT,
  role          TEXT,
  practice_id   UUID,
  practice_name TEXT,
  practice_city TEXT,
  status        TEXT,
  expires_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Tokens zijn 64 hex-tekens; korte waarden blokkeren we vooraf.
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT i.id, i.email, i.role, i.practice_id,
           p.name, p.city, i.status, i.expires_at
      FROM public.invitations i
      LEFT JOIN public.practices p ON p.id = i.practice_id
     WHERE i.token = p_token
       AND i.status = 'pending'
       AND i.expires_at > NOW()
     LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;

-- ─── 4. CONTENTPIJPLIJN: geen anonieme inserts meer ─────────────────────────
-- Vier policies met WITH CHECK (true) gaven elke bezoeker insertrechten op
-- de inhoudelijke redactiewachtrij. De beheerders-policies blijven staan;
-- de Netlify-functions en Edge Functions werken met de service-role en
-- omzeilen RLS, dus die blijven functioneren.
DROP POLICY IF EXISTS "Service mag papers inserten"    ON public.research_papers;
DROP POLICY IF EXISTS "Service mag fetchlog inserten"  ON public.research_fetch_log;
DROP POLICY IF EXISTS "Service mag source inserten"    ON public.content_sources;
DROP POLICY IF EXISTS "Service mag voorstel inserten"  ON public.content_proposals;

-- ─── 5. PATIËNTVERZOEKEN: geen zelftoewijzing van therapeut of praktijk ─────
DROP POLICY IF EXISTS "Iedereen kan verzoek indienen" ON public.patient_requests;
CREATE POLICY "Iedereen kan verzoek indienen" ON public.patient_requests
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND patient_id IS NULL
    AND therapist_id IS NULL
    AND practice_id IS NULL
    AND length(COALESCE(full_name, '')) BETWEEN 2 AND 200
    AND length(COALESCE(email, ''))     BETWEEN 5 AND 254
  );

-- ─── 6. BEHEERFUNCTIES CONTROLEREN ZELF DE ROL ──────────────────────────────
-- SECURITY DEFINER + de standaard EXECUTE-grant voor PUBLIC betekende dat
-- elke bezoeker deze functies via /rest/v1/rpc/ kon aanroepen.

CREATE OR REPLACE FUNCTION public.apply_content_proposal(proposal_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  prop         RECORD;
  col          TEXT;
  val          JSONB;
  set_clauses  TEXT[] := '{}';
  allowed_cols TEXT[];
BEGIN
  IF NOT (auth.role() = 'service_role' OR public.get_my_role() = 'admin') THEN
    RAISE EXCEPTION 'Alleen beheerders mogen een voorstel toepassen';
  END IF;

  SELECT * INTO prop FROM content_proposals WHERE id = proposal_id AND status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Voorstel niet gevonden of niet goedgekeurd: %', proposal_id; END IF;

  IF prop.target_table = 'supplements' THEN
    allowed_cols := ARRAY['name_nl','name_en','description_nl','description_en',
      'dosage_nl','dosage_en','timing_nl','timing_en','benefits_nl','benefits_en',
      'interactions_nl','interactions_en','contraindications_nl','contraindications_en',
      'evidence_level','category','is_premium','safety_notes_nl','safety_notes_en'];
  ELSIF prop.target_table = 'exercises' THEN
    allowed_cols := ARRAY['title_nl','title_en','description_nl','description_en',
      'instructions_nl','instructions_en','focus_points_nl','focus_points_en',
      'circle','level','sets','reps','duration_minutes','has_video','video_url','image_url','is_nemex','sort_order'];
  ELSIF prop.target_table = 'lessons' THEN
    allowed_cols := ARRAY['title_nl','title_en','content_nl','content_en',
      'summary_nl','summary_en','key_takeaways_nl','key_takeaways_en',
      'category','is_premium','sort_order','duration_minutes','icon'];
  ELSE
    RAISE EXCEPTION 'Onbekende target_table: %', prop.target_table;
  END IF;

  FOR col, val IN SELECT * FROM jsonb_each(prop.proposed_values) LOOP
    IF col = ANY(allowed_cols) THEN
      IF jsonb_typeof(val) = 'array' THEN
        set_clauses := array_append(set_clauses,
          format('%I = (SELECT array_agg(v) FROM jsonb_array_elements_text(%L::jsonb) t(v))',
                 col, val::text));
      ELSE
        set_clauses := array_append(set_clauses, format('%I = %L', col, val #>> '{}'));
      END IF;
    END IF;
  END LOOP;

  IF array_length(set_clauses, 1) IS NULL THEN
    RAISE EXCEPTION 'Geen geldige kolommen in proposed_values';
  END IF;

  IF prop.target_record_id IS NOT NULL THEN
    EXECUTE format('UPDATE public.%I SET %s, updated_at = NOW() WHERE id = %L',
      prop.target_table, array_to_string(set_clauses, ', '), prop.target_record_id);
    UPDATE content_proposals SET status='applied', applied_at=NOW(), updated_at=NOW() WHERE id=proposal_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_content_proposal(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_content_proposal(UUID) TO authenticated;

-- ─── 7. BOODSCHAPPENLIJST: auth.uid() in plaats van een parameter ───────────
-- De functie keek naar het abonnement van de meegegeven user_uuid, waardoor
-- een gratis gebruiker premium-ingrediënten kon opvragen met een willekeurig
-- UUID. De oude twee-argumentversie wordt verwijderd.
CREATE OR REPLACE FUNCTION public.generate_shopping_list(p_week INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_uid  UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;

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
    WHERE r.week_number = p_week
      AND (r.is_premium = false OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_uid AND p.subscription_tier IN ('premium', 'practice')
      ))
    GROUP BY ri.name_nl, ri.unit, ri.category
  ) grouped;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

DROP FUNCTION IF EXISTS public.generate_shopping_list(UUID, INT);
REVOKE ALL ON FUNCTION public.generate_shopping_list(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_shopping_list(INT) TO authenticated;

-- ─── 8. APPROVE_RECIPE_IMPORT: rolcheck en juiste goedkeurder ──────────────
-- De functie nam admin_id als parameter en controleerde niets. Elke bezoeker
-- kon via /rest/v1/rpc/approve_recipe_import zelf recepten in de app zetten.
CREATE OR REPLACE FUNCTION public.approve_recipe_import(
  import_id UUID, admin_id UUID, edited_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  imp RECORD;
  recipe_data JSONB;
  new_recipe_id UUID;
  ing JSONB;
  i INTEGER := 0;
  v_admin UUID;
BEGIN
  IF NOT (auth.role() = 'service_role' OR public.get_my_role() = 'admin') THEN
    RAISE EXCEPTION 'Alleen beheerders mogen een receptimport goedkeuren';
  END IF;

  -- De meegegeven admin_id wordt niet vertrouwd: de goedkeurder is de
  -- ingelogde gebruiker (of de meegegeven waarde bij een service-role-call).
  v_admin := COALESCE(auth.uid(), admin_id);

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
    status = 'approved', approved_by = v_admin, approved_at = NOW(),
    recipe_id = new_recipe_id, updated_at = NOW()
  WHERE id = import_id;

  RETURN new_recipe_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_recipe_import(UUID, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_recipe_import(UUID, UUID, JSONB) TO authenticated;

-- ─── 9. STORAGE: uploads naar exercise-media alleen door beheerders ─────────
DROP POLICY IF EXISTS "Ingelogde users kunnen exercise-media uploaden" ON storage.objects;
CREATE POLICY "Beheerders kunnen exercise-media uploaden" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exercise-media' AND public.get_my_role() = 'admin'
  );

-- ─── 10. STRIPE-WEBHOOK: idempotentie ───────────────────────────────────────
-- Stripe kan events opnieuw afleveren. Zonder deduplicatie wordt het
-- programmastart opnieuw gezet en loopt de begeleiding uit de pas.
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           TEXT PRIMARY KEY,
  type         TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Geen policies: alleen de service-role (bypasst RLS) komt hierbij.
REVOKE ALL ON public.stripe_events FROM anon, authenticated;
GRANT ALL ON public.stripe_events TO service_role;

-- ─── 11. OVERIGE OPEN POLICIES UIT EERDERE SCHEMA'S ────────────────────────
-- Deze tabellen komen uit de archiefbestanden (recipe-imports, research,
-- proposals). In een database waarin die bestanden zijn toegepast, staan deze
-- policies nog open. De Netlify-functions en Edge Functions werken met de
-- service-role en omzeilen RLS, dus zij blijven functioneren.

DO $$
BEGIN
  IF to_regclass('public.recipe_imports') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service mag recipe imports inserten" ON public.recipe_imports';
  END IF;
END $$;

DROP POLICY IF EXISTS "System can insert research papers"  ON public.research_papers;
DROP POLICY IF EXISTS "System can insert fetch log"        ON public.research_fetch_log;
DROP POLICY IF EXISTS "Service can insert content sources" ON public.content_sources;
DROP POLICY IF EXISTS "Service can insert proposals"       ON public.content_proposals;

-- De publieke aanmelding van een praktijk mag alleen een rij in status
-- 'pending' opleveren. Zonder die beperking kon iemand een praktijk invoeren
-- die zichzelf al goedgekeurd had en zo in de openbare praktijklijst komen.
DROP POLICY IF EXISTS "Nieuwe praktijk aanmelden" ON public.practices;
CREATE POLICY "Nieuwe praktijk aanmelden" ON public.practices
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND approved_by IS NULL
    AND approved_at IS NULL
    AND rejected_reason IS NULL
    AND length(COALESCE(name, '')) BETWEEN 2 AND 200
  );

-- Uploads naar de publieke afbeeldingsbucket alleen door beheerders.
DROP POLICY IF EXISTS "Service kan recept-afbeeldingen uploaden" ON storage.objects;
CREATE POLICY "Beheerders kunnen recept-afbeeldingen uploaden" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' AND public.get_my_role() = 'admin'
  );

-- ─── Controle ───────────────────────────────────────────────────────────────
-- Na het draaien van deze migratie zou dit geen rijen meer mogen geven:
--   SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname = 'public' AND qual = 'true' AND cmd IN ('INSERT','ALL');
SELECT 'security hardening 007 toegepast' AS resultaat;
