-- =============================================
-- Migration 005: Exercise Media Storage Bucket
-- Public read, authenticated write
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('exercise-media', 'exercise-media', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Iedereen kan exercise-media zien" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-media');

-- Authenticated write
CREATE POLICY "Ingelogde users kunnen exercise-media uploaden" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exercise-media' AND auth.role() = 'authenticated');

-- Admin delete
CREATE POLICY "Admin kan exercise-media verwijderen" ON storage.objects
  FOR DELETE USING (bucket_id = 'exercise-media'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Voeg image_url en video_url toe aan exercises als die nog niet bestaan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'image_url') THEN
    ALTER TABLE public.exercises ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'video_url') THEN
    ALTER TABLE public.exercises ADD COLUMN video_url TEXT;
  END IF;
END $$;
