import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Clock, Zap, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, FileText, Database, Sparkles,
  Quote, BarChart3, FolderOpen, RefreshCw, Users
} from 'lucide-react';

// ─── Constanten ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Wacht op beoordeling', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Goedgekeurd',          color: 'bg-blue-100 text-blue-800',    icon: CheckCircle },
  rejected: { label: 'Afgewezen',            color: 'bg-red-100 text-red-800',      icon: XCircle },
  applied:  { label: 'Toegepast',            color: 'bg-green-100 text-green-800',  icon: Zap },
};

const SOURCE_STATUS_CONFIG = {
  pending:    { label: 'Wacht',       color: 'bg-gray-100 text-gray-600' },
  extracting: { label: 'Extracteren', color: 'bg-yellow-100 text-yellow-700' },
  analyzing:  { label: 'Analyseren',  color: 'bg-blue-100 text-blue-700' },
  done:       { label: 'Klaar',       color: 'bg-green-100 text-green-700' },
  error:      { label: 'Fout',        color: 'bg-red-100 text-red-700' },
};

const TARGET_TABLE_LABELS = {
  supplements: { label: 'Supplement',  color: 'bg-yellow-100 text-yellow-700' },
  exercises:   { label: 'Oefening',    color: 'bg-green-100 text-green-700' },
  lessons:     { label: 'Les',         color: 'bg-purple-100 text-purple-700' },
};

const SOURCE_TYPE_LABELS = {
  pdf:     'PDF',
  youtube: 'YouTube',
  article: 'Artikel',
  url:     'URL',
  manual:  'Handmatig',
};

// Menselijk leesbare namen voor databaseveldnamen
const FIELD_LABELS = {
  name_nl: 'Naam (NL)', name_en: 'Naam (EN)',
  description_nl: 'Beschrijving (NL)', description_en: 'Beschrijving (EN)',
  dosage_nl: 'Dosering (NL)', dosage_en: 'Dosering (EN)',
  timing_nl: 'Tijdstip (NL)', timing_en: 'Tijdstip (EN)',
  benefits_nl: 'Voordelen (NL)', benefits_en: 'Voordelen (EN)',
  interactions_nl: 'Interacties (NL)', interactions_en: 'Interacties (EN)',
  contraindications_nl: 'Contra-indicaties (NL)',
  evidence_level: 'Bewijs niveau',
  safety_notes_nl: 'Veiligheidsinfo (NL)', safety_notes_en: 'Veiligheidsinfo (EN)',
  title_nl: 'Titel (NL)', title_en: 'Titel (EN)',
  instructions_nl: 'Instructies (NL)', instructions_en: 'Instructies (EN)',
  focus_points_nl: 'Aandachtspunten (NL)',
  sets: 'Sets', reps: 'Herhalingen', level: 'Niveau',
  duration_minutes: 'Duur (minuten)',
  content_nl: 'Inhoud (NL)', content_en: 'Inhoud (EN)',
  summary_nl: 'Samenvatting (NL)', summary_en: 'Samenvatting (EN)',
  key_takeaways_nl: 'Leerpunten (NL)', key_takeaways_en: 'Leerpunten (EN)',
  category: 'Categorie', is_premium: 'Premium',
};

// ─── Subcomponenten ──────────────────────────────────────────────────────────

function ConfidenceBar({ score }) {
  if (score == null) return null;
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}%</span>
    </div>
  );
}

function DiffView({ currentValues, proposedValues }) {
  const keys = Object.keys(proposedValues || {});
  if (keys.length === 0) return null;

  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const current = currentValues?.[key];
        const proposed = proposedValues[key];
        const label = FIELD_LABELS[key] || key;
        const isArray = Array.isArray(proposed) || Array.isArray(current);

        const displayValue = (val) => {
          if (val == null || val === '') return <span className="italic text-gray-400">leeg</span>;
          if (Array.isArray(val)) return val.join(', ');
          return String(val);
        };

        return (
          <div key={key}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                <p className="text-xs text-red-500 font-medium mb-1">Huidig</p>
                <p className="text-gray-700 leading-snug">{displayValue(current)}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                <p className="text-xs text-green-600 font-medium mb-1">Voorgesteld</p>
                <p className="text-gray-900 font-medium leading-snug">{displayValue(proposed)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProposalCard({ proposal, onApprove, onReject, onApply, isUpdating }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(proposal.reviewer_notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const tableConfig = TARGET_TABLE_LABELS[proposal.target_table] || { label: proposal.target_table, color: 'bg-gray-100 text-gray-600' };

  return (
    <Card className={`transition-all ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className={`text-xs ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              <Badge className={`text-xs ${tableConfig.color}`}>
                {tableConfig.label}
              </Badge>
              {proposal.target_record_name && (
                <Badge variant="outline" className="text-xs">
                  {proposal.target_record_name}
                </Badge>
              )}
            </div>

            {/* Samenvatting */}
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {proposal.change_summary_nl}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <ConfidenceBar score={proposal.confidence_score} />
              <span className="text-xs text-gray-400">
                {new Date(proposal.created_at).toLocaleDateString('nl-NL')}
              </span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Uitgevouwen inhoud */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">

            {/* Diff */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Wijzigingen</h4>
              <DiffView
                currentValues={proposal.current_values}
                proposedValues={proposal.proposed_values}
              />
            </div>

            {/* AI redenering */}
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-1 mb-1">
                <Sparkles className="w-4 h-4" />
                AI-onderbouwing
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">{proposal.ai_reasoning_nl}</p>
            </div>

            {/* Bewijs quote */}
            {proposal.evidence_quote && (
              <div className="border-l-4 border-gray-300 pl-3">
                <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1">
                  <Quote className="w-3 h-3" />
                  Uit de bron
                </h4>
                <p className="text-sm text-gray-600 italic leading-relaxed">{proposal.evidence_quote}</p>
              </div>
            )}

            {/* Aantekeningen */}
            {proposal.reviewer_notes && !showNotes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Jouw aantekeningen</p>
                <p className="text-sm text-gray-700">{proposal.reviewer_notes}</p>
              </div>
            )}

            {showNotes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Aantekeningen toevoegen</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optioneel: noteer waarom je goedkeurt of afwijst..."
                  className="text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Acties */}
            {proposal.status === 'pending' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(proposal.id, notes)}
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Goedkeuren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onReject(proposal.id, notes)}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Afwijzen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  {showNotes ? 'Verberg notities' : 'Notities toevoegen'}
                </Button>
              </div>
            )}

            {proposal.status === 'approved' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onApply(proposal.id)}
                  disabled={isUpdating}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Nu toepassen in live app
                </Button>
                <p className="text-xs text-gray-400 self-center">
                  Dit wijzigt direct de database — patiënten zien de update meteen.
                </p>
              </div>
            )}

            {proposal.status === 'applied' && proposal.applied_at && (
              <p className="text-xs text-green-600 pt-2 border-t">
                Toegepast op {new Date(proposal.applied_at).toLocaleString('nl-NL')}
              </p>
            )}

            {proposal.status === 'rejected' && proposal.reviewed_at && (
              <p className="text-xs text-red-500 pt-2 border-t">
                Afgewezen op {new Date(proposal.reviewed_at).toLocaleString('nl-NL')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SourceCard({ source }) {
  const statusConfig = SOURCE_STATUS_CONFIG[source.processing_status] || SOURCE_STATUS_CONFIG.pending;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</Badge>
              <Badge variant="outline" className="text-xs">
                {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-gray-900">{source.title}</p>
            {source.source_url && (
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline truncate block mt-0.5"
              >
                {source.source_url}
              </a>
            )}
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              {source.word_count && <span>{source.word_count.toLocaleString('nl-NL')} woorden</span>}
              <span>{source.proposals_generated ?? 0} voorstellen aangemaakt</span>
              <span>{new Date(source.created_at).toLocaleDateString('nl-NL')}</span>
            </div>
            {source.error_message && (
              <p className="text-xs text-red-500 mt-1">{source.error_message}</p>
            )}
          </div>
          <FolderOpen className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function ContentProposals() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const isAdmin = profile?.role === 'admin';

  // ── Data ophalen ──────────────────────────────────────────────────────────

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['content-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: waitlist = [], isLoading: waitlistLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['content-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // ── Mutaties ──────────────────────────────────────────────────────────────

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const { data, error } = await supabase
        .from('content_proposals')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update geblokkeerd — controleer RLS-rechten in Supabase.');
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['content-proposals'] });
      toast.success(status === 'approved' ? 'Voorstel goedgekeurd' : 'Voorstel afgewezen');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const applyProposal = useMutation({
    mutationFn: async (proposalId) => {
      const { data, error } = await supabase
        .rpc('apply_content_proposal', { proposal_id: proposalId });
      if (error) throw error;
      if (!data) throw new Error('Toepassen mislukt — controleer of het voorstel goedgekeurd is.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-proposals'] });
      // Invalideer ook de betreffende data zodat de rest van de app direct ververst
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('Wijziging toegepast — de app is direct bijgewerkt!');
    },
    onError: (err) => toast.error(`Fout bij toepassen: ${err.message}`),
  });

  const isUpdating = updateStatus.isPending || applyProposal.isPending;

  // ── Statistieken ──────────────────────────────────────────────────────────

  const stats = {
    pending:  proposals.filter(p => p.status === 'pending').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    applied:  proposals.filter(p => p.status === 'applied').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  const filtered = statusFilter === 'all'
    ? proposals
    : proposals.filter(p => p.status === statusFilter);

  // ── Toegangsbewaking ──────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">Alleen voor administrators</h2>
        <p className="text-sm text-gray-500 mt-2">
          Deze pagina is alleen toegankelijk voor beheerders.
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-600" />
            Content Beheer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Beoordeel AI-voorstellen en pas goedgekeurde wijzigingen toe in de live app
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['content-proposals'] });
            queryClient.invalidateQueries({ queryKey: ['content-sources'] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Verversen
        </Button>
      </div>

      {/* Statistieken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'pending',  label: 'Te beoordelen', icon: Clock,        color: 'text-yellow-500' },
          { key: 'approved', label: 'Goedgekeurd',   icon: CheckCircle,  color: 'text-blue-500' },
          { key: 'applied',  label: 'Toegepast',     icon: Zap,          color: 'text-green-500' },
          { key: 'rejected', label: 'Afgewezen',     icon: XCircle,      color: 'text-red-400' },
        ].map(({ key, label, icon: Icon, color }) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === key ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <CardContent className="p-4 text-center">
              <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{stats[key]}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">
            <BarChart3 className="w-4 h-4 mr-1" />
            Voorstellen ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="sources">
            <FolderOpen className="w-4 h-4 mr-1" />
            Bronbestanden ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="waitlist">
            <Users className="w-4 h-4 mr-1" />
            Wachtlijst ({waitlist.length})
          </TabsTrigger>
        </TabsList>

        {/* Voorstellen tab */}
        <TabsContent value="proposals" className="space-y-3 mt-4">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',      label: `Alles (${proposals.length})` },
              { key: 'pending',  label: `Te beoordelen (${stats.pending})` },
              { key: 'approved', label: `Goedgekeurd (${stats.approved})` },
              { key: 'applied',  label: `Toegepast (${stats.applied})` },
              { key: 'rejected', label: `Afgewezen (${stats.rejected})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {proposalsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
              <p className="text-sm text-gray-500 mt-2">Voorstellen laden...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600">Geen voorstellen</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {statusFilter === 'pending'
                    ? 'Er zijn geen openstaande voorstellen. Upload een bronbestand via Google Drive om te starten.'
                    : 'Geen voorstellen in deze categorie.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onApprove={(id, notes) => updateStatus.mutate({ id, status: 'approved', notes })}
                onReject={(id, notes) => updateStatus.mutate({ id, status: 'rejected', notes })}
                onApply={(id) => applyProposal.mutate(id)}
                isUpdating={isUpdating}
              />
            ))
          )}
        </TabsContent>

        {/* Wachtlijst tab */}
        <TabsContent value="waitlist" className="mt-4">
          {waitlistLoading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" /></div>
          ) : waitlist.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600">Nog geen aanmeldingen</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-4 text-xs font-semibold text-gray-400 px-4 py-2">
                <span className="w-8">#</span>
                <span className="flex-1">E-mail</span>
                <span className="w-28">Naam / Praktijk</span>
                <span className="w-20">Rol</span>
                <span className="w-28">Datum</span>
              </div>
              {waitlist.map((entry, i) => (
                <Card key={entry.id}>
                  <CardContent className="p-3 flex gap-4 items-center text-sm">
                    <span className="w-8 text-gray-400 text-xs">{i + 1}</span>
                    <span className="flex-1 font-medium text-gray-900">{entry.email}</span>
                    <span className="w-28 text-gray-500 truncate">{entry.name || '—'}</span>
                    <span className={`w-20 text-xs font-semibold px-2 py-0.5 rounded-full ${entry.role === 'practice' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {entry.role === 'practice' ? 'Praktijk' : 'Deelnemer'}
                    </span>
                    <span className="w-28 text-gray-400 text-xs">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bronbestanden tab */}
        <TabsContent value="sources" className="space-y-3 mt-4">
          {sourcesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
            </div>
          ) : sources.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600">Nog geen bronbestanden</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Bestanden die via Google Drive worden verwerkt verschijnen hier automatisch.
                </p>
              </CardContent>
            </Card>
          ) : (
            sources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
