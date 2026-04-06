import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video, Play, Loader2, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Zap, Film, Upload, ChevronDown, ChevronUp, Trash2, RotateCcw,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────

const STATUS_CONFIG = {
  pending:              { label: 'Wacht',            labelEn: 'Pending',      color: 'bg-gray-100 text-gray-600',    icon: Clock },
  generating_prompt:    { label: 'Prompt genereren', labelEn: 'Generating prompt', color: 'bg-blue-100 text-blue-700',    icon: Zap },
  sending_to_ai:        { label: 'Naar AI',          labelEn: 'Sending to AI', color: 'bg-blue-100 text-blue-700',    icon: Zap },
  generating_video:     { label: 'Video genereren',  labelEn: 'Generating video', color: 'bg-purple-100 text-purple-700', icon: Film },
  processing_overlays:  { label: 'Overlays',         labelEn: 'Processing overlays', color: 'bg-indigo-100 text-indigo-700', icon: Film },
  uploading:            { label: 'Uploaden',         labelEn: 'Uploading',    color: 'bg-yellow-100 text-yellow-700', icon: Upload },
  done:                 { label: 'Klaar',            labelEn: 'Done',         color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  failed:               { label: 'Mislukt',          labelEn: 'Failed',       color: 'bg-red-100 text-red-600',       icon: XCircle },
};

// ─── Job Card ─────────────────────────────────────────────

function JobCard({ job, exercise, onRetry, isRetrying, t }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const isActive = !['done', 'failed'].includes(job.status);

  return (
    <Card className={`transition-all ${expanded ? 'ring-2 ring-blue-200' : ''} ${isActive ? 'border-l-4 border-l-blue-400' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail / video preview */}
          {job.status === 'done' && job.final_video_url ? (
            <video
              src={job.final_video_url}
              className="w-20 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
              muted
              preload="metadata"
            />
          ) : (
            <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              {isActive ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <Video className="w-5 h-5 text-gray-300" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <Badge className={`text-xs ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {job.trigger_type === 'scheduled' ? 'Auto' : job.trigger_type === 'batch' ? 'Batch' : 'Handmatig'}
              </Badge>
            </div>

            <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
              {exercise?.title_nl || 'Onbekende oefening'}
            </p>

            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{new Date(job.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              {job.duration_seconds && <span>{job.duration_seconds}s video</span>}
              {job.file_size_bytes && <span>{(job.file_size_bytes / 1024 / 1024).toFixed(1)} MB</span>}
              {job.retry_count > 0 && <span className="text-orange-500">Poging {job.retry_count + 1}</span>}
            </div>

            {job.error_message && (
              <p className="text-xs text-red-500 mt-1 line-clamp-2">{job.error_message}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {job.status === 'failed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(job.exercise_id)}
                disabled={isRetrying}
                className="text-blue-500 hover:text-blue-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Prompt */}
            {job.prompt_text && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">AI Video Prompt</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{job.prompt_text}</p>
              </div>
            )}

            {/* Video preview */}
            {job.status === 'done' && job.final_video_url && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Video preview</p>
                <video
                  src={job.final_video_url}
                  controls
                  className="w-full max-h-64 rounded-lg bg-black"
                />
              </div>
            )}

            {/* Provider info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-medium">Provider:</span> {job.provider || 'imagineart'}
              </div>
              {job.provider_job_id && (
                <div>
                  <span className="font-medium">Job ID:</span> {job.provider_job_id}
                </div>
              )}
              {job.started_at && (
                <div>
                  <span className="font-medium">Gestart:</span> {new Date(job.started_at).toLocaleString('nl-NL')}
                </div>
              )}
              {job.completed_at && (
                <div>
                  <span className="font-medium">Klaar:</span> {new Date(job.completed_at).toLocaleString('nl-NL')}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Exercise Selector ────────────────────────────────────

function ExerciseSelector({ exercises, selectedIds, onToggle, onSelectAll, onDeselectAll }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {selectedIds.length} van {exercises.length} geselecteerd
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll} className="text-xs">
            Alles selecteren
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll} className="text-xs">
            Deselecteren
          </Button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
        {exercises.map(ex => (
          <label
            key={ex.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(ex.id)}
              onChange={() => onToggle(ex.id)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{ex.title_nl}</p>
              <p className="text-xs text-gray-400">{ex.circle || 'Geen cirkel'} · Level {ex.level || 1}</p>
            </div>
            {ex.has_video ? (
              <Badge className="bg-green-100 text-green-700 text-xs">Video</Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-gray-400">Geen video</Badge>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function AdminVideoGenerator() {
  const { user, profile } = useAuth();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);

  const isAdmin = profile?.role === 'admin';

  // Fetch video jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['video-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: 15000, // Poll every 15s for active jobs
  });

  // Fetch exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Exercise lookup map
  const exerciseMap = Object.fromEntries(exercises.map(e => [e.id, e]));

  // Generate videos mutation (on-demand)
  const generateMutation = useMutation({
    mutationFn: async (exerciseIds) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessie verlopen');
      const res = await fetch('/.netlify/functions/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          exercise_ids: exerciseIds,
          triggered_by: user.id,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Generatie mislukt';
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-jobs'] });
      setSelectedExerciseIds([]);
      setShowSelector(false);
      toast.success(`${data.succeeded || 0} video's gestart, ${data.failed || 0} mislukt`);
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  // Generate all missing videos
  const generateAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessie verlopen');
      const res = await fetch('/.netlify/functions/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ triggered_by: user.id }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Batch generatie mislukt';
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-jobs'] });
      if (data.processed === 0) {
        toast.info('Alle oefeningen hebben al een video of een actieve job');
      } else {
        toast.success(`${data.succeeded || 0} video's gestart`);
      }
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  // Delete a job
  const deleteMutation = useMutation({
    mutationFn: async (jobId) => {
      const { error } = await supabase.from('video_jobs').delete().eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-jobs'] });
      toast.success('Job verwijderd');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  // Toggle exercise selection
  const toggleExercise = (id) => {
    setSelectedExerciseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Stats
  const stats = {
    active: jobs.filter(j => !['done', 'failed'].includes(j.status)).length,
    done: jobs.filter(j => j.status === 'done').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    total: jobs.length,
  };

  const exercisesWithoutVideo = exercises.filter(e => !e.has_video);

  const filtered = statusFilter === 'all'
    ? jobs
    : statusFilter === 'active'
    ? jobs.filter(j => !['done', 'failed'].includes(j.status))
    : jobs.filter(j => j.status === statusFilter);

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">{t('vg_admin_only')}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Film className="w-7 h-7 text-purple-500" />
            {t('vg_title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('vg_subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSelector(!showSelector)}
          >
            <Play className="w-4 h-4 mr-1" />
            {t('vg_select_exercises')}
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => generateAllMutation.mutate()}
            disabled={generateAllMutation.isPending || exercisesWithoutVideo.length === 0}
          >
            {generateAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            {t('vg_generate_all')} ({exercisesWithoutVideo.length})
          </Button>
        </div>
      </div>

      {/* Exercise selector (collapsible) */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('vg_select_exercises_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExerciseSelector
              exercises={exercises}
              selectedIds={selectedExerciseIds}
              onToggle={toggleExercise}
              onSelectAll={() => setSelectedExerciseIds(exercises.map(e => e.id))}
              onDeselectAll={() => setSelectedExerciseIds([])}
            />
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => generateMutation.mutate(selectedExerciseIds)}
              disabled={selectedExerciseIds.length === 0 || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {t('vg_generate_selected')} ({selectedExerciseIds.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'active', label: t('vg_stat_active'),  count: stats.active, color: 'text-blue-500',  icon: Loader2 },
          { key: 'done',   label: t('vg_stat_done'),    count: stats.done,   color: 'text-green-500', icon: CheckCircle },
          { key: 'failed', label: t('vg_stat_failed'),  count: stats.failed, color: 'text-red-500',   icon: XCircle },
          { key: 'all',    label: t('vg_stat_total'),   count: stats.total,  color: 'text-gray-500',  icon: Video },
        ].map(({ key, label, count, color, icon: Icon }) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === key ? 'ring-2 ring-purple-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <CardContent className="p-3 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1 ${key === 'active' && stats.active > 0 ? 'animate-spin' : ''}`} />
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">{t('vg_coverage')}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {exercises.filter(e => e.has_video).length} / {exercises.length} {t('vg_exercises_with_video')}
              </p>
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: exercises.length ? `${(exercises.filter(e => e.has_video).length / exercises.length * 100)}%` : '0%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',    label: `${t('vg_filter_all')} (${stats.total})` },
          { key: 'active', label: `${t('vg_filter_active')} (${stats.active})` },
          { key: 'done',   label: `${t('vg_filter_done')} (${stats.done})` },
          { key: 'failed', label: `${t('vg_filter_failed')} (${stats.failed})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === key
                ? 'bg-purple-500 text-white border-purple-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Job list */}
      {jobsLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 mx-auto animate-spin" />
          <p className="text-sm text-gray-500 mt-2">{t('vg_loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Film className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600">{t('vg_empty_title')}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === 'all'
                ? t('vg_empty_desc')
                : t('vg_empty_filter')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              exercise={exerciseMap[job.exercise_id]}
              onRetry={(exerciseId) => generateMutation.mutate([exerciseId])}
              isRetrying={generateMutation.isPending}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
