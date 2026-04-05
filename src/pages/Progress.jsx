import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Activity, Save, CheckCircle, AlertTriangle, BarChart3, Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { sanitizeInput } from '@/components/utils/sanitize';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function Progress() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Form state
  const [painRest, setPainRest] = useState([3]);
  const [painActivity, setPainActivity] = useState([5]);
  const [stiffness, setStiffness] = useState([5]);
  const [functionScore, setFunctionScore] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [mood, setMood] = useState('okay');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Actief protocol ophalen
  const { data: activeProtocol } = useQuery({
    queryKey: ['active-protocol', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_protocols')
        .select('id, route, joint_type, current_week')
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

  // Fetch measurements
  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', profile?.id, 'all'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', profile.id)
        .gte('date', ninetyDaysAgo)
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const maxPain = Math.max(painRest[0], painActivity[0]);
      const isFlare = maxPain >= 7;

      const record = {
        user_id: profile.id,
        date: today,
        pain_level: maxPain,        // backward compat voor grafieken
        pain_rest: painRest[0],
        pain_activity: painActivity[0],
        stiffness_level: stiffness[0],
        function_score: functionScore[0],
        sleep_quality: sleepQuality[0],
        stress_level: stressLevel[0],
        exercise_done: exerciseDone,
        exercise_minutes: parseInt(exerciseMinutes) || 0,
        mood,
        notes: sanitizeInput(notes),
        is_flare: isFlare,
        ...(activeProtocol ? { protocol_id: activeProtocol.id } : {}),
      };

      const { data, error } = await supabase
        .from('measurements')
        .upsert(record, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  // Chart data
  const chartData = useMemo(() => {
    return measurements.map((m) => ({
      date: format(parseISO(m.date), 'dd/MM'),
      pain: m.pain_level,
      function: m.function_score,
      sleep: m.sleep_quality,
    }));
  }, [measurements]);

  const moods = [
    { value: 'great', emoji: '😄', label: t('prog_mood_great') },
    { value: 'good', emoji: '🙂', label: t('prog_mood_good') },
    { value: 'okay', emoji: '😐', label: t('prog_mood_okay') },
    { value: 'poor', emoji: '😕', label: t('prog_mood_poor') },
    { value: 'bad', emoji: '😞', label: t('prog_mood_bad') },
  ];

  // Flare detection
  const recentFlares = measurements.filter((m) => m.is_flare).slice(-3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Activity className="w-7 h-7 text-blue-600" />
        {t('prog_title')}
      </h1>

      <Tabs defaultValue="daily">
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1">{t('prog_daily')}</TabsTrigger>
          <TabsTrigger value="flare" className="flex-1">{t('prog_flare')}</TabsTrigger>
          <TabsTrigger value="charts" className="flex-1">{t('prog_charts')}</TabsTrigger>
        </TabsList>

        {/* Daily Check-in */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>{t('prog_daily')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NRS Rust */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pijn in rust <span className="text-gray-400 font-normal text-xs">(NRS)</span></span>
                  <span className={`font-bold ${painRest[0] >= 7 ? 'text-red-600' : painRest[0] >= 4 ? 'text-orange-500' : 'text-green-600'}`}>{painRest[0]}/10</span>
                </div>
                <Slider value={painRest} onValueChange={setPainRest} max={10} step={1} />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0 — geen pijn</span><span>10 — ergste pijn</span>
                </div>
              </div>

              {/* NRS Bewegen */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pijn bij bewegen <span className="text-gray-400 font-normal text-xs">(NRS)</span></span>
                  <span className={`font-bold ${painActivity[0] >= 7 ? 'text-red-600' : painActivity[0] >= 4 ? 'text-orange-500' : 'text-green-600'}`}>{painActivity[0]}/10</span>
                </div>
                <Slider value={painActivity} onValueChange={setPainActivity} max={10} step={1} />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0 — geen pijn</span><span>10 — ergste pijn</span>
                </div>
              </div>

              {/* Flare-waarschuwing */}
              {Math.max(painRest[0], painActivity[0]) >= 7 && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{t('flare_high_pain_advice')}</p>
                </div>
              )}

              {/* Stiffness */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('prog_stiffness')}</span>
                  <span className="text-blue-600 font-bold">{stiffness[0]}</span>
                </div>
                <Slider value={stiffness} onValueChange={setStiffness} max={10} step={1} />
              </div>

              {/* Function */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('prog_function')}</span>
                  <span className="text-green-600 font-bold">{functionScore[0]}</span>
                </div>
                <Slider value={functionScore} onValueChange={setFunctionScore} max={10} step={1} />
              </div>

              {/* Sleep */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('prog_sleep')}</span>
                  <span className="text-purple-600 font-bold">{sleepQuality[0]}</span>
                </div>
                <Slider value={sleepQuality} onValueChange={setSleepQuality} max={10} step={1} />
              </div>

              {/* Stress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('prog_stress')}</span>
                  <span className="text-orange-600 font-bold">{stressLevel[0]}</span>
                </div>
                <Slider value={stressLevel} onValueChange={setStressLevel} max={10} step={1} />
              </div>

              {/* Exercise */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{t('prog_exercise_done')}</span>
                <button
                  onClick={() => setExerciseDone(!exerciseDone)}
                  className={`w-12 h-6 rounded-full transition-colors ${exerciseDone ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${exerciseDone ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {exerciseDone && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">{t('prog_exercise_minutes')}</span>
                  <Input
                    type="number"
                    min={0}
                    max={300}
                    value={exerciseMinutes}
                    onChange={(e) => setExerciseMinutes(e.target.value)}
                    placeholder="30"
                  />
                </div>
              )}

              {/* Mood */}
              <div className="space-y-2">
                <span className="text-sm font-medium">{t('prog_mood')}</span>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        mood === m.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl">{m.emoji}</div>
                      <div className="text-xs mt-1">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <span className="text-sm font-medium">{t('prog_notes')}</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              {/* Save */}
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || showSuccess}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {showSuccess ? (
                  <><CheckCircle className="w-4 h-4 mr-2" />{t('saved')}</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />{t('prog_save')}</>
                )}
              </Button>

              <InlineDisclaimer type="general" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flare Protocol */}
        <TabsContent value="flare">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600" />
                {t('flare_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentFlares.length > 0 ? (
                <div className="flex items-start gap-3 p-4 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">{t('flare_active')}</p>
                    <p className="text-sm text-red-700 mt-1">{t('flare_advice')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">{t('flare_no_active')}</p>
              )}
              <InlineDisclaimer type="general" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts */}
        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                {t('prog_charts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={[0, 10]} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} name={t('prog_pain')} />
                      <Line type="monotone" dataKey="function" stroke="#22c55e" strokeWidth={2} name={t('prog_function')} />
                      <Line type="monotone" dataKey="sleep" stroke="#a855f7" strokeWidth={2} name={t('prog_sleep')} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t('language') === 'nl'
                    ? 'Log minimaal 2 dagen om grafieken te zien.'
                    : 'Log at least 2 days to see charts.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
