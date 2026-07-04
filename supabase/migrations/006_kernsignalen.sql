-- =============================================
-- Migration 006: Kernsignalen (dagelijkse tracker)
-- Eén rij per gebruiker per dag met drie kernsignalen
-- (beweeg / voed / herstel) + opgeslagen AI-analyse.
-- =============================================
--
-- WAAROM JSONB voor de signaal-data i.p.v. losse kolommen?
--   De drie signalen zijn kleine, genestelde vragenlijsten die nog
--   kunnen wijzigen (extra ja/nee-item, andere slaapvraag, andere
--   dagdelen). Met jsonb blijft het schema stabiel: nieuwe vragen
--   toevoegen vergt geen ALTER TABLE / migratie en breekt bestaande
--   rijen niet. De velden waarop we filteren of sorteren — user_id,
--   date, timestamps — zijn wél echte kolommen (indexeerbaar). Scores
--   (beweeg-totaal, /7, /5) worden afgeleid berekend in de frontend én
--   in de Edge Function uit de ruwe jsonb, dus die hoeven we niet
--   redundant op te slaan. Dat houdt de bron van waarheid enkelvoudig.

-- ─── DAILY_ENTRIES ──────────────────────────────────────────────────────────

CREATE TABLE public.daily_entries (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- user_id is NOT NULL: elke rij hoort bij een ingelogde gebruiker en
  -- wordt via RLS afgeschermd. Multi-user-klaar vanaf dag één.
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date                      DATE NOT NULL,

  -- Ruwe signaal-data (zie toelichting bovenaan).
  --   beweeg:  { "ochtend": int, "middag": int, "avond": int }   (ademloze minuten)
  --   voed:    { "groente": int, "fruit": int, "volkoren": bool,
  --             "noten_peulvruchten": bool, "omega3": bool,
  --             "geen_suikerdrank": bool, "geen_bewerkt_vlees": bool }
  --   herstel: { "slaap_duur": bool, "ochtendlicht": bool, "vaste_waaktijd": bool,
  --             "laatste_hap": bool, "geen_alcohol": bool, "uren": number }
  beweeg                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  voed                      JSONB NOT NULL DEFAULT '{}'::jsonb,
  herstel                   JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Opgeslagen AI-analyse (blijft bewaard bij de dag-entry).
  ai_analysis               TEXT,
  ai_analysis_generated_at  TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Eén entry per gebruiker per dag.
  UNIQUE (user_id, date)
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
-- Trend-query's ("laatste 5 dagen van deze gebruiker") en datum-navigatie.
CREATE INDEX idx_daily_entries_user_date ON public.daily_entries(user_id, date DESC);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_daily_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_daily_entries_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

-- Een gebruiker ziet en beheert uitsluitend zijn eigen dagen.
-- (get_my_role() bestaat al in het schema; admins mogen meelezen voor support.)
CREATE POLICY "daily_entries_select"
  ON public.daily_entries FOR SELECT
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "daily_entries_insert"
  ON public.daily_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_entries_update"
  ON public.daily_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_entries_delete"
  ON public.daily_entries FOR DELETE
  USING (user_id = auth.uid());

-- ─── GRANTS ─────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_entries TO authenticated;
