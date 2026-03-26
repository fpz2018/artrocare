import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity, TrendingUp, Flame, Dumbbell, Target, AlertTriangle,
  BookOpen, ArrowRight, CheckCircle, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';
import DashboardOnboarding from '@/components/dashboard/DashboardOnboarding';
import PainPrediction from '@/components/dashboard/PainPrediction';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';
import ResearchInsights from '@/components/ResearchInsights';

function calculateStreak(measurements) {
  if (!measurements || measurements.length === 0) return 0;
  const sorted = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);

    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [latestHOOS12, setLatestHOOS12] = useState(null);

  // Fetch measurements for last 30 days
  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', profile?.id, 'last30'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', profile.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch HOOS-12 score
  useEffect(() => {
    const fetchHOOS12 = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('hoos12_scores')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setLatestHOOS12(data);
    };

    fetchHOOS12();
  }, [profile?.id]);

  // Fetch lessons for education progress
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('category', 'core')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Check onboarding (alleen voor patiënten)
  if (profile && !profile.onboarding_completed && profile.role === 'patient') {
    return <DashboardOnboarding />;
  }

  const completedLessons = profile?.completed_core_lessons || [];
  const coreLessonsComplete = completedLessons.length >= 3;

  // Chart data
  const chartData = useMemo(() => {
    return measurements.map((m) => ({
      date: format(parseISO(m.date), 'dd/MM'),
      pain: m.pain_level,
      function: m.function_score,
    }));
  }, [measurements]);

  // Stats
  const streak = useMemo(() => calculateStreak(measurements), [measurements]);
  const latestMeasurement = measurements[measurements.length - 1];
  const thisWeekLogs = measurements.filter((m) => {
    const d = differenceInCalendarDays(new Date(), parseISO(m.date));
    return d < 7;
  }).length;

  // Flare detection
  const isFlare = latestMeasurement?.is_flare || (latestMeasurement?.pain_level >= 7);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dash_welcome')}, {profile?.full_name || 'Patient'}
        </h1>
        <p className="text-gray-500 mt-1">{t('dash_how_feeling')}</p>
      </div>

      {/* Flare Alert */}
      {isFlare && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">{t('dash_flare_detected')}</p>
              <p className="text-sm text-red-700 mt-1">{t('dash_flare_message')}</p>
              <Link to="/progress">
                <Button size="sm" variant="outline" className="mt-2 border-red-300 text-red-700">
                  {t('prog_flare')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Progress */}
      {!coreLessonsComplete && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              {t('edu_title')}
            </CardTitle>
            <p className="text-sm text-gray-600">{t('edu_subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">{t('edu_core_modules')}</span>
              <span className="text-blue-600 font-bold">{completedLessons.length}/3 {t('edu_lessons_completed')}</span>
            </div>
            <Progress value={(completedLessons.length / 3) * 100} className="h-3" />
            <Link to="/library">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                {t('edu_start_lesson')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {coreLessonsComplete && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800">{t('edu_unlocked')}</span>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-gray-500">{t('dash_pain_level')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {latestMeasurement?.pain_level ?? '-'}/10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-gray-500">{t('dash_function_score')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {latestMeasurement?.function_score ?? '-'}/10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-medium text-gray-500">{t('dash_streak')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {streak} {t('dash_days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-500">{t('dash_week_progress')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {thisWeekLogs}/7 {t('dash_logs')}
            </p>
          </CardContent>
        </Card>

        {/* HOOS-12 Card - Alleen tonen als gebruiker heupartrose heeft */}
        {profile?.affected_joints?.includes('hip') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-pink-600" />
                <span className="text-xs font-medium text-gray-500">HOOS-12 Score</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {latestHOOS12 ? `${latestHOOS12.total_score}/100` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestHOOS12 
                  ? `Laatste meting: ${new Date(latestHOOS12.date).toLocaleDateString('nl-NL')}`
                  : 'Nog geen meting'
                }
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs mt-2 text-pink-600"
                onClick={() => navigate('/hoos12')}
              >
                {latestHOOS12 ? 'Opnieuw meten' : 'Start meting'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pain Trend Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dash_pain_trend')}</CardTitle>
            <p className="text-xs text-gray-500">{t('dash_last_30')}</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 10]} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={false} name={t('dash_pain_level')} />
                  <Line type="monotone" dataKey="function" stroke="#22c55e" strokeWidth={2} dot={false} name={t('dash_function_score')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pain Prediction */}
      <PainPrediction measurements={measurements} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/progress">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-sm">{t('dash_log_progress')}</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/exercises">
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${!coreLessonsComplete ? 'opacity-50' : 'border-green-100'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-sm">{t('dash_start_exercise')}</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/goals">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-semibold text-sm">{t('dash_set_goal')}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <ResearchInsights />

      <InlineDisclaimer />
    </div>
  );
}