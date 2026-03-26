-- =============================================
-- Artrocare Platform - Volledig Schema
-- CLEAN INSTALL: verwijdert alles en bouwt opnieuw op
-- Versie 2.0 - Vier-rollen platformarchitectuur
-- =============================================

-- ─── Bestaande objecten verwijderen ──────────────────────────────────────────

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_email() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_practice_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_therapist_id() CASCADE;
DROP FUNCTION IF EXISTS public.apply_content_proposal(UUID) CASCADE;

DROP TABLE IF EXISTS public.content_proposals CASCADE;
DROP TABLE IF EXISTS public.content_sources CASCADE;
DROP TABLE IF EXISTS public.research_fetch_log CASCADE;
DROP TABLE IF EXISTS public.research_insights CASCADE;
DROP TABLE IF EXISTS public.research_queries CASCADE;
DROP TABLE IF EXISTS public.research_papers CASCADE;
DROP TABLE IF EXISTS public.medication_logs CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.measurements CASCADE;
DROP TABLE IF EXISTS public.supplements CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.patient_requests CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.practices CASCADE;

DROP INDEX IF EXISTS public.idx_measurements_user_date;
DROP INDEX IF EXISTS public.idx_measurements_user_created;
DROP INDEX IF EXISTS public.idx_medications_user;
DROP INDEX IF EXISTS public.idx_medication_logs_user_date;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_practice;
DROP INDEX IF EXISTS public.idx_profiles_therapist;
DROP INDEX IF EXISTS public.idx_practices_status;
DROP INDEX IF EXISTS public.idx_invitations_token;
DROP INDEX IF EXISTS public.idx_invitations_email;
DROP INDEX IF EXISTS public.idx_patient_requests_status;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SECURITY DEFINER helpers ─────────────────────────────────────────────────
-- Geschreven in plpgsql (niet inlinable) zodat SECURITY DEFINER altijd
-- gerespecteerd wordt door de query planner → geen oneindige recursie in RLS.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public
AS $$
DECLARE v TEXT;
BEGIN SELECT role INTO v FROM profiles WHERE id = auth.uid(); RETURN v; END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_practice_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public
AS $$
DECLARE v UUID;
BEGIN SELECT practice_id INTO v FROM profiles WHERE id = auth.uid(); RETURN v; END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_therapist_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public
AS $$
DECLARE v UUID;
BEGIN SELECT therapist_id INTO v FROM profiles WHERE id = auth.uid(); RETURN v; END;
$$;

-- ─── PRACTICES ────────────────────────────────────────────────────────────────

CREATE TABLE public.practices (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  city         TEXT,
  address      TEXT,
  postal_code  TEXT,
  phone        TEXT,
  email        TEXT,
  website      TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by  UUID REFERENCES auth.users(id),
  approved_at  TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                TEXT,
  full_name            TEXT,
  language             TEXT DEFAULT 'nl' CHECK (language IN ('nl', 'en')),

  -- Rol in het platform
  role                 TEXT DEFAULT 'patient'
                         CHECK (role IN ('patient', 'therapist', 'practice_admin', 'admin')),

  -- Praktijk/therapeut koppeling
  practice_id          UUID REFERENCES public.practices(id) ON DELETE SET NULL,
  therapist_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Abonnement
  subscription_tier    TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'practice')),

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,

  -- Artrose-specifiek (patiënten)
  arthrosis_stage      TEXT CHECK (arthrosis_stage IN ('early', 'moderate', 'advanced', 'pre_op')),
  affected_joints      TEXT[] DEFAULT '{}',
  on_replacement_waitlist BOOLEAN DEFAULT false,
  goals                TEXT[] DEFAULT '{}',
  date_of_birth        DATE,
  height_cm            NUMERIC,
  weight_kg            NUMERIC,

  -- Voortgang
  completed_core_lessons TEXT[] DEFAULT '{}',

  -- Notificaties
  notify_daily         BOOLEAN DEFAULT true,
  notify_exercise      BOOLEAN DEFAULT true,
  notify_progress      BOOLEAN DEFAULT true,
  notify_push          BOOLEAN DEFAULT false,

  -- Uitgebreide data
  user_goals               JSONB DEFAULT '[]'::jsonb,
  personalized_nutrition_plan JSONB,
  pain_prediction          JSONB,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVITATIONS ──────────────────────────────────────────────────────────────
-- Uitnodigingslinks voor therapeuten (door praktijkbeheerder) en
-- patiënten (door therapeut of praktijkbeheerder).

CREATE TABLE public.invitations (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email        TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('practice_admin', 'therapist', 'patient')),
  practice_id  UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_by   UUID REFERENCES auth.users(id),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PATIENT REQUESTS ─────────────────────────────────────────────────────────
-- Zelfaanmelding: patiënt vraagt toegang, systeem matcht aan buurtpraktijk.

CREATE TABLE public.patient_requests (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  city                TEXT,
  postal_code         TEXT,
  complaint_description TEXT,

  -- Matching
  practice_id         UUID REFERENCES public.practices(id) ON DELETE SET NULL,
  therapist_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Na goedkeuring
  patient_id          UUID REFERENCES auth.users(id),

  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'matched', 'approved', 'rejected')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEASUREMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE public.measurements (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level       NUMERIC CHECK (pain_level >= 0 AND pain_level <= 10),
  stiffness_level  NUMERIC CHECK (stiffness_level >= 0 AND stiffness_level <= 10),
  function_score   NUMERIC CHECK (function_score >= 0 AND function_score <= 10),
  sleep_quality    NUMERIC CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  stress_level     NUMERIC CHECK (stress_level >= 0 AND stress_level <= 10),
  exercise_done    BOOLEAN DEFAULT false,
  exercise_minutes NUMERIC DEFAULT 0,
  mood             TEXT CHECK (mood IN ('great', 'good', 'okay', 'poor', 'bad')),
  notes            TEXT,
  is_flare         BOOLEAN DEFAULT false,
  flare_triggers   TEXT[] DEFAULT '{}',
  completed_exercises TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─── EXERCISES ────────────────────────────────────────────────────────────────

CREATE TABLE public.exercises (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_nl         TEXT NOT NULL,
  title_en         TEXT NOT NULL,
  description_nl   TEXT,
  description_en   TEXT,
  instructions_nl  TEXT,
  instructions_en  TEXT,
  focus_points_nl  TEXT[] DEFAULT '{}',
  focus_points_en  TEXT[] DEFAULT '{}',
  circle           TEXT,
  level            INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  sets             INTEGER DEFAULT 3,
  reps             TEXT,
  duration_minutes INTEGER DEFAULT 5,
  has_video        BOOLEAN DEFAULT false,
  video_url        TEXT,
  image_url        TEXT,
  is_nemex         BOOLEAN DEFAULT true,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEDICATIONS ──────────────────────────────────────────────────────────────

CREATE TABLE public.medications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  dosage     TEXT,
  frequency  TEXT,
  type       TEXT DEFAULT 'other',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.medication_logs (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  taken_at      TIMESTAMPTZ DEFAULT NOW(),
  date          DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ─── LESSONS ──────────────────────────────────────────────────────────────────

CREATE TABLE public.lessons (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key             TEXT UNIQUE NOT NULL,
  title_nl        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  content_nl      TEXT,
  content_en      TEXT,
  summary_nl      TEXT,
  summary_en      TEXT,
  key_takeaways_nl TEXT[] DEFAULT '{}',
  key_takeaways_en TEXT[] DEFAULT '{}',
  category        TEXT DEFAULT 'core' CHECK (category IN ('core', 'advanced')),
  is_premium      BOOLEAN DEFAULT false,
  sort_order      INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 5,
  icon            TEXT DEFAULT 'book',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUPPLEMENTS ──────────────────────────────────────────────────────────────

CREATE TABLE public.supplements (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_nl               TEXT NOT NULL,
  name_en               TEXT NOT NULL,
  description_nl        TEXT,
  description_en        TEXT,
  dosage_nl             TEXT,
  dosage_en             TEXT,
  timing_nl             TEXT,
  timing_en             TEXT,
  benefits_nl           TEXT[] DEFAULT '{}',
  benefits_en           TEXT[] DEFAULT '{}',
  interactions_nl       TEXT,
  interactions_en       TEXT,
  contraindications_nl  TEXT,
  contraindications_en  TEXT,
  evidence_level        TEXT DEFAULT 'moderate'
                          CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'insufficient')),
  category              TEXT DEFAULT 'general',
  is_premium            BOOLEAN DEFAULT false,
  safety_notes_nl       TEXT,
  safety_notes_en       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESEARCH PAPERS ──────────────────────────────────────────────────────────

CREATE TABLE public.research_papers (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pubmed_id           TEXT UNIQUE NOT NULL,
  doi                 TEXT,
  title               TEXT NOT NULL,
  authors             TEXT[] DEFAULT '{}',
  journal             TEXT,
  publication_date    DATE,
  abstract            TEXT,
  url                 TEXT,
  summary_nl          TEXT,
  summary_en          TEXT,
  key_findings_nl     TEXT[] DEFAULT '{}',
  key_findings_en     TEXT[] DEFAULT '{}',
  clinical_relevance_nl TEXT,
  clinical_relevance_en TEXT,
  categories          TEXT[] DEFAULT '{}',
  relevance_score     NUMERIC DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  evidence_level      TEXT CHECK (evidence_level IN (
                        'systematic_review','rct','cohort','case_control',
                        'case_report','expert_opinion','meta_analysis')),
  status              TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending','summarizing','ready_for_review',
                        'approved','rejected','archived')),
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  reviewer_notes      TEXT,
  applied_to_app      BOOLEAN DEFAULT false,
  applied_sections    TEXT[] DEFAULT '{}',
  fetch_batch         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.research_queries (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_name           TEXT NOT NULL,
  pubmed_query         TEXT NOT NULL,
  category             TEXT NOT NULL,
  is_active            BOOLEAN DEFAULT true,
  last_fetched_at      TIMESTAMPTZ,
  fetch_frequency_days INTEGER DEFAULT 7,
  max_results          INTEGER DEFAULT 20,
  created_by           UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.research_insights (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paper_id       UUID REFERENCES public.research_papers(id) ON DELETE CASCADE NOT NULL,
  title_nl       TEXT NOT NULL,
  title_en       TEXT NOT NULL,
  description_nl TEXT NOT NULL,
  description_en TEXT NOT NULL,
  target_section TEXT NOT NULL,
  action_type    TEXT DEFAULT 'info' CHECK (action_type IN (
                   'info','update_recommendation','new_exercise',
                   'new_recipe','warning','confirmation')),
  is_published   BOOLEAN DEFAULT false,
  published_by   UUID REFERENCES auth.users(id),
  published_at   TIMESTAMPTZ,
  priority       INTEGER DEFAULT 0,
  show_on_dashboard BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.research_fetch_log (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_id          UUID REFERENCES public.research_queries(id),
  papers_found      INTEGER DEFAULT 0,
  papers_new        INTEGER DEFAULT 0,
  papers_summarized INTEGER DEFAULT 0,
  errors            TEXT[] DEFAULT '{}',
  duration_ms       INTEGER,
  triggered_by      UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTENT PIPELINE ─────────────────────────────────────────────────────────

CREATE TABLE public.content_sources (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title             TEXT NOT NULL,
  source_type       TEXT NOT NULL CHECK (source_type IN ('pdf','youtube','article','url','manual')),
  source_url        TEXT,
  drive_file_id     TEXT,
  extracted_text    TEXT,
  word_count        INTEGER,
  language          TEXT DEFAULT 'nl' CHECK (language IN ('nl','en')),
  processing_status TEXT DEFAULT 'pending' CHECK (
                      processing_status IN ('pending','extracting','analyzing','done','error')),
  error_message     TEXT,
  processed_at      TIMESTAMPTZ,
  proposals_generated INTEGER DEFAULT 0,
  uploaded_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WACHTLIJST ───────────────────────────────────────────────────────────────

CREATE TABLE public.waitlist (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('patient', 'practice')),
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Iedereen mag zich aanmelden" ON public.waitlist
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin ziet wachtlijst" ON public.waitlist
  FOR SELECT USING (get_my_role() = 'admin');

-- ─── CONTENT PROPOSALS ────────────────────────────────────────────────────────

CREATE TABLE public.content_proposals (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id         UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,
  target_table      TEXT NOT NULL CHECK (target_table IN ('supplements','exercises','lessons')),
  target_record_id  UUID,
  target_record_name TEXT NOT NULL,
  current_values    JSONB DEFAULT '{}',
  proposed_values   JSONB NOT NULL,
  change_summary_nl TEXT NOT NULL,
  ai_reasoning_nl   TEXT NOT NULL,
  evidence_quote    TEXT,
  confidence_score  NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status            TEXT DEFAULT 'pending' CHECK (
                      status IN ('pending','approved','rejected','applied')),
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  reviewer_notes    TEXT,
  applied_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE public.practices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_queries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_fetch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_proposals ENABLE ROW LEVEL SECURITY;

-- PRACTICES
CREATE POLICY "Admin beheert praktijken" ON public.practices
  FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Praktijkbeheerder ziet eigen praktijk" ON public.practices
  FOR SELECT USING (id = get_my_practice_id());
CREATE POLICY "Praktijkbeheerder past eigen praktijk aan" ON public.practices
  FOR UPDATE USING (id = get_my_practice_id());
CREATE POLICY "Iedereen ziet goedgekeurde praktijken" ON public.practices
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Nieuwe praktijk aanmelden" ON public.practices
  FOR INSERT WITH CHECK (true);

-- PROFILES
CREATE POLICY "Eigen profiel lezen" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Eigen profiel aanpassen" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Eigen profiel aanmaken" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Therapeut ziet eigen patiënten" ON public.profiles
  FOR SELECT USING (
    get_my_role() IN ('therapist', 'practice_admin')
    AND therapist_id = auth.uid()
  );
CREATE POLICY "Praktijkbeheerder ziet alle praktijkprofielen" ON public.profiles
  FOR SELECT USING (
    get_my_role() = 'practice_admin'
    AND practice_id = get_my_practice_id()
  );
CREATE POLICY "Admin ziet alle profielen" ON public.profiles
  FOR ALL USING (get_my_role() = 'admin');

-- INVITATIONS
CREATE POLICY "Uitnodiger beheert eigen uitnodigingen" ON public.invitations
  FOR ALL USING (invited_by = auth.uid());
CREATE POLICY "Uitgenodigde ziet eigen uitnodiging" ON public.invitations
  FOR SELECT USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Service mag uitnodiging aanmaken" ON public.invitations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin beheert alle uitnodigingen" ON public.invitations
  FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Publiek: uitnodiging lezen via token" ON public.invitations
  FOR SELECT USING (true);

-- PATIENT REQUESTS
CREATE POLICY "Aanvrager ziet eigen verzoek" ON public.patient_requests
  FOR SELECT USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Therapeut beheert patiëntverzoeken" ON public.patient_requests
  FOR ALL USING (get_my_role() IN ('therapist', 'practice_admin'));
CREATE POLICY "Admin beheert alle verzoeken" ON public.patient_requests
  FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Iedereen kan verzoek indienen" ON public.patient_requests
  FOR INSERT WITH CHECK (true);

-- MEASUREMENTS
CREATE POLICY "Eigen metingen beheren" ON public.measurements
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Therapeut ziet patiëntmetingen" ON public.measurements
  FOR SELECT USING (
    get_my_role() IN ('therapist', 'practice_admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = measurements.user_id AND p.therapist_id = auth.uid()
    )
  );

-- REFERENCE DATA (publiek leesbaar)
CREATE POLICY "Iedereen leest oefeningen" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Iedereen leest lessen"     ON public.lessons   FOR SELECT USING (true);
CREATE POLICY "Iedereen leest supplementen" ON public.supplements FOR SELECT USING (true);
CREATE POLICY "Admin beheert oefeningen"   ON public.exercises   FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Admin beheert lessen"       ON public.lessons     FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Admin beheert supplementen" ON public.supplements FOR ALL USING (get_my_role() = 'admin');

-- MEDICATIONS
CREATE POLICY "Eigen medicatie beheren" ON public.medications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Eigen medicatielogs beheren" ON public.medication_logs FOR ALL USING (user_id = auth.uid());

-- RESEARCH
CREATE POLICY "Therapeuten lezen papers" ON public.research_papers
  FOR SELECT USING (get_my_role() IN ('therapist', 'practice_admin', 'admin'));
CREATE POLICY "Admin beheert papers" ON public.research_papers
  FOR ALL USING (get_my_role() IN ('practice_admin', 'admin'));
CREATE POLICY "Service mag papers inserten" ON public.research_papers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Gepubliceerde inzichten zijn publiek" ON public.research_insights
  FOR SELECT USING (is_published = true);
CREATE POLICY "Therapeuten beheren inzichten" ON public.research_insights
  FOR ALL USING (get_my_role() IN ('therapist', 'practice_admin', 'admin'));
CREATE POLICY "Therapeuten beheren zoekopdrachten" ON public.research_queries
  FOR ALL USING (get_my_role() IN ('therapist', 'practice_admin', 'admin'));
CREATE POLICY "Therapeuten zien fetchlog" ON public.research_fetch_log
  FOR SELECT USING (get_my_role() IN ('therapist', 'practice_admin', 'admin'));
CREATE POLICY "Service mag fetchlog inserten" ON public.research_fetch_log
  FOR INSERT WITH CHECK (true);

-- CONTENT PIPELINE
CREATE POLICY "Admin beheert content sources" ON public.content_sources
  FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Service mag source inserten" ON public.content_sources
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin beheert voorstellen" ON public.content_proposals
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Service mag voorstel inserten" ON public.content_proposals
  FOR INSERT WITH CHECK (true);

-- ─── FUNCTIE: Voorstel toepassen ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.apply_content_proposal(proposal_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  prop         RECORD;
  col          TEXT;
  val          JSONB;
  set_clauses  TEXT[] := '{}';
  allowed_cols TEXT[];
  sql_stmt     TEXT;
BEGIN
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
      set_clauses := array_append(set_clauses, format('%I = %L', col, val #>> '{}'));
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

-- ─── FUNCTIE: Nieuw profiel aanmaken bij registratie ─────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_practice_id uuid;
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'register_as', NEW.raw_user_meta_data->>'role', 'patient');

  IF v_role = 'practice_admin' THEN
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

    INSERT INTO public.profiles (id, email, full_name, role, practice_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'practice_admin',
      v_practice_id
    );
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      CASE WHEN v_role IN ('patient', 'therapist', 'practice_admin', 'admin') THEN v_role ELSE 'patient' END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_role        ON public.profiles(role);
CREATE INDEX idx_profiles_practice    ON public.profiles(practice_id) WHERE practice_id IS NOT NULL;
CREATE INDEX idx_profiles_therapist   ON public.profiles(therapist_id) WHERE therapist_id IS NOT NULL;
CREATE INDEX idx_practices_status     ON public.practices(status);
CREATE INDEX idx_invitations_token    ON public.invitations(token);
CREATE INDEX idx_invitations_email    ON public.invitations(email);
CREATE INDEX idx_patient_requests_status ON public.patient_requests(status);
CREATE INDEX idx_measurements_user_date  ON public.measurements(user_id, date DESC);
CREATE INDEX idx_measurements_user_created ON public.measurements(user_id, created_at DESC);
CREATE INDEX idx_medications_user     ON public.medications(user_id) WHERE is_active = true;
CREATE INDEX idx_medication_logs_user_date ON public.medication_logs(user_id, date);
CREATE INDEX idx_research_papers_status   ON public.research_papers(status);
CREATE INDEX idx_research_papers_categories ON public.research_papers USING GIN(categories);
CREATE INDEX idx_research_insights_published ON public.research_insights(is_published, target_section);
CREATE INDEX idx_content_proposals_status ON public.content_proposals(status, created_at DESC);
CREATE INDEX idx_content_sources_drive ON public.content_sources(drive_file_id) WHERE drive_file_id IS NOT NULL;

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO public.lessons (key, title_nl, title_en, content_nl, content_en, summary_nl, summary_en, key_takeaways_nl, key_takeaways_en, category, sort_order, duration_minutes, icon) VALUES
('arthritis_basics', 'Wat is Artrose?', 'What is Arthritis?',
 'Artrose is een aandoening waarbij het kraakbeen in je gewrichten slijt. Dit is een normaal proces dat bij veel mensen voorkomt, maar het hoeft geen pijn te doen. Het kraakbeen in je gewrichten is als een kussen dat de botten beschermt. Bij artrose wordt dit kussen dunner, waardoor de botten dichter bij elkaar komen. Dit kan leiden tot pijn, stijfheid en verminderde beweeglijkheid. Maar het goede nieuws is: je kunt veel doen om je klachten te verminderen!',
 'Osteoarthritis is a condition where the cartilage in your joints wears down. This is a normal process that occurs in many people, but it doesn''t have to be painful.',
 'Leer de basis over artrose en waarom het niet het einde hoeft te zijn.',
 'Learn the basics about osteoarthritis and why it doesn''t have to be the end.',
 ARRAY['Artrose is normaal en komt veel voor','Pijn betekent niet altijd schade','Beweging is de beste medicijn','Je kunt veel zelf doen'],
 ARRAY['Osteoarthritis is normal and common','Pain does not always mean damage','Exercise is the best medicine','There is a lot you can do yourself'],
 'core', 1, 5, 'book'),
('movement_myth', 'Mythe: Rust is het Beste', 'Myth: Rest is Best',
 'Een van de grootste misverstanden over artrose is dat je moet rusten. Het tegendeel is waar! Beweging is de allerbeste behandeling voor artrose.',
 'One of the biggest misconceptions about osteoarthritis is that you should rest. The opposite is true!',
 'Ontdek waarom bewegen beter is dan rusten bij artrose.',
 'Discover why movement is better than rest for osteoarthritis.',
 ARRAY['Bewegen is beter dan rusten','Je gewrichten hebben beweging nodig','Begin rustig en bouw op','Pijn tijdens bewegen is normaal en niet gevaarlijk'],
 ARRAY['Movement is better than rest','Your joints need movement','Start slowly and build up','Pain during exercise is normal and not dangerous'],
 'core', 2, 5, 'activity'),
('pain_science', 'Pijnwetenschap', 'Pain Science',
 'Pijn is een alarmsignaal van je brein, maar het betekent niet altijd dat er schade is. Door te begrijpen hoe pijn werkt, kun je er beter mee omgaan.',
 'Pain is an alarm signal from your brain, but it does not always mean there is damage.',
 'Begrijp hoe pijn werkt en waarom meer pijn niet altijd meer schade betekent.',
 'Understand how pain works and why more pain does not always mean more damage.',
 ARRAY['Pijn is niet altijd gelijk aan schade','Je brein kan pijn versterken','Stress en slaap beïnvloeden pijn','Kennis over pijn vermindert pijn'],
 ARRAY['Pain does not always equal damage','Your brain can amplify pain','Stress and sleep affect pain','Knowledge about pain reduces pain'],
 'core', 3, 5, 'brain');

INSERT INTO public.supplements (name_nl, name_en, description_nl, description_en, dosage_nl, dosage_en, timing_nl, timing_en, benefits_nl, benefits_en, evidence_level, category, safety_notes_nl, safety_notes_en) VALUES
('Glucosamine', 'Glucosamine',
 'Glucosamine is een natuurlijke stof die voorkomt in het kraakbeen.',
 'Glucosamine is a natural substance found in cartilage.',
 '1500 mg per dag', '1500 mg per day', 'Bij het ontbijt', 'With breakfast',
 ARRAY['Kan kraakbeenslijtage vertragen','Kan pijn verminderen','Weinig bijwerkingen'],
 ARRAY['May slow cartilage wear','May reduce pain','Few side effects'],
 'moderate', 'joint_support',
 'Niet gebruiken bij schaaldierallergie.', 'Do not use if allergic to shellfish.'),
('Omega-3 Visolie', 'Omega-3 Fish Oil',
 'Omega-3 vetzuren hebben ontstekingsremmende eigenschappen.',
 'Omega-3 fatty acids have anti-inflammatory properties.',
 '2000-3000 mg EPA+DHA per dag', '2000-3000 mg EPA+DHA per day', 'Bij de maaltijd', 'With meals',
 ARRAY['Vermindert ontsteking','Kan pijn verminderen','Goed voor hart en vaten'],
 ARRAY['Reduces inflammation','May reduce pain','Good for cardiovascular health'],
 'strong', 'anti_inflammatory',
 'Kan interactie hebben met bloedverdunners.', 'May interact with blood thinners.'),
('Curcumine', 'Curcumin',
 'Curcumine is de werkzame stof in kurkuma met sterke ontstekingsremmende eigenschappen.',
 'Curcumin is the active compound in turmeric with strong anti-inflammatory properties.',
 '500-1000 mg per dag (met piperine)', '500-1000 mg per day (with piperine)', 'Bij de maaltijd', 'With meals',
 ARRAY['Sterke ontstekingsremmer','Kan pijn verminderen','Antioxidant'],
 ARRAY['Strong anti-inflammatory','May reduce pain','Antioxidant'],
 'moderate', 'anti_inflammatory',
 'Niet combineren met bloedverdunners zonder overleg.', 'Do not combine with blood thinners without consulting your doctor.'),
('Vitamine D', 'Vitamin D',
 'Vitamine D is essentieel voor sterke botten en kan helpen bij artrose.',
 'Vitamin D is essential for strong bones and may help with osteoarthritis.',
 '1000-2000 IE per dag', '1000-2000 IU per day', 'Bij het ontbijt of lunch', 'With breakfast or lunch',
 ARRAY['Essentieel voor botten','Ondersteunt immuunsysteem','Veel Nederlanders hebben tekort'],
 ARRAY['Essential for bones','Supports immune system','Many people are deficient'],
 'strong', 'bone_health',
 'Laat je vitamine D-spiegel controleren door je arts.', 'Have your vitamin D level checked by your doctor.');

INSERT INTO public.exercises (title_nl, title_en, description_nl, description_en, instructions_nl, instructions_en, circle, level, sets, reps, duration_minutes, is_nemex, sort_order, focus_points_nl, focus_points_en) VALUES
('Opwarming - Fietsen','Warmup - Cycling','Rustig fietsen op een hometrainer om de gewrichten op te warmen.','Easy cycling on a stationary bike to warm up the joints.','Fiets 5 minuten op een rustig tempo. Houd je rug recht en je schouders ontspannen.','Cycle for 5 minutes at an easy pace. Keep your back straight and shoulders relaxed.','warmup',1,1,'5 min',5,true,1,ARRAY['Rustig tempo','Rechte rug','Ontspannen schouders'],ARRAY['Easy pace','Straight back','Relaxed shoulders']),
('Kniebuigingen','Knee Bends','Mini squats om de bovenbenen te versterken.','Mini squats to strengthen the upper legs.','Sta met voeten op heupbreedte. Buig langzaam je knieën alsof je gaat zitten. Ga niet verder dan 45 graden.','Stand with feet hip-width apart. Slowly bend your knees as if sitting down. Don''t go past 45 degrees.','strength',1,3,'10-12',5,true,2,ARRAY['Knieën niet voorbij tenen','Langzaam bewegen','Adem regelmatig'],ARRAY['Knees not past toes','Move slowly','Breathe regularly']),
('Beenheffen Zijwaarts','Side Leg Raises','Versterk de heupspieren voor meer stabiliteit.','Strengthen hip muscles for more stability.','Sta recht en houd je vast aan een stoel. Hef je been zijwaarts op zonder je bovenlichaam te kantelen.','Stand straight and hold onto a chair. Raise your leg sideways without tilting your upper body.','strength',1,3,'10 per been',5,true,3,ARRAY['Bovenlichaam recht','Gecontroleerde beweging','Niet zwaaien'],ARRAY['Upper body straight','Controlled movement','Don''t swing']),
('Hamstring Stretch','Hamstring Stretch','Rek de achterkant van je bovenbeen.','Stretch the back of your upper leg.','Zit op de rand van een stoel. Strek een been naar voren. Leun met een rechte rug naar voren tot je een rek voelt.','Sit on the edge of a chair. Extend one leg forward. Lean forward with a straight back until you feel a stretch.','flexibility',1,2,'30 sec per been',5,true,4,ARRAY['Rechte rug','Geen pijn alleen rek','Adem door'],ARRAY['Straight back','No pain only stretch','Keep breathing']),
('Balans op Een Been','Single Leg Balance','Verbeter je balans en proprioceptie.','Improve your balance and proprioception.','Sta op een been naast een stoel. Houd 30 seconden vol. Wissel van been.','Stand on one leg next to a chair. Hold for 30 seconds. Switch legs.','balance',1,2,'30 sec per been',3,true,5,ARRAY['Gebruik stoel als backup','Blik vooruit','Ontspannen ademen'],ARRAY['Use chair as backup','Look straight ahead','Relaxed breathing']),
('Cooldown - Wandelen','Cooldown - Walking','Rustig wandelen om af te koelen.','Easy walking to cool down.','Loop 3-5 minuten op een rustig tempo. Laat je hartslag zakken en adem rustig.','Walk for 3-5 minutes at an easy pace. Let your heart rate come down and breathe easily.','cooldown',1,1,'3-5 min',5,true,6,ARRAY['Rustig tempo','Diepe ademhaling','Geniet van het moment'],ARRAY['Easy pace','Deep breathing','Enjoy the moment']);

INSERT INTO public.research_queries (query_name, pubmed_query, category, fetch_frequency_days, max_results) VALUES
('Artrose oefentherapie','(osteoarthritis[MeSH] OR arthrosis) AND (exercise therapy[MeSH] OR physical therapy OR NEMEX) AND (randomized controlled trial[pt] OR meta-analysis[pt])','exercise',7,15),
('Artrose supplementen','(osteoarthritis[MeSH]) AND (glucosamine OR omega-3 OR curcumin OR vitamin D OR collagen) AND (randomized controlled trial[pt] OR meta-analysis[pt])','supplements',14,10),
('Artrose pijnmanagement','(osteoarthritis[MeSH]) AND (pain management[MeSH] OR central sensitization OR pain neuroscience education) AND (2024[pdat] OR 2025[pdat] OR 2026[pdat])','pain_management',7,15)
ON CONFLICT DO NOTHING;
