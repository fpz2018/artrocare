-- =============================================
-- Research Monitor - Database Schema Extension
-- Run this AFTER the main schema
-- =============================================

-- =============================================
-- RESEARCH PAPERS (fetched from PubMed)
-- =============================================
CREATE TABLE IF NOT EXISTS public.research_papers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pubmed_id TEXT UNIQUE NOT NULL,
  doi TEXT,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  journal TEXT,
  publication_date DATE,
  abstract TEXT,
  url TEXT,
  
  -- AI-generated content
  summary_nl TEXT,
  summary_en TEXT,
  key_findings_nl TEXT[] DEFAULT '{}',
  key_findings_en TEXT[] DEFAULT '{}',
  clinical_relevance_nl TEXT,
  clinical_relevance_en TEXT,
  
  -- Categorization
  categories TEXT[] DEFAULT '{}',  -- e.g. 'exercise', 'nutrition', 'pain_management', 'surgery', 'supplements'
  relevance_score NUMERIC DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  evidence_level TEXT CHECK (evidence_level IN ('systematic_review', 'rct', 'cohort', 'case_control', 'case_report', 'expert_opinion', 'meta_analysis')),
  
  -- Review workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'summarizing', 'ready_for_review', 'approved', 'rejected', 'archived')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  -- App integration
  applied_to_app BOOLEAN DEFAULT false,
  applied_sections TEXT[] DEFAULT '{}',  -- e.g. 'exercises', 'nutrition', 'supplements', 'education'
  
  -- Metadata
  fetch_batch TEXT,  -- batch identifier for grouping fetches
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESEARCH SEARCH QUERIES (configured searches)
-- =============================================
CREATE TABLE IF NOT EXISTS public.research_queries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_name TEXT NOT NULL,
  pubmed_query TEXT NOT NULL,  -- The actual PubMed search query
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  fetch_frequency_days INTEGER DEFAULT 7,
  max_results INTEGER DEFAULT 20,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESEARCH INSIGHTS (approved findings applied to app)
-- =============================================
CREATE TABLE IF NOT EXISTS public.research_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paper_id UUID REFERENCES public.research_papers(id) ON DELETE CASCADE NOT NULL,
  
  -- The insight
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_nl TEXT NOT NULL,
  description_en TEXT NOT NULL,
  
  -- Where it applies
  target_section TEXT NOT NULL,  -- 'exercises', 'nutrition', 'supplements', 'education', 'general'
  action_type TEXT DEFAULT 'info' CHECK (action_type IN ('info', 'update_recommendation', 'new_exercise', 'new_recipe', 'warning', 'confirmation')),
  
  -- Visibility
  is_published BOOLEAN DEFAULT false,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  
  -- Display
  priority INTEGER DEFAULT 0,
  show_on_dashboard BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESEARCH FETCH LOG (audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS public.research_fetch_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_id UUID REFERENCES public.research_queries(id),
  papers_found INTEGER DEFAULT 0,
  papers_new INTEGER DEFAULT 0,
  papers_summarized INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  duration_ms INTEGER,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_fetch_log ENABLE ROW LEVEL SECURITY;

-- Therapists and admins can manage research
CREATE POLICY "Therapists can view research papers" ON public.research_papers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('therapist', 'admin'))
  );

CREATE POLICY "Therapists can update research papers" ON public.research_papers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('therapist', 'admin'))
  );

CREATE POLICY "System can insert research papers" ON public.research_papers
  FOR INSERT WITH CHECK (true);

-- Patients can see approved insights only
CREATE POLICY "Anyone can view published insights" ON public.research_insights
  FOR SELECT USING (is_published = true);

CREATE POLICY "Therapists can manage insights" ON public.research_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('therapist', 'admin'))
  );

-- Research queries - therapist/admin only
CREATE POLICY "Therapists can manage queries" ON public.research_queries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('therapist', 'admin'))
  );

-- Fetch log - therapist/admin only
CREATE POLICY "Therapists can view fetch log" ON public.research_fetch_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('therapist', 'admin'))
  );

CREATE POLICY "System can insert fetch log" ON public.research_fetch_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_research_papers_status ON public.research_papers(status);
CREATE INDEX IF NOT EXISTS idx_research_papers_pubmed ON public.research_papers(pubmed_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_categories ON public.research_papers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_research_papers_created ON public.research_papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_insights_published ON public.research_insights(is_published, target_section);
CREATE INDEX IF NOT EXISTS idx_research_insights_dashboard ON public.research_insights(show_on_dashboard) WHERE is_published = true;

-- =============================================
-- SEED: Default PubMed search queries
-- =============================================
INSERT INTO public.research_queries (query_name, pubmed_query, category, fetch_frequency_days, max_results) VALUES
  ('Artrose oefentherapie', '(osteoarthritis[MeSH] OR arthrosis) AND (exercise therapy[MeSH] OR physical therapy OR NEMEX) AND (randomized controlled trial[pt] OR meta-analysis[pt])', 'exercise', 7, 15),
  ('Artrose voeding', '(osteoarthritis[MeSH]) AND (diet[MeSH] OR nutrition OR anti-inflammatory diet) AND (clinical trial[pt] OR systematic review[pt])', 'nutrition', 14, 10),
  ('Artrose supplementen', '(osteoarthritis[MeSH]) AND (glucosamine OR omega-3 OR curcumin OR vitamin D OR collagen) AND (randomized controlled trial[pt] OR meta-analysis[pt])', 'supplements', 14, 10),
  ('Artrose pijnmanagement', '(osteoarthritis[MeSH]) AND (pain management[MeSH] OR central sensitization OR pain neuroscience education) AND (2024[pdat] OR 2025[pdat] OR 2026[pdat])', 'pain_management', 7, 15),
  ('Knie artrose behandeling', '(knee osteoarthritis[MeSH]) AND (treatment outcome[MeSH] OR conservative treatment) AND (systematic review[pt] OR meta-analysis[pt]) AND (2024[pdat] OR 2025[pdat] OR 2026[pdat])', 'treatment', 14, 10),
  ('Heup artrose behandeling', '(hip osteoarthritis[MeSH]) AND (treatment outcome[MeSH] OR total hip replacement OR conservative) AND (2024[pdat] OR 2025[pdat] OR 2026[pdat])', 'treatment', 14, 10)
ON CONFLICT DO NOTHING;
