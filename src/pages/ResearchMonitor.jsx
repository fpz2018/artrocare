import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical, Search, RefreshCw, CheckCircle, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Eye, Sparkles,
  Clock, FileText, BarChart3, AlertTriangle, Loader2,
  BookOpen, Send, Archive, Filter
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label_nl: 'Wachtrij', label_en: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  summarizing: { label_nl: 'Samenvatten...', label_en: 'Summarizing...', color: 'bg-yellow-100 text-yellow-700', icon: Loader2 },
  ready_for_review: { label_nl: 'Te reviewen', label_en: 'Ready for review', color: 'bg-blue-100 text-blue-700', icon: Eye },
  approved: { label_nl: 'Goedgekeurd', label_en: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label_nl: 'Afgewezen', label_en: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  archived: { label_nl: 'Gearchiveerd', label_en: 'Archived', color: 'bg-gray-100 text-gray-500', icon: Archive },
};

const EVIDENCE_LABELS = {
  systematic_review: { nl: 'Systematische Review', en: 'Systematic Review', color: 'bg-purple-100 text-purple-700' },
  meta_analysis: { nl: 'Meta-analyse', en: 'Meta-analysis', color: 'bg-purple-100 text-purple-700' },
  rct: { nl: 'RCT', en: 'RCT', color: 'bg-blue-100 text-blue-700' },
  cohort: { nl: 'Cohort studie', en: 'Cohort study', color: 'bg-cyan-100 text-cyan-700' },
  case_control: { nl: 'Case-control', en: 'Case-control', color: 'bg-teal-100 text-teal-700' },
  case_report: { nl: 'Case report', en: 'Case report', color: 'bg-gray-100 text-gray-600' },
  expert_opinion: { nl: 'Expert opinie', en: 'Expert opinion', color: 'bg-gray-100 text-gray-600' },
};

const CATEGORY_LABELS = {
  exercise: { nl: 'Bewegen', en: 'Exercise', color: 'bg-green-100 text-green-700' },
  nutrition: { nl: 'Voeding', en: 'Nutrition', color: 'bg-orange-100 text-orange-700' },
  supplements: { nl: 'Supplementen', en: 'Supplements', color: 'bg-yellow-100 text-yellow-700' },
  pain_management: { nl: 'Pijnmanagement', en: 'Pain management', color: 'bg-red-100 text-red-700' },
  surgery: { nl: 'Chirurgie', en: 'Surgery', color: 'bg-pink-100 text-pink-700' },
  rehabilitation: { nl: 'Revalidatie', en: 'Rehabilitation', color: 'bg-indigo-100 text-indigo-700' },
  treatment: { nl: 'Begeleiding', en: 'Treatment', color: 'bg-blue-100 text-blue-700' },
  diagnosis: { nl: 'Inzicht', en: 'Diagnosis', color: 'bg-cyan-100 text-cyan-700' },
  prevention: { nl: 'Preventie', en: 'Prevention', color: 'bg-emerald-100 text-emerald-700' },
};

function RelevanceBar({ score }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}%</span>
    </div>
  );
}

function PaperCard({ paper, language, onApprove, onReject, onResummarize, isUpdating }) {
  const [expanded, setExpanded] = useState(false);
  const lang = language === 'nl' ? 'nl' : 'en';
  const summary = paper[`summary_${lang}`];
  const findings = paper[`key_findings_${lang}`] || [];
  const relevance = paper[`clinical_relevance_${lang}`];
  const status = STATUS_CONFIG[paper.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <Card className={`transition-all ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-xs ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status[`label_${lang}`]}
              </Badge>
              {paper.evidence_level && EVIDENCE_LABELS[paper.evidence_level] && (
                <Badge className={`text-xs ${EVIDENCE_LABELS[paper.evidence_level].color}`}>
                  {EVIDENCE_LABELS[paper.evidence_level][lang]}
                </Badge>
              )}
              {(paper.categories || []).slice(0, 2).map(cat => (
                <Badge key={cat} className={`text-xs ${CATEGORY_LABELS[cat]?.color || 'bg-gray-100 text-gray-600'}`}>
                  {CATEGORY_LABELS[cat]?.[lang] || cat}
                </Badge>
              ))}
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-snug">{paper.title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {(paper.authors || []).slice(0, 3).join(', ')}
              {(paper.authors || []).length > 3 && ' et al.'}
              {paper.journal && ` · ${paper.journal}`}
              {paper.publication_date && ` · ${new Date(paper.publication_date).getFullYear()}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <RelevanceBar score={paper.relevance_score || 0} />
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* AI Summary */}
            {summary && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  {lang === 'nl' ? 'AI Samenvatting' : 'AI Summary'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            )}

            {/* Key Findings */}
            {findings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {lang === 'nl' ? 'Belangrijkste bevindingen' : 'Key Findings'}
                </h4>
                <ul className="space-y-1">
                  {findings.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Relevance */}
            {relevance && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">
                  {lang === 'nl' ? 'Praktische relevantie' : 'Practical Relevance'}
                </h4>
                <p className="text-sm text-blue-700">{relevance}</p>
              </div>
            )}

            {/* Abstract */}
            {paper.abstract && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800">
                  {lang === 'nl' ? 'Origineel abstract tonen' : 'Show original abstract'}
                </summary>
                <p className="mt-2 whitespace-pre-line">{paper.abstract}</p>
              </details>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
              {paper.status === 'ready_for_review' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onApprove(paper.id)}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {lang === 'nl' ? 'Goedkeuren' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onReject(paper.id)}
                    disabled={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {lang === 'nl' ? 'Afwijzen' : 'Reject'}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResummarize(paper.id)}
                disabled={isUpdating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {lang === 'nl' ? 'Opnieuw samenvatten' : 'Re-summarize'}
              </Button>
              {paper.url && (
                <a href={paper.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    PubMed
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResearchMonitor() {
  const { user, profile } = useAuth();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingPapers, setFetchingPapers] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  const lang = language === 'nl' ? 'nl' : 'en';

  // Check if user is therapist/admin
  const isAuthorized = profile?.role === 'therapist' || profile?.role === 'admin';

  // Fetch all papers
  const { data: papers = [], isLoading: papersLoading } = useQuery({
    queryKey: ['research-papers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized,
  });

  // Fetch search queries
  const { data: searchQueries = [] } = useQuery({
    queryKey: ['research-queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_queries')
        .select('*')
        .order('query_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized,
  });

  // Fetch log
  const { data: fetchLog = [] } = useQuery({
    queryKey: ['research-fetch-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_fetch_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized,
  });

  // Update paper status
  const updateStatus = useMutation({
    mutationFn: async ({ paperId, status, notes }) => {
      const { error } = await supabase
        .from('research_papers')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paperId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-papers'] }),
  });

  // Trigger paper fetch
  const triggerFetch = useCallback(async (queryId = null) => {
    setFetchingPapers(true);
    setFetchResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const body = queryId
        ? { action: 'fetch_and_summarize', query_id: queryId }
        : { action: 'fetch_all_queries' };

      const res = await fetch('/.netlify/functions/research-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setFetchResult(data);

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['research-papers'] });
        queryClient.invalidateQueries({ queryKey: ['research-fetch-log'] });
      }
    } catch (err) {
      setFetchResult({ error: err.message });
    } finally {
      setFetchingPapers(false);
    }
  }, [queryClient]);

  // Re-summarize a paper
  const resummarize = useCallback(async (paperId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/research-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: 'summarize_paper', paper_id: paperId }),
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['research-papers'] });
      }
    } catch (err) {
      console.error('Re-summarize error:', err);
    }
  }, [queryClient]);

  // Filter papers
  const filteredPapers = papers.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && !(p.categories || []).includes(categoryFilter)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.title?.toLowerCase().includes(term) ||
        p[`summary_${lang}`]?.toLowerCase().includes(term) ||
        (p.authors || []).some(a => a.toLowerCase().includes(term));
    }
    return true;
  });

  // Stats
  const stats = {
    total: papers.length,
    pending: papers.filter(p => p.status === 'pending' || p.status === 'ready_for_review').length,
    approved: papers.filter(p => p.status === 'approved').length,
    avgRelevance: papers.length ? Math.round(papers.reduce((s, p) => s + (p.relevance_score || 0), 0) / papers.length) : 0,
  };

  if (!isAuthorized) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold">
          {lang === 'nl' ? 'Alleen voor therapeuten' : 'Therapists only'}
        </h2>
        <p className="text-gray-500 mt-2">
          {lang === 'nl'
            ? 'De Research Monitor is alleen beschikbaar voor therapeuten en administrators.'
            : 'The Research Monitor is only available for therapists and administrators.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-purple-600" />
            {lang === 'nl' ? 'Research Monitor' : 'Research Monitor'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'nl'
              ? 'Automatisch wetenschappelijk onderzoek ophalen, samenvatten en reviewen'
              : 'Automatically fetch, summarize and review scientific research'}
          </p>
        </div>
        <Button
          onClick={() => triggerFetch()}
          disabled={fetchingPapers}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {fetchingPapers ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{lang === 'nl' ? 'Ophalen...' : 'Fetching...'}</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />{lang === 'nl' ? 'Nieuwe papers ophalen' : 'Fetch new papers'}</>
          )}
        </Button>
      </div>

      {/* Fetch result notification */}
      {fetchResult && (
        <Card className={fetchResult.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="p-4">
            {fetchResult.error ? (
              <p className="text-sm text-red-700">❌ {fetchResult.error}</p>
            ) : fetchResult.stats ? (
              <p className="text-sm text-green-700">
                ✅ {lang === 'nl'
                  ? `${fetchResult.stats.found} papers gevonden, ${fetchResult.stats.new} nieuw, ${fetchResult.stats.summarized} samengevat`
                  : `${fetchResult.stats.found} papers found, ${fetchResult.stats.new} new, ${fetchResult.stats.summarized} summarized`}
              </p>
            ) : (
              <p className="text-sm text-green-700">
                ✅ {lang === 'nl' ? 'Alle zoekopdrachten verwerkt' : 'All queries processed'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">{lang === 'nl' ? 'Totaal papers' : 'Total papers'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-gray-500">{lang === 'nl' ? 'Te reviewen' : 'To review'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-xs text-gray-500">{lang === 'nl' ? 'Goedgekeurd' : 'Approved'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.avgRelevance}%</p>
            <p className="text-xs text-gray-500">{lang === 'nl' ? 'Gem. relevantie' : 'Avg. relevance'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="papers">
        <TabsList>
          <TabsTrigger value="papers">
            <FileText className="w-4 h-4 mr-1" />
            {lang === 'nl' ? 'Papers' : 'Papers'} ({filteredPapers.length})
          </TabsTrigger>
          <TabsTrigger value="queries">
            <Search className="w-4 h-4 mr-1" />
            {lang === 'nl' ? 'Zoekopdrachten' : 'Queries'} ({searchQueries.length})
          </TabsTrigger>
          <TabsTrigger value="log">
            <Clock className="w-4 h-4 mr-1" />
            {lang === 'nl' ? 'Logboek' : 'Log'}
          </TabsTrigger>
        </TabsList>

        {/* Papers tab */}
        <TabsContent value="papers" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={lang === 'nl' ? 'Zoek in papers...' : 'Search papers...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded-md px-3 py-2 bg-white"
            >
              <option value="all">{lang === 'nl' ? 'Alle statussen' : 'All statuses'}</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val[`label_${lang}`]}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border rounded-md px-3 py-2 bg-white"
            >
              <option value="all">{lang === 'nl' ? 'Alle categorieën' : 'All categories'}</option>
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val[lang]}</option>
              ))}
            </select>
          </div>

          {/* Paper list */}
          {papersLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 mx-auto animate-spin" />
              <p className="text-sm text-gray-500 mt-2">{lang === 'nl' ? 'Papers laden...' : 'Loading papers...'}</p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-700">
                  {lang === 'nl' ? 'Geen papers gevonden' : 'No papers found'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {lang === 'nl'
                    ? 'Klik op "Nieuwe papers ophalen" om wetenschappelijk onderzoek op te halen.'
                    : 'Click "Fetch new papers" to retrieve scientific research.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPapers.map(paper => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  language={language}
                  onApprove={(id) => updateStatus.mutate({ paperId: id, status: 'approved' })}
                  onReject={(id) => updateStatus.mutate({ paperId: id, status: 'rejected' })}
                  onResummarize={resummarize}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Queries tab */}
        <TabsContent value="queries" className="space-y-4">
          {searchQueries.map(q => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{q.query_name}</h3>
                    <p className="text-xs text-gray-500 mt-1 font-mono break-all">{q.pubmed_query}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Max: {q.max_results} results</span>
                      <span>Every {q.fetch_frequency_days} days</span>
                      {q.last_fetched_at && (
                        <span>Last: {new Date(q.last_fetched_at).toLocaleDateString('nl-NL')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerFetch(q.id)}
                    disabled={fetchingPapers}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {lang === 'nl' ? 'Uitvoeren' : 'Run'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Log tab */}
        <TabsContent value="log" className="space-y-3">
          {fetchLog.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {lang === 'nl' ? 'Nog geen ophaalacties uitgevoerd.' : 'No fetch actions performed yet.'}
              </CardContent>
            </Card>
          ) : (
            fetchLog.map(log => (
              <Card key={log.id}>
                <CardContent className="p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(log.created_at).toLocaleString('nl-NL')}</span>
                    </div>
                    <span className="text-xs text-gray-400">{log.duration_ms}ms</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>📄 {log.papers_found} gevonden</span>
                    <span>🆕 {log.papers_new} nieuw</span>
                    <span>🤖 {log.papers_summarized} samengevat</span>
                    {(log.errors || []).length > 0 && (
                      <span className="text-red-500">⚠️ {log.errors.length} errors</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
