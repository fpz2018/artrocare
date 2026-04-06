-- =============================================
-- Migration 006: Video Generation Jobs
-- Tracks AI video generation pipeline status
-- =============================================

CREATE TABLE IF NOT EXISTS public.video_jobs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exercise_id      UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,

  -- Status tracking
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending', 'generating_prompt', 'sending_to_ai',
                       'generating_video', 'processing_overlays', 'uploading', 'done', 'failed')),
  error_message    TEXT,
  retry_count      INTEGER DEFAULT 0,

  -- Prompt data
  prompt_text      TEXT,
  prompt_style     TEXT DEFAULT 'exercise_demo',

  -- Video generation
  provider         TEXT DEFAULT 'imagineart',
  provider_job_id  TEXT,
  raw_video_url    TEXT,

  -- Final output
  final_video_url  TEXT,
  thumbnail_url    TEXT,

  -- Overlay config
  overlay_config   JSONB DEFAULT '{
    "show_intro": true,
    "show_outro": true,
    "show_logo": true,
    "show_title": true,
    "show_instructions": true,
    "brand_color": "#0EA5E9"
  }'::jsonb,

  -- Metadata
  triggered_by     UUID REFERENCES auth.users(id),
  trigger_type     TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'batch', 'scheduled')),
  duration_seconds INTEGER,
  file_size_bytes  BIGINT,

  -- Timestamps
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_jobs_exercise ON public.video_jobs(exercise_id);
CREATE INDEX idx_video_jobs_status ON public.video_jobs(status);
CREATE INDEX idx_video_jobs_created ON public.video_jobs(created_at DESC);

-- RLS
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read video jobs
CREATE POLICY "Authenticated users can read video_jobs"
  ON public.video_jobs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage video_jobs"
  ON public.video_jobs FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
