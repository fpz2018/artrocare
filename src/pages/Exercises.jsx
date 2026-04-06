import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Dumbbell, Play, CheckCircle, Lock, Video, Layers, Star, Eye, Check, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';
import ExerciseAnimation, { hasAnimation } from '@/components/exercises/ExerciseAnimation';

// Lazy-load the 3D player for concept previews
const ExercisePlayer = lazy(() => import('@/components/exercises/3d/ExercisePlayer'));

// Import concept exercise data
import SeatedKneeExtensionData from '@/components/exercises/3d/exercises/SeatedKneeExtension';

// ─── Concept exercises awaiting approval ───────────────────────────────────
const CONCEPT_EXERCISES = [
  {
    animationData: SeatedKneeExtensionData,
    db: {
      title_nl: 'Zittend knie-extensie',
      title_en: 'Seated Knee Extension',
      description_nl: 'Zittend op een stoel het been strekken om de quadriceps te versterken. Een basis NEMEX-oefening voor knieartrose.',
      description_en: 'Seated on a chair, extend the leg to strengthen the quadriceps. A core NEMEX exercise for knee arthrosis.',
      instructions_nl: 'Ga rechtop zitten op een stevige stoel. Strek langzaam uw rechter onderbeen tot het been bijna gestrekt is. Houd 2 seconden vast en laat langzaam zakken. Wissel na de set van been.',
      instructions_en: 'Sit upright on a sturdy chair. Slowly extend your right lower leg until nearly straight. Hold for 2 seconds and slowly lower. Switch legs after the set.',
      focus_points_nl: ['Houd je rug recht tegen de stoelleuning', 'Strek je been langzaam en gecontroleerd', 'Houd je voet in een ontspannen positie'],
      focus_points_en: ['Keep your back straight against the chair', 'Extend your leg slowly and controlled', 'Keep your foot in a relaxed position'],
      circle: 'strength',
      level: 1,
      sets: 3,
      reps: '10-15',
      duration_minutes: 5,
      is_nemex: true,
      has_video: false,
      sort_order: 10,
    },
  },
];

// Route A = niveau 1 · Route B = niveau 1-2 · Route C = niveau 1-3
const ROUTE_MAX_LEVEL = { A: 1, B: 2, C: 3 };

const ROUTE_BADGE = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-orange-100 text-orange-800',
  C: 'bg-red-100 text-red-800',
};

const circleIcons = {
  warmup: '🔥', strength: '💪', flexibility: '🧘', balance: '⚖️', cooldown: '❄️',
};

const ExerciseCard = React.memo(function ExerciseCard({ exercise, lang, isCompleted, onSelect }) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
      onClick={() => onSelect(exercise)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{circleIcons[exercise.circle] || '🏋️'}</span>
              <h3 className="font-semibold text-sm">
                {lang === 'nl' ? exercise.title_nl : exercise.title_en}
              </h3>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {lang === 'nl' ? exercise.description_nl : exercise.description_en}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                Lv. {exercise.level}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {exercise.sets}x {exercise.reps}
              </Badge>
              {exercise.has_video && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  <Video className="w-3 h-3 mr-1" /> Video
                </Badge>
              )}
            </div>
          </div>
          {isCompleted && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
        </div>
      </CardContent>
    </Card>
  );
});

export default function Exercises() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('programma');

  const coreLessonsComplete = (profile?.completed_core_lessons || []).length >= 3;

  // Haal actief protocol op
  const { data: protocol } = useQuery({
    queryKey: ['active-protocol', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_protocols')
        .select('*')
        .eq('patient_id', profile.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!profile?.id,
  });

  const hasProtocol = !!protocol;

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Today's measurement for completed exercises
  const { data: todayMeasurement } = useQuery({
    queryKey: ['measurements', profile?.id, 'today'],
    queryFn: async () => {
      if (!profile?.id) return null;
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const completedToday = todayMeasurement?.completed_exercises || [];

  // Mark exercise complete
  const completeMutation = useMutation({
    mutationFn: async (exerciseId) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const newCompleted = [...new Set([...completedToday, exerciseId])];

      const { error } = await supabase
        .from('measurements')
        .upsert({
          user_id: profile.id,
          date: today,
          completed_exercises: newCompleted,
          exercise_done: true,
        }, { onConflict: 'user_id,date' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      setSelectedExercise(null);
    },
  });

  const handleSelect = useCallback((exercise) => setSelectedExercise(exercise), []);

  // Oefeningen voor mijn programma (route-gefilterd)
  const programmaExercises = useMemo(() => {
    if (!protocol) return exercises.filter((e) => e.level === 1);
    const maxLevel = ROUTE_MAX_LEVEL[protocol.route] || 1;
    return exercises.filter((e) => e.level <= maxLevel);
  }, [exercises, protocol]);

  // Filter oefeningen per tab
  const filteredExercises = useMemo(() => {
    if (activeTab === 'programma') return programmaExercises;
    if (activeTab === 'video') return exercises.filter((e) => e.has_video);
    if (activeTab !== 'all') return exercises.filter((e) => e.circle === activeTab);
    return exercises;
  }, [exercises, activeTab, programmaExercises]);

  const circles = useMemo(() => {
    return [...new Set(exercises.map((e) => e.circle).filter(Boolean))];
  }, [exercises]);

  // Vergrendeld alleen als er geen protocol EN geen core lessen zijn
  if (!coreLessonsComplete && !hasProtocol) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Dumbbell className="w-7 h-7 text-blue-600" />
          {t('ex_title')}
        </h1>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 flex items-start gap-3">
            <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">{t('ex_locked')}</p>
              <Button variant="outline" className="mt-3 border-amber-300" asChild>
                <a href="/library">{t('nav_library')}</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Dumbbell className="w-7 h-7 text-blue-600" />
          {t('ex_title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('ex_nemex_desc')}</p>
      </div>

      {/* Protocol-badge */}
      {protocol && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${ROUTE_BADGE[protocol.route]}`}>
          <Star className="w-3.5 h-3.5" />
          Route {protocol.route} — week {protocol.current_week + 1}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="programma">Mijn programma</TabsTrigger>
          <TabsTrigger value="all">{t('ex_all')}</TabsTrigger>
          <TabsTrigger value="video">{t('ex_video')}</TabsTrigger>
          {circles.map((c) => (
            <TabsTrigger key={c} value={c}>
              {circleIcons[c] || ''} {c}
            </TabsTrigger>
          ))}
          {profile?.role === 'admin' && (
            <TabsTrigger value="concept" className="text-amber-700 data-[state=active]:bg-amber-100">
              Concept 3D
            </TabsTrigger>
          )}
        </TabsList>

        {/* Concept tab — admin only */}
        {activeTab === 'concept' && profile?.role === 'admin' && (
          <TabsContent value="concept" className="mt-4">
            <ConceptExercisesTab language={language} queryClient={queryClient} />
          </TabsContent>
        )}

        {/* Regular exercise tabs */}
        {activeTab !== 'concept' && (
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    lang={language}
                    isCompleted={completedToday.includes(exercise.id)}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        {selectedExercise && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'nl' ? selectedExercise.title_nl : selectedExercise.title_en}
              </DialogTitle>
              <DialogDescription>
                {language === 'nl' ? selectedExercise.description_nl : selectedExercise.description_en}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {hasAnimation(selectedExercise) && (
                <ExerciseAnimation
                  exercise={selectedExercise}
                  sets={selectedExercise.sets}
                  reps={selectedExercise.reps}
                  duration={selectedExercise.duration_minutes}
                />
              )}

              <div className="flex gap-2 flex-wrap">
                <Badge>{t('ex_level')}: {selectedExercise.level}</Badge>
                <Badge variant="secondary">{selectedExercise.sets}x {selectedExercise.reps}</Badge>
                <Badge variant="secondary">{selectedExercise.duration_minutes} {t('minutes')}</Badge>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">{t('ex_instructions')}</h4>
                <p className="text-sm text-gray-700">
                  {language === 'nl' ? selectedExercise.instructions_nl : selectedExercise.instructions_en}
                </p>
              </div>

              {(language === 'nl' ? selectedExercise.focus_points_nl : selectedExercise.focus_points_en)?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">{t('ex_focus_points')}</h4>
                  <ul className="space-y-1">
                    {(language === 'nl' ? selectedExercise.focus_points_nl : selectedExercise.focus_points_en).map((point, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => completeMutation.mutate(selectedExercise.id)}
                  disabled={completedToday.includes(selectedExercise.id) || completeMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {completedToday.includes(selectedExercise.id) ? t('ex_completed') : t('ex_mark_complete')}
                </Button>
                <Button variant="outline" onClick={() => setSelectedExercise(null)}>
                  {t('close')}
                </Button>
              </div>

              <InlineDisclaimer type="exercise" />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <InlineDisclaimer type="exercise" />
    </div>
  );
}

// ─── Concept Exercises Tab (admin only) ────────────────────────────────────

function ConceptExercisesTab({ language, queryClient }) {
  const [previewExercise, setPreviewExercise] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [approvedIds, setApprovedIds] = useState(new Set());

  const handleApprove = async (concept) => {
    const id = concept.animationData.id;
    setApprovingId(id);
    try {
      const { error } = await supabase.from('exercises').insert({
        title_nl: concept.db.title_nl,
        title_en: concept.db.title_en,
        description_nl: concept.db.description_nl,
        description_en: concept.db.description_en,
        instructions_nl: concept.db.instructions_nl,
        instructions_en: concept.db.instructions_en,
        focus_points_nl: concept.db.focus_points_nl,
        focus_points_en: concept.db.focus_points_en,
        circle: concept.db.circle,
        level: concept.db.level,
        sets: concept.db.sets,
        reps: concept.db.reps,
        duration_minutes: concept.db.duration_minutes,
        is_nemex: concept.db.is_nemex,
        has_video: concept.db.has_video,
        sort_order: concept.db.sort_order,
      });
      if (error) throw error;

      setApprovedIds(prev => new Set([...prev, id]));
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(
        language === 'nl'
          ? `"${concept.db.title_nl}" is gepubliceerd!`
          : `"${concept.db.title_en}" has been published!`
      );
    } catch (err) {
      toast.error(language === 'nl' ? `Fout: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800">
          {language === 'nl'
            ? 'Bekijk de 3D-oefeningen hieronder. Klik op "3D Bekijken" om de animatie te zien. Keur goed om de oefening te publiceren naar de Oefeningen-pagina.'
            : 'Preview the 3D exercises below. Click "3D Preview" to see the animation. Approve to publish to the Exercises page.'}
        </p>
      </div>

      {CONCEPT_EXERCISES.map((concept) => {
        const db = concept.db;
        const id = concept.animationData.id;
        const title = language === 'nl' ? db.title_nl : db.title_en;
        const desc = language === 'nl' ? db.description_nl : db.description_en;
        const tips = language === 'nl' ? db.focus_points_nl : db.focus_points_en;
        const isApproved = approvedIds.has(id);

        return (
          <Card key={id} className={isApproved ? 'bg-green-50 border-green-300' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="secondary" className="text-xs">Lv. {db.level}</Badge>
                  <Badge variant="secondary" className="text-xs">{db.sets}x {db.reps}</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">NEMEX</Badge>
                </div>
              </div>

              {/* Focus points */}
              <ul className="text-xs text-gray-600 space-y-0.5">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">-</span> {tip}
                  </li>
                ))}
              </ul>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setPreviewExercise(concept)} className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  3D Bekijken
                </Button>
                {isApproved ? (
                  <Badge className="bg-green-100 text-green-700 gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {language === 'nl' ? 'Gepubliceerd' : 'Published'}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(concept)}
                    disabled={approvingId === id}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {approvingId === id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {language === 'nl' ? 'Goedkeuren & Publiceren' : 'Approve & Publish'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* 3D Preview Dialog */}
      <Dialog open={!!previewExercise} onOpenChange={() => setPreviewExercise(null)}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>
              {previewExercise && (language === 'nl' ? previewExercise.db.title_nl : previewExercise.db.title_en)}
            </DialogTitle>
            <DialogDescription>3D-animatie preview</DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            {previewExercise && (
              <Suspense fallback={
                <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              }>
                <ExercisePlayer exerciseData={previewExercise.animationData} />
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
