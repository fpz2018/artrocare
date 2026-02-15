import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  BookOpen, CheckCircle, Lock, Crown, ArrowRight, Sparkles
} from 'lucide-react';

export default function Library() {
  const { profile, updateProfile } = useAuth();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const completedLessons = profile?.completed_core_lessons || [];
  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'practice';

  const coreLessons = lessons.filter((l) => l.category === 'core');
  const advancedLessons = lessons.filter((l) => l.category === 'advanced');
  const coreProgress = coreLessons.length > 0 ? (completedLessons.length / coreLessons.length) * 100 : 0;

  const markComplete = async (lessonKey) => {
    if (completedLessons.includes(lessonKey)) return;
    const updated = [...completedLessons, lessonKey];
    await updateProfile({ completed_core_lessons: updated });
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
  };

  const isLessonCompleted = (key) => completedLessons.includes(key);
  const getNextLesson = () => {
    return coreLessons.find((l) => !completedLessons.includes(l.key));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-blue-600" />
        {t('lib_title')}
      </h1>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">{t('lib_core')} {t('lib_progress')}</span>
            <span className="text-blue-600 font-bold">{completedLessons.length}/{coreLessons.length}</span>
          </div>
          <Progress value={coreProgress} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="core">
        <TabsList>
          <TabsTrigger value="core">{t('lib_core')}</TabsTrigger>
          <TabsTrigger value="advanced">{t('lib_advanced')}</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="mt-4 space-y-3">
          {coreLessons.map((lesson, idx) => {
            const completed = isLessonCompleted(lesson.key);
            const nextLesson = getNextLesson();
            const isNext = !completed && nextLesson?.key === lesson.key;
            const isLocked = !completed && !isNext;

            return (
              <Card
                key={lesson.id}
                className={`cursor-pointer transition-all ${
                  completed ? 'bg-green-50 border-green-200' :
                  isNext ? 'bg-white border-blue-400 shadow-md' :
                  'bg-gray-50 border-gray-200 opacity-60'
                }`}
                onClick={() => (completed || isNext) && setSelectedLesson(lesson)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : isNext ? (
                      <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-600">{idx + 1}</div>
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{language === 'nl' ? lesson.title_nl : lesson.title_en}</p>
                      <p className="text-xs text-gray-500">{lesson.duration_minutes} {t('minutes')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNext && <Badge className="bg-blue-100 text-blue-700">{t('lib_next')}</Badge>}
                    {completed && <Badge className="bg-green-100 text-green-700">{t('lib_completed')}</Badge>}
                    {isLocked && <Badge variant="secondary">{t('lib_locked')}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="advanced" className="mt-4 space-y-3">
          {advancedLessons.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{language === 'nl' ? 'Verdiepingslessen worden binnenkort toegevoegd.' : 'Advanced lessons coming soon.'}</p>
              </CardContent>
            </Card>
          ) : (
            advancedLessons.map((lesson) => (
              <Card key={lesson.id} className={lesson.is_premium && !isPremium ? 'opacity-60' : ''}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{language === 'nl' ? lesson.title_nl : lesson.title_en}</p>
                    <p className="text-xs text-gray-500">{lesson.duration_minutes} {t('minutes')}</p>
                  </div>
                  {lesson.is_premium && !isPremium && <Crown className="w-5 h-5 text-amber-500" />}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        {selectedLesson && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'nl' ? selectedLesson.title_nl : selectedLesson.title_en}</DialogTitle>
              <DialogDescription>{language === 'nl' ? selectedLesson.summary_nl : selectedLesson.summary_en}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{language === 'nl' ? selectedLesson.content_nl : selectedLesson.content_en}</p>
              </div>

              {(language === 'nl' ? selectedLesson.key_takeaways_nl : selectedLesson.key_takeaways_en)?.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">{t('lib_key_takeaways')}</h4>
                  <ul className="space-y-1">
                    {(language === 'nl' ? selectedLesson.key_takeaways_nl : selectedLesson.key_takeaways_en).map((kw, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        {kw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                {!isLessonCompleted(selectedLesson.key) && (
                  <Button
                    onClick={() => { markComplete(selectedLesson.key); setSelectedLesson(null); }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('lib_mark_complete')}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                  {t('close')}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
