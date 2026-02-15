import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Activity, AlertTriangle, TrendingUp, Search,
  Copy, CheckCircle, ShieldAlert, Dumbbell
} from 'lucide-react';
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';

export default function TherapistDashboard() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Only therapists can access
  if (profile?.role !== 'therapist') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="bg-red-50 border-red-200 max-w-md">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="font-semibold text-red-800">{t('td_unauthorized')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch patients linked to this therapist
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['therapist-patients', profile?.email],
    queryFn: async () => {
      if (!profile?.email) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('therapist_email', profile.email)
        .eq('role', 'patient');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.email,
  });

  // Fetch all measurements for patients (bulk - using Promise.all)
  const { data: allMeasurements = {} } = useQuery({
    queryKey: ['therapist-measurements', patients.map((p) => p.id)],
    queryFn: async () => {
      if (patients.length === 0) return {};
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      
      // Bulk fetch all patients' measurements in one query
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .in('user_id', patients.map((p) => p.id))
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Group by user_id
      const grouped = {};
      (data || []).forEach((m) => {
        if (!grouped[m.user_id]) grouped[m.user_id] = [];
        grouped[m.user_id].push(m);
      });
      return grouped;
    },
    enabled: patients.length > 0,
  });

  // Patient stats
  const patientStats = useMemo(() => {
    return patients.map((patient) => {
      const measurements = allMeasurements[patient.id] || [];
      const lastMeasurement = measurements[0];
      const avgPain = measurements.length > 0
        ? (measurements.reduce((sum, m) => sum + (m.pain_level || 0), 0) / measurements.length).toFixed(1)
        : '-';
      const exerciseDays = measurements.filter((m) => m.exercise_done).length;
      const daysAgo = lastMeasurement
        ? differenceInCalendarDays(new Date(), parseISO(lastMeasurement.date))
        : null;
      const needsAttention = (lastMeasurement?.pain_level >= 7) || (daysAgo !== null && daysAgo > 3);

      return { ...patient, measurements, avgPain, exerciseDays, daysAgo, needsAttention };
    });
  }, [patients, allMeasurements]);

  const filteredPatients = patientStats.filter((p) =>
    (p.full_name || p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeThisWeek = patientStats.filter((p) => p.measurements.length > 0).length;
  const needAttention = patientStats.filter((p) => p.needsAttention).length;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?therapist=${profile.email}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-7 h-7 text-blue-600" />
        {t('td_title')}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{patients.length}</p>
            <p className="text-xs text-gray-500">{t('td_patients')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{activeThisWeek}</p>
            <p className="text-xs text-gray-500">{t('td_active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{needAttention}</p>
            <p className="text-xs text-gray-500">{t('td_attention')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button onClick={copyInviteLink} variant="outline" className="w-full" size="sm">
              {copied ? <><CheckCircle className="w-4 h-4 mr-1" />{t('saved')}</> : <><Copy className="w-4 h-4 mr-1" />{t('td_invite')}</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attention needed */}
      {needAttention > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="font-semibold text-amber-800 mb-2">{t('td_attention')}:</p>
            <div className="space-y-2">
              {patientStats.filter((p) => p.needsAttention).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{p.full_name || p.email}</span>
                  {p.measurements[0]?.pain_level >= 7 && <Badge variant="destructive" className="text-xs">Pijn: {p.measurements[0].pain_level}</Badge>}
                  {p.daysAgo > 3 && <Badge variant="secondary" className="text-xs">{p.daysAgo}d {language === 'nl' ? 'niet actief' : 'inactive'}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('td_search')}
          className="pl-10"
        />
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {patientsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{language === 'nl' ? 'Geen patienten gevonden.' : 'No patients found.'}</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className={patient.needsAttention ? 'border-amber-200' : ''}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                    {(patient.full_name || patient.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{patient.full_name || patient.email}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{t('td_avg_pain')}: {patient.avgPain}</span>
                      <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{patient.exerciseDays}x</span>
                      {patient.daysAgo !== null && <span>{t('td_last_active')}: {patient.daysAgo}d</span>}
                    </div>
                  </div>
                </div>
                {patient.needsAttention && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
