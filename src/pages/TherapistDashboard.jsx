import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Activity, AlertTriangle, TrendingUp, Search,
  Copy, Check, ShieldAlert, Dumbbell, UserPlus, Trash2, Loader2
} from 'lucide-react';
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function TherapistDashboard() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const queryClient = useQueryClient();

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

  // Patiënten gekoppeld aan deze therapeut
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['therapist-patients', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('role', 'patient');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Metingen van de afgelopen 7 dagen
  const { data: allMeasurements = {} } = useQuery({
    queryKey: ['therapist-measurements', patients.map(p => p.id)],
    queryFn: async () => {
      if (patients.length === 0) return {};
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .in('user_id', patients.map(p => p.id))
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });
      if (error) throw error;
      const grouped = {};
      (data || []).forEach(m => {
        if (!grouped[m.user_id]) grouped[m.user_id] = [];
        grouped[m.user_id].push(m);
      });
      return grouped;
    },
    enabled: patients.length > 0,
  });

  // Openstaande uitnodigingen
  const { data: invitations = [] } = useQuery({
    queryKey: ['therapist-invitations', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('role', 'patient')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createInvite = useMutation({
    mutationFn: async (email) => {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('therapist_id', profile.id)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .single();
      if (existing) throw new Error('Er is al een openstaande uitnodiging voor dit e-mailadres.');

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: email.toLowerCase(),
          role: 'patient',
          practice_id: profile.practice_id,
          therapist_id: profile.id,
          invited_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-invitations', profile.id] });
      setInviteEmail('');
      toast.success('Uitnodiging aangemaakt');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-invitations', profile.id] });
      toast.success('Uitnodiging verwijderd');
    },
    onError: (err) => toast.error(err.message),
  });

  const copyLink = async (token) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Link gekopieerd');
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Voer een geldig e-mailadres in');
      return;
    }
    createInvite.mutate(inviteEmail.trim());
  };

  // Stats per patiënt
  const patientStats = useMemo(() => {
    return patients.map(patient => {
      const measurements = allMeasurements[patient.id] || [];
      const lastMeasurement = measurements[0];
      const avgPain = measurements.length > 0
        ? (measurements.reduce((sum, m) => sum + (m.pain_level || 0), 0) / measurements.length).toFixed(1)
        : '-';
      const exerciseDays = measurements.filter(m => m.exercise_done).length;
      const daysAgo = lastMeasurement
        ? differenceInCalendarDays(new Date(), parseISO(lastMeasurement.date))
        : null;
      const needsAttention = (lastMeasurement?.pain_level >= 7) || (daysAgo !== null && daysAgo > 3);
      return { ...patient, measurements, avgPain, exerciseDays, daysAgo, needsAttention };
    });
  }, [patients, allMeasurements]);

  const filteredPatients = patientStats.filter(p =>
    (p.full_name || p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeThisWeek = patientStats.filter(p => p.measurements.length > 0).length;
  const needAttention = patientStats.filter(p => p.needsAttention).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-7 h-7 text-blue-600" />
        {t('td_title')}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
      </div>

      {/* Aandacht vereist */}
      {needAttention > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="font-semibold text-amber-800 mb-2">{t('td_attention')}:</p>
            <div className="space-y-2">
              {patientStats.filter(p => p.needsAttention).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{p.full_name || p.email}</span>
                  {p.measurements[0]?.pain_level >= 7 && (
                    <Badge variant="destructive" className="text-xs">Pijn: {p.measurements[0].pain_level}</Badge>
                  )}
                  {p.daysAgo > 3 && (
                    <Badge variant="secondary" className="text-xs">{p.daysAgo}d {language === 'nl' ? 'niet actief' : 'inactive'}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patiënt uitnodigen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gray-400" /> Patiënt uitnodigen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <form onSubmit={handleInviteSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="patient@email.nl"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createInvite.isPending} size="sm">
              {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uitnodigen'}
            </Button>
          </form>

          {invitations.length > 0 && (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      {inv.status === 'accepted' ? 'Geaccepteerd' : inv.status === 'expired' ? 'Verlopen' : 'Wacht op acceptatie'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {inv.status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600" onClick={() => copyLink(inv.token)}>
                          {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" onClick={() => deleteInvite.mutate(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zoeken */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('td_search')}
          className="pl-10"
        />
      </div>

      {/* Patiëntenlijst */}
      <div className="space-y-3">
        {patientsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{language === 'nl' ? 'Nog geen patiënten.' : 'No patients yet.'}</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map(patient => (
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
