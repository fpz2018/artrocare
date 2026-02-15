-- =============================================
-- Artrose Kompas - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  language TEXT DEFAULT 'nl' CHECK (language IN ('nl', 'en')),
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'therapist', 'admin')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'practice')),
  
  -- Onboarding data
  onboarding_completed BOOLEAN DEFAULT false,
  arthrosis_stage TEXT CHECK (arthrosis_stage IN ('early', 'moderate', 'advanced', 'pre_op')),
  affected_joints TEXT[] DEFAULT '{}',
  on_replacement_waitlist BOOLEAN DEFAULT false,
  goals TEXT[] DEFAULT '{}',
  date_of_birth DATE,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  
  -- Education progress
  completed_core_lessons TEXT[] DEFAULT '{}',
  
  -- Therapist link
  therapist_email TEXT,
  therapist_name TEXT,
  therapist_practice TEXT,
  therapist_phone TEXT,
  
  -- Notification settings
  notify_daily BOOLEAN DEFAULT true,
  notify_exercise BOOLEAN DEFAULT true,
  notify_progress BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT false,
  
  -- Goals stored as JSONB
  user_goals JSONB DEFAULT '[]'::jsonb,
  
  -- AI/nutrition plan cache
  personalized_nutrition_plan JSONB,
  pain_prediction JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEASUREMENTS (daily check-ins)
-- =============================================
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level NUMERIC CHECK (pain_level >= 0 AND pain_level <= 10),
  stiffness_level NUMERIC CHECK (stiffness_level >= 0 AND stiffness_level <= 10),
  function_score NUMERIC CHECK (function_score >= 0 AND function_score <= 10),
  sleep_quality NUMERIC CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  stress_level NUMERIC CHECK (stress_level >= 0 AND stress_level <= 10),
  exercise_done BOOLEAN DEFAULT false,
  exercise_minutes NUMERIC DEFAULT 0,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'poor', 'bad')),
  notes TEXT,
  
  -- Flare detection
  is_flare BOOLEAN DEFAULT false,
  flare_triggers TEXT[] DEFAULT '{}',
  
  -- Completed exercises for the day
  completed_exercises TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One measurement per user per day
  UNIQUE(user_id, date)
);

-- =============================================
-- EXERCISES (reference data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_nl TEXT,
  description_en TEXT,
  instructions_nl TEXT,
  instructions_en TEXT,
  focus_points_nl TEXT[] DEFAULT '{}',
  focus_points_en TEXT[] DEFAULT '{}',
  circle TEXT, -- e.g. 'warmup', 'strength', 'flexibility', 'balance', 'cooldown'
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  sets INTEGER DEFAULT 3,
  reps TEXT, -- e.g. '10-12' or '30 sec'
  duration_minutes INTEGER DEFAULT 5,
  has_video BOOLEAN DEFAULT false,
  video_url TEXT,
  image_url TEXT,
  is_nemex BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  type TEXT DEFAULT 'other',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDICATION LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- =============================================
-- EDUCATION LESSONS (reference data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_nl TEXT,
  content_en TEXT,
  summary_nl TEXT,
  summary_en TEXT,
  key_takeaways_nl TEXT[] DEFAULT '{}',
  key_takeaways_en TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'core' CHECK (category IN ('core', 'advanced')),
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 5,
  icon TEXT DEFAULT 'book',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUPPLEMENTS (reference data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.supplements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_nl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_nl TEXT,
  description_en TEXT,
  dosage_nl TEXT,
  dosage_en TEXT,
  timing_nl TEXT,
  timing_en TEXT,
  benefits_nl TEXT[] DEFAULT '{}',
  benefits_en TEXT[] DEFAULT '{}',
  interactions_nl TEXT,
  interactions_en TEXT,
  contraindications_nl TEXT,
  contraindications_en TEXT,
  evidence_level TEXT DEFAULT 'moderate' CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'insufficient')),
  category TEXT DEFAULT 'general',
  is_premium BOOLEAN DEFAULT false,
  safety_notes_nl TEXT,
  safety_notes_en TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile; therapists can read linked patients
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Therapists can view linked patients"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS therapist
      WHERE therapist.id = auth.uid()
        AND therapist.role = 'therapist'
        AND public.profiles.therapist_email = therapist.email
    )
  );

-- Measurements: users can CRUD own measurements; therapists can read linked patients
CREATE POLICY "Users can view own measurements"
  ON public.measurements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own measurements"
  ON public.measurements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own measurements"
  ON public.measurements FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own measurements"
  ON public.measurements FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Therapists can view patient measurements"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS patient
      JOIN public.profiles AS therapist ON therapist.id = auth.uid()
      WHERE patient.id = public.measurements.user_id
        AND therapist.role = 'therapist'
        AND patient.therapist_email = therapist.email
    )
  );

-- Medications: users can CRUD own medications
CREATE POLICY "Users can manage own medications"
  ON public.medications FOR ALL
  USING (user_id = auth.uid());

-- Medication logs: users can CRUD own logs
CREATE POLICY "Users can manage own medication logs"
  ON public.medication_logs FOR ALL
  USING (user_id = auth.uid());

-- Exercises: everyone can read
CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

-- Lessons: everyone can read
CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  USING (true);

-- Supplements: everyone can read
CREATE POLICY "Anyone can view supplements"
  ON public.supplements FOR SELECT
  USING (true);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_user_created ON public.measurements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user ON public.medications(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date ON public.medication_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_therapist_email ON public.profiles(therapist_email) WHERE therapist_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================
-- FUNCTION: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA: Core Lessons
-- =============================================
INSERT INTO public.lessons (key, title_nl, title_en, content_nl, content_en, summary_nl, summary_en, key_takeaways_nl, key_takeaways_en, category, sort_order, duration_minutes, icon) VALUES
('arthritis_basics', 'Wat is Artrose?', 'What is Arthritis?', 
  'Artrose is een aandoening waarbij het kraakbeen in je gewrichten slijt. Dit is een normaal proces dat bij veel mensen voorkomt, maar het hoeft geen zin te doen. Het kraakbeen in je gewrichten is als een kussen dat de botten beschermt. Bij artrose wordt dit kussen dunner, waardoor de botten dichter bij elkaar komen. Dit kan leiden tot pijn, stijfheid en verminderde beweeglijkheid. Maar het goede nieuws is: je kunt veel doen om je klachten te verminderen!',
  'Osteoarthritis is a condition where the cartilage in your joints wears down. This is a normal process that occurs in many people, but it doesn''t have to be painful. The cartilage in your joints acts like a cushion protecting your bones. In osteoarthritis, this cushion becomes thinner, bringing bones closer together. This can lead to pain, stiffness and reduced mobility. But the good news is: there is a lot you can do to reduce your symptoms!',
  'Leer de basis over artrose en waarom het niet het einde hoeft te zijn.', 'Learn the basics about osteoarthritis and why it doesn''t have to be the end.',
  ARRAY['Artrose is normaal en komt veel voor', 'Pijn betekent niet altijd schade', 'Beweging is de beste medicijn', 'Je kunt veel zelf doen'],
  ARRAY['Osteoarthritis is normal and common', 'Pain does not always mean damage', 'Exercise is the best medicine', 'There is a lot you can do yourself'],
  'core', 1, 5, 'book'),
('movement_myth', 'Mythe: Rust is het Beste', 'Myth: Rest is Best',
  'Een van de grootste misverstanden over artrose is dat je moet rusten. Het tegendeel is waar! Beweging is de allerbeste behandeling voor artrose. Wanneer je beweegt, produceren je gewrichten gewrichtsvloeistof die het kraakbeen voedt. Zonder beweging droogt het kraakbeen uit en wordt het kwetsbaarder. Denk aan je gewricht als een spons: je moet het samenpersen en loslaten om het gezond te houden.',
  'One of the biggest misconceptions about osteoarthritis is that you should rest. The opposite is true! Exercise is the very best treatment for osteoarthritis. When you move, your joints produce synovial fluid that nourishes the cartilage. Without movement, the cartilage dries out and becomes more vulnerable. Think of your joint like a sponge: you need to compress and release it to keep it healthy.',
  'Ontdek waarom bewegen beter is dan rusten bij artrose.', 'Discover why movement is better than rest for osteoarthritis.',
  ARRAY['Bewegen is beter dan rusten', 'Je gewrichten hebben beweging nodig', 'Begin rustig en bouw op', 'Pijn tijdens bewegen is normaal en niet gevaarlijk'],
  ARRAY['Movement is better than rest', 'Your joints need movement', 'Start slowly and build up', 'Pain during exercise is normal and not dangerous'],
  'core', 2, 5, 'activity'),
('pain_science', 'Pijnwetenschap', 'Pain Science',
  'Pijn is een alarmsignaal van je brein, maar het betekent niet altijd dat er schade is. Bij artrose kan je zenuwstelsel overgevoelig worden, waardoor je meer pijn voelt dan er daadwerkelijke schade is. Dit heet centrale sensitisatie. Door te begrijpen hoe pijn werkt, kun je er beter mee omgaan. Stress, slaapgebrek en angst kunnen allemaal pijn verergeren. Ontspanning, goede slaap en geleidelijk meer bewegen kunnen de pijn verminderen.',
  'Pain is an alarm signal from your brain, but it does not always mean there is damage. In osteoarthritis, your nervous system can become oversensitive, causing you to feel more pain than the actual damage warrants. This is called central sensitization. By understanding how pain works, you can manage it better. Stress, lack of sleep and anxiety can all worsen pain. Relaxation, good sleep and gradually increasing activity can reduce pain.',
  'Begrijp hoe pijn werkt en waarom meer pijn niet altijd meer schade betekent.', 'Understand how pain works and why more pain does not always mean more damage.',
  ARRAY['Pijn is niet altijd gelijk aan schade', 'Je brein kan pijn versterken', 'Stress en slaap beinvloeden pijn', 'Kennis over pijn vermindert pijn'],
  ARRAY['Pain does not always equal damage', 'Your brain can amplify pain', 'Stress and sleep affect pain', 'Knowledge about pain reduces pain'],
  'core', 3, 5, 'brain')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- SEED DATA: Sample Exercises (NEMEX-TJR)
-- =============================================
INSERT INTO public.exercises (title_nl, title_en, description_nl, description_en, instructions_nl, instructions_en, circle, level, sets, reps, duration_minutes, is_nemex, sort_order, focus_points_nl, focus_points_en) VALUES
('Opwarming - Fietsen', 'Warmup - Cycling', 'Rustig fietsen op een hometrainer om de gewrichten op te warmen.', 'Easy cycling on a stationary bike to warm up the joints.', 'Fiets 5 minuten op een rustig tempo. Houd je rug recht en je schouders ontspannen.', 'Cycle for 5 minutes at an easy pace. Keep your back straight and shoulders relaxed.', 'warmup', 1, 1, '5 min', 5, true, 1, ARRAY['Rustig tempo', 'Rechte rug', 'Ontspannen schouders'], ARRAY['Easy pace', 'Straight back', 'Relaxed shoulders']),
('Kniebuigingen', 'Knee Bends', 'Mini squats om de bovenbenen te versterken.', 'Mini squats to strengthen the upper legs.', 'Sta met voeten op heupbreedte. Buig langzaam je knieen alsof je gaat zitten. Ga niet verder dan 45 graden. Kom langzaam weer omhoog.', 'Stand with feet hip-width apart. Slowly bend your knees as if sitting down. Don''t go past 45 degrees. Come back up slowly.', 'strength', 1, 3, '10-12', 5, true, 2, ARRAY['Knieen niet voorbij tenen', 'Langzaam bewegen', 'Adem regelmatig'], ARRAY['Knees not past toes', 'Move slowly', 'Breathe regularly']),
('Beenheffen Zijwaarts', 'Side Leg Raises', 'Versterk de heupspieren voor meer stabiliteit.', 'Strengthen hip muscles for more stability.', 'Sta recht en houd je vast aan een stoel. Hef je been zijwaarts op zonder je bovenlichaam te kantelen. Houd 2 seconden vast en laat langzaam zakken.', 'Stand straight and hold onto a chair. Raise your leg sideways without tilting your upper body. Hold for 2 seconds and lower slowly.', 'strength', 1, 3, '10 per been', 5, true, 3, ARRAY['Bovenlichaam recht', 'Gecontroleerde beweging', 'Niet zwaaien'], ARRAY['Upper body straight', 'Controlled movement', 'Don''t swing']),
('Hamstring Stretch', 'Hamstring Stretch', 'Rek de achterkant van je bovenbeen.', 'Stretch the back of your upper leg.', 'Zit op de rand van een stoel. Strek een been naar voren met de hiel op de grond. Leun met een rechte rug naar voren tot je een rek voelt.', 'Sit on the edge of a chair. Extend one leg forward with heel on the floor. Lean forward with a straight back until you feel a stretch.', 'flexibility', 1, 2, '30 sec per been', 5, true, 4, ARRAY['Rechte rug', 'Geen pijn, alleen rek', 'Adem door'], ARRAY['Straight back', 'No pain, only stretch', 'Keep breathing']),
('Balans op Een Been', 'Single Leg Balance', 'Verbeter je balans en proprioceptie.', 'Improve your balance and proprioception.', 'Sta op een been naast een stoel (voor veiligheid). Houd 30 seconden vol. Wissel van been.', 'Stand on one leg next to a chair (for safety). Hold for 30 seconds. Switch legs.', 'balance', 1, 2, '30 sec per been', 3, true, 5, ARRAY['Gebruik stoel als backup', 'Blik vooruit', 'Ontspannen ademen'], ARRAY['Use chair as backup', 'Look straight ahead', 'Relaxed breathing']),
('Cooldown - Wandelen', 'Cooldown - Walking', 'Rustig wandelen om af te koelen.', 'Easy walking to cool down.', 'Loop 3-5 minuten op een rustig tempo. Laat je hartslag zakken en adem rustig.', 'Walk for 3-5 minutes at an easy pace. Let your heart rate come down and breathe easily.', 'cooldown', 1, 1, '3-5 min', 5, true, 6, ARRAY['Rustig tempo', 'Diepe ademhaling', 'Geniet van het moment'], ARRAY['Easy pace', 'Deep breathing', 'Enjoy the moment'])
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA: Supplements
-- =============================================
INSERT INTO public.supplements (name_nl, name_en, description_nl, description_en, dosage_nl, dosage_en, timing_nl, timing_en, benefits_nl, benefits_en, evidence_level, category, is_premium, safety_notes_nl, safety_notes_en) VALUES
('Glucosamine', 'Glucosamine', 'Glucosamine is een natuurlijke stof die voorkomt in het kraakbeen. Het wordt vaak gebruikt bij artrose.', 'Glucosamine is a natural substance found in cartilage. It is commonly used for osteoarthritis.', '1500 mg per dag', '1500 mg per day', 'Bij het ontbijt', 'With breakfast', ARRAY['Kan kraakbeenslijtage vertragen', 'Kan pijn verminderen', 'Weinig bijwerkingen'], ARRAY['May slow cartilage wear', 'May reduce pain', 'Few side effects'], 'moderate', 'joint_support', false, 'Niet gebruiken bij schaaldierallergie. Kan interactie hebben met bloedverdunners.', 'Do not use if allergic to shellfish. May interact with blood thinners.'),
('Omega-3 Visolie', 'Omega-3 Fish Oil', 'Omega-3 vetzuren hebben ontstekingsremmende eigenschappen die kunnen helpen bij artrose.', 'Omega-3 fatty acids have anti-inflammatory properties that may help with osteoarthritis.', '2000-3000 mg EPA+DHA per dag', '2000-3000 mg EPA+DHA per day', 'Bij de maaltijd', 'With meals', ARRAY['Vermindert ontsteking', 'Kan pijn verminderen', 'Goed voor hart en vaten'], ARRAY['Reduces inflammation', 'May reduce pain', 'Good for cardiovascular health'], 'strong', 'anti_inflammatory', false, 'Kan interactie hebben met bloedverdunners. Neem niet meer dan de aanbevolen dosis.', 'May interact with blood thinners. Do not exceed recommended dose.'),
('Curcumine', 'Curcumin', 'Curcumine is de werkzame stof in kurkuma met sterke ontstekingsremmende eigenschappen.', 'Curcumin is the active compound in turmeric with strong anti-inflammatory properties.', '500-1000 mg per dag (met piperine)', '500-1000 mg per day (with piperine)', 'Bij de maaltijd, verdeeld over de dag', 'With meals, spread throughout the day', ARRAY['Sterke ontstekingsremmer', 'Kan pijn verminderen', 'Antioxidant'], ARRAY['Strong anti-inflammatory', 'May reduce pain', 'Antioxidant'], 'moderate', 'anti_inflammatory', false, 'Kan maagklachten veroorzaken. Niet combineren met bloedverdunners zonder overleg met arts.', 'May cause stomach issues. Do not combine with blood thinners without consulting your doctor.'),
('Vitamine D', 'Vitamin D', 'Vitamine D is essentieel voor sterke botten en kan helpen bij artrose.', 'Vitamin D is essential for strong bones and may help with osteoarthritis.', '1000-2000 IE per dag', '1000-2000 IU per day', 'Bij het ontbijt of lunch', 'With breakfast or lunch', ARRAY['Essentieel voor botten', 'Ondersteunt immuunsysteem', 'Veel Nederlanders hebben tekort'], ARRAY['Essential for bones', 'Supports immune system', 'Many people are deficient'], 'strong', 'bone_health', false, 'Laat je vitamine D-spiegel controleren door je arts. Neem niet meer dan 4000 IE zonder medisch advies.', 'Have your vitamin D level checked by your doctor. Do not take more than 4000 IU without medical advice.')
ON CONFLICT DO NOTHING;
