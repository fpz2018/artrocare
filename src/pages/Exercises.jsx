import React, { useState, useMemo, useCallback } from 'react';
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
  Dumbbell, Play, CheckCircle, Lock, Video, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

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
  const [activeTab, setActiveTab] = useState('all');

  const coreLessonsComplete = (profile?.completed_core_lessons || []).length >= 3;

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

  // Filter exercises by tab
  const filteredExercises = useMemo(() => {
    if (activeTab === 'video') return exercises.filter((e) => e.has_video);
    if (activeTab !== 'all') return exercises.filter((e) => e.circle === activeTab);
    return exercises;
  }, [exercises, activeTab]);

  const circles = useMemo(() => {
    return [...new Set(exercises.map((e) => e.circle).filter(Boolean))];
  }, [exercises]);

  // Locked state
  if (!coreLessonsComplete) {
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">{t('ex_all')}</TabsTrigger>
          <TabsTrigger value="video">{t('ex_video')}</TabsTrigger>
          {circles.map((c) => (
            <TabsTrigger key={c} value={c}>
              {circleIcons[c] || '🏋️'} {c}
            </TabsTrigger>
          ))}
        </TabsList>

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
