-- =============================================
-- Content-Sync Pipeline - Database Schema
-- Stap 3 van 3: run AFTER schema.sql EN research-schema.sql
-- =============================================

-- =============================================
-- updated_at toevoegen aan referentietabellen
-- (nodig voor de apply-functie)
-- =============================================
ALTER TABLE public.supplements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- CONTENT SOURCES
-- Bijhoudt elk bestand dat via Google Drive (of handmatig) is aangeboden.
-- Één bron kan meerdere wijzigingsvoorstellen genereren.
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_sources (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Brongegevens
  title               TEXT NOT NULL,
  source_type         TEXT NOT NULL CHECK (
                        source_type IN ('pdf', 'youtube', 'article', 'url', 'manual')
                      ),
  source_url          TEXT,         -- Google Drive-URL, YouTube-URL of artikel-URL
  drive_file_id       TEXT,         -- Google Drive bestand-ID (voor deduplicatie)

  -- Geëxtraheerde inhoud
  extracted_text      TEXT,         -- Volledige tekst of YouTube-transcript
  word_count          INTEGER,
  language            TEXT DEFAULT 'nl' CHECK (language IN ('nl', 'en')),

  -- Verwerkingsstatus
  processing_status   TEXT DEFAULT 'pending' CHECK (
                        processing_status IN (
                          'pending',      -- wacht op verwerking
                          'extracting',   -- tekst wordt geëxtraheerd
                          'analyzing',    -- AI is aan het analyseren
                          'done',         -- klaar, voorstellen aangemaakt
                          'error'         -- fout opgetreden
                        )
                      ),
  error_message       TEXT,
  processed_at        TIMESTAMPTZ,
  proposals_generated INTEGER DEFAULT 0,  -- hoeveel voorstellen zijn aangemaakt

  -- Metadata
  uploaded_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTENT PROPOSALS (Wijzigingswachtrij)
-- Elk voorstel bevat: bron → doel → huidige waarde → voorgestelde waarde.
-- Marc keurt goed of af. Bij goedkeuring wordt de live database bijgewerkt.
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_proposals (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id             UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,

  -- Wat moet er veranderen?
  target_table          TEXT NOT NULL CHECK (
                          target_table IN ('supplements', 'exercises', 'lessons')
                        ),
  target_record_id      UUID,           -- NULL = voorstel voor nieuw record
  target_record_name    TEXT NOT NULL,  -- Leesbaar: "Vitamine D", "Kniebuigingen"

  -- De wijziging zelf (JSONB = flexibel per tabel)
  -- current_values: snapshot van de huidige databasewaarden (voor de diff-weergave)
  -- proposed_values: alleen de te wijzigen velden, bijv.:
  --   { "dosage_nl": "3000 mg per dag", "evidence_level": "strong" }
  current_values        JSONB DEFAULT '{}',
  proposed_values       JSONB NOT NULL,
  change_summary_nl     TEXT NOT NULL,  -- Menselijk leesbare samenvatting

  -- AI-onderbouwing
  ai_reasoning_nl       TEXT NOT NULL,  -- Waarom stelt de AI dit voor?
  evidence_quote        TEXT,           -- Directe quote uit de bronbron
  confidence_score      NUMERIC CHECK (
                          confidence_score >= 0 AND confidence_score <= 100
                        ),

  -- Review-workflow
  status                TEXT DEFAULT 'pending' CHECK (
                          status IN (
                            'pending',   -- wacht op jouw beoordeling
                            'approved',  -- goedgekeurd, klaar om toe te passen
                            'rejected',  -- afgewezen
                            'applied'    -- toegepast op de live database
                          )
                        ),
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  reviewer_notes        TEXT,           -- Jouw eigen aantekeningen
  applied_at            TIMESTAMPTZ,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCTION: Voorstel toepassen op de live database
-- Wordt aangeroepen vanuit de app na jouw goedkeuring.
-- Veilig: gebruikt %I (identifier-quoting) en %L (literal-quoting).
-- =============================================
CREATE OR REPLACE FUNCTION public.apply_content_proposal(proposal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop        RECORD;
  sql_stmt    TEXT;
  col         TEXT;
  val         JSONB;
  set_clauses TEXT[] := '{}';
  allowed_cols TEXT[];
BEGIN
  -- Haal het voorstel op (alleen als goedgekeurd)
  SELECT * INTO prop FROM public.content_proposals
  WHERE id = proposal_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voorstel niet gevonden of niet goedgekeurd: %', proposal_id;
  END IF;

  -- Veilige kolomnamen per tabel (beschermt tegen ongeldige velden)
  IF prop.target_table = 'supplements' THEN
    allowed_cols := ARRAY[
      'name_nl','name_en','description_nl','description_en',
      'dosage_nl','dosage_en','timing_nl','timing_en',
      'benefits_nl','benefits_en','interactions_nl','interactions_en',
      'contraindications_nl','contraindications_en',
      'evidence_level','category','is_premium',
      'safety_notes_nl','safety_notes_en'
    ];
  ELSIF prop.target_table = 'exercises' THEN
    allowed_cols := ARRAY[
      'title_nl','title_en','description_nl','description_en',
      'instructions_nl','instructions_en',
      'focus_points_nl','focus_points_en',
      'circle','level','sets','reps','duration_minutes',
      'has_video','video_url','image_url','is_nemex','sort_order'
    ];
  ELSIF prop.target_table = 'lessons' THEN
    allowed_cols := ARRAY[
      'title_nl','title_en','content_nl','content_en',
      'summary_nl','summary_en',
      'key_takeaways_nl','key_takeaways_en',
      'category','is_premium','sort_order','duration_minutes','icon'
    ];
  ELSE
    RAISE EXCEPTION 'Onbekende target_table: %', prop.target_table;
  END IF;

  -- Bouw SET-clausules op uit proposed_values
  FOR col, val IN SELECT * FROM jsonb_each(prop.proposed_values)
  LOOP
    -- Sla onbekende kolommen over (veiligheidscheck)
    IF col = ANY(allowed_cols) THEN
      set_clauses := array_append(
        set_clauses,
        format('%I = %L', col, val #>> '{}')
      );
    END IF;
  END LOOP;

  IF array_length(set_clauses, 1) IS NULL THEN
    RAISE EXCEPTION 'Geen geldige kolommen gevonden in proposed_values';
  END IF;

  -- Voer de UPDATE uit op de juiste tabel
  IF prop.target_record_id IS NOT NULL THEN
    sql_stmt := format(
      'UPDATE public.%I SET %s, updated_at = NOW() WHERE id = %L',
      prop.target_table,
      array_to_string(set_clauses, ', '),
      prop.target_record_id
    );
    EXECUTE sql_stmt;

    -- Markeer voorstel als toegepast
    UPDATE public.content_proposals
    SET status = 'applied', applied_at = NOW(), updated_at = NOW()
    WHERE id = proposal_id;

    RETURN TRUE;
  END IF;

  -- TODO: nieuw record aanmaken (target_record_id IS NULL) → Fase 2
  RETURN FALSE;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_proposals ENABLE ROW LEVEL SECURITY;

-- Alleen admin kan bronnen zien en beheren
CREATE POLICY "Admins can manage content sources" ON public.content_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- n8n roept de Edge Function aan als service_role → bypast RLS automatisch.
-- Deze policy is een fallback voor directe inserts vanuit de webhook.
CREATE POLICY "Service can insert content sources" ON public.content_sources
  FOR INSERT WITH CHECK (true);

-- Alleen admin kan voorstellen zien en beheren
CREATE POLICY "Admins can manage proposals" ON public.content_proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- n8n/Edge Function inserts
CREATE POLICY "Service can insert proposals" ON public.content_proposals
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_content_sources_status
  ON public.content_sources(processing_status);

CREATE INDEX IF NOT EXISTS idx_content_sources_drive
  ON public.content_sources(drive_file_id)
  WHERE drive_file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_sources_created
  ON public.content_sources(created_at DESC);

-- Meest gebruikte query: "geef me alle openstaande voorstellen"
CREATE INDEX IF NOT EXISTS idx_content_proposals_status
  ON public.content_proposals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_proposals_source
  ON public.content_proposals(source_id);

CREATE INDEX IF NOT EXISTS idx_content_proposals_target
  ON public.content_proposals(target_table, target_record_id);
