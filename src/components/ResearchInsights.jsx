import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Sparkles, ExternalLink } from 'lucide-react';

export default function ResearchInsights() {
  const { language } = useI18n();
  const lang = language === 'nl' ? 'nl' : 'en';

  const { data: insights = [] } = useQuery({
    queryKey: ['research-insights-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_insights')
        .select(`
          *,
          research_papers!inner(title, journal, publication_date, url, evidence_level)
        `)
        .eq('is_published', true)
        .eq('show_on_dashboard', true)
        .order('priority', { ascending: false })
        .limit(3);

      if (error) {
        // Table might not exist yet
        console.warn('Research insights not available:', error.message);
        return [];
      }
      return data || [];
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Also show latest approved papers if no insights yet
  const { data: latestPapers = [] } = useQuery({
    queryKey: ['research-latest-approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_papers')
        .select('id, title, journal, publication_date, url, summary_nl, summary_en, categories, relevance_score')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.warn('Research papers not available:', error.message);
        return [];
      }
      return data || [];
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const items = insights.length > 0 ? insights : latestPapers;

  if (items.length === 0) return null;

  return (
    <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-purple-800 flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4" />
          {lang === 'nl' ? 'Nieuwste Onderzoeken' : 'Latest Research'}
          <Sparkles className="w-3 h-3 text-purple-400" />
        </h3>

        <div className="space-y-3">
          {items.map((item) => {
            // Handle both insights and papers
            const title = item.title_nl || item.title_en || item.title;
            const description = item.description_nl || item.description_en || item[`summary_${lang}`];
            const paper = item.research_papers || item;
            const url = paper.url || item.url;

            return (
              <div key={item.id} className="bg-white/80 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-xs leading-snug line-clamp-2">
                      {title}
                    </p>
                    {description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {paper.journal && (
                        <span className="text-xs text-gray-400">{paper.journal}</span>
                      )}
                      {paper.publication_date && (
                        <span className="text-xs text-gray-400">
                          {new Date(paper.publication_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400 hover:text-purple-600" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
