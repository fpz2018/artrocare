-- =============================================
-- Migration 002: Program Structure
-- 12-weken begeleidingsprogramma tabellen
-- =============================================

-- ─── PROGRAM_WEEKS ──────────────────────────────────────────────────────────
-- Elke week in het 12-weken programma

CREATE TABLE public.program_weeks (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_number     INT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  title_nl        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  description_nl  TEXT,
  description_en  TEXT,
  theme           TEXT NOT NULL,
  unlock_day      INT NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (week_number)
);

-- ─── PROGRAM_MODULES ────────────────────────────────────────────────────────
-- Individuele modules binnen een week

CREATE TABLE public.program_modules (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id          UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  title_nl         TEXT NOT NULL,
  title_en         TEXT NOT NULL,
  content_nl       TEXT,
  content_en       TEXT,
  module_type      TEXT NOT NULL CHECK (module_type IN ('education', 'exercise', 'nutrition', 'sleep', 'mindset')),
  duration_minutes INT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRAM_PROGRESS ───────────────────────────────────────────────────────
-- Voortgang per deelnemer per module

CREATE TABLE public.program_progress (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_id       UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, module_id)
);

-- ─── PROFILES: program_start_date ───────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program_start_date DATE;

-- ─── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX idx_program_modules_week ON public.program_modules(week_id);
CREATE INDEX idx_program_progress_user ON public.program_progress(user_id);
CREATE INDEX idx_program_progress_week ON public.program_progress(week_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;

-- program_weeks: leesbaar voor alle ingelogde gebruikers, schrijven alleen admin
-- Week-unlock logica: deelnemer ziet week N alleen als hun startdatum + unlock_day <= vandaag

CREATE POLICY "program_weeks_select"
  ON public.program_weeks FOR SELECT
  TO authenticated
  USING (
    -- Admins en therapeuten zien altijd alle weken
    get_my_role() IN ('admin', 'therapist', 'practice_admin')
    OR
    -- Deelnemers zien alleen ontgrendelde weken
    (
      unlock_day <= (
        CURRENT_DATE - (SELECT program_start_date FROM public.profiles WHERE id = auth.uid())
      )::INT
      -- Als er geen startdatum is, toon alleen week 1 (unlock_day = 0)
      OR (
        (SELECT program_start_date FROM public.profiles WHERE id = auth.uid()) IS NULL
        AND unlock_day = 0
      )
    )
  );

CREATE POLICY "program_weeks_admin_insert"
  ON public.program_weeks FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "program_weeks_admin_update"
  ON public.program_weeks FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "program_weeks_admin_delete"
  ON public.program_weeks FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- program_modules: zelfde unlock-logica via de gekoppelde week

CREATE POLICY "program_modules_select"
  ON public.program_modules FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('admin', 'therapist', 'practice_admin')
    OR
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      WHERE pw.id = week_id
      AND (
        pw.unlock_day <= (
          CURRENT_DATE - (SELECT program_start_date FROM public.profiles WHERE id = auth.uid())
        )::INT
        OR (
          (SELECT program_start_date FROM public.profiles WHERE id = auth.uid()) IS NULL
          AND pw.unlock_day = 0
        )
      )
    )
  );

CREATE POLICY "program_modules_admin_insert"
  ON public.program_modules FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "program_modules_admin_update"
  ON public.program_modules FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "program_modules_admin_delete"
  ON public.program_modules FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- program_progress: deelnemers zien en schrijven alleen hun eigen voortgang

CREATE POLICY "program_progress_select"
  ON public.program_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_my_role() IN ('admin', 'therapist', 'practice_admin')
  );

CREATE POLICY "program_progress_insert"
  ON public.program_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    -- Controleer dat de module ontgrendeld is
    AND EXISTS (
      SELECT 1 FROM public.program_modules pm
      JOIN public.program_weeks pw ON pw.id = pm.week_id
      WHERE pm.id = module_id
      AND (
        pw.unlock_day <= (
          CURRENT_DATE - (SELECT program_start_date FROM public.profiles WHERE id = auth.uid())
        )::INT
        OR (
          (SELECT program_start_date FROM public.profiles WHERE id = auth.uid()) IS NULL
          AND pw.unlock_day = 0
        )
      )
    )
  );

CREATE POLICY "program_progress_delete"
  ON public.program_progress FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- Therapeuten mogen voortgang van hun gekoppelde deelnemers inzien
-- (al afgedekt via get_my_role() IN ('therapist') in select policy hierboven,
--  maar voor fijnmaziger controle kun je later therapist_id check toevoegen)

-- ─── GRANTS ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.program_weeks TO authenticated;
GRANT SELECT ON public.program_modules TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.program_progress TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.program_weeks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.program_modules TO authenticated;
