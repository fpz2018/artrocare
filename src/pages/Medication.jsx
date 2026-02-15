import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pill, Plus, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { sanitizeInput } from '@/components/utils/sanitize';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function Medication() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', type: 'other' });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medication_logs', profile?.id, 'today'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('medications').insert({
        user_id: profile.id,
        name: sanitizeInput(form.name),
        dosage: sanitizeInput(form.dosage),
        frequency: sanitizeInput(form.frequency),
        type: form.type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowAdd(false);
      setForm({ name: '', dosage: '', frequency: '', type: 'other' });
    },
  });

  const logMutation = useMutation({
    mutationFn: async (medicationId) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('medication_logs').insert({
        user_id: profile.id,
        medication_id: medicationId,
        date: today,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication_logs'] });
    },
  });

  const isTakenToday = (medId) => todayLogs.some((l) => l.medication_id === medId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="w-7 h-7 text-blue-600" />
          {t('med_title')}
        </h1>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" /> {t('med_add')}
        </Button>
      </div>

      <InlineDisclaimer type="medication" />

      {/* Today's intake */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {t('med_today')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {medications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {t('language') === 'nl' ? 'Nog geen medicatie toegevoegd.' : 'No medication added yet.'}
            </p>
          ) : (
            medications.map((med) => {
              const taken = isTakenToday(med.id);
              return (
                <div key={med.id} className={`flex items-center justify-between p-3 rounded-lg border ${taken ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div>
                    <p className="font-semibold text-sm">{med.name}</p>
                    <div className="flex gap-2 mt-1">
                      {med.dosage && <Badge variant="secondary" className="text-xs">{med.dosage}</Badge>}
                      {med.frequency && <Badge variant="secondary" className="text-xs">{med.frequency}</Badge>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={taken ? 'outline' : 'default'}
                    onClick={() => !taken && logMutation.mutate(med.id)}
                    disabled={taken || logMutation.isPending}
                    className={taken ? 'border-green-300 text-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                  >
                    {taken ? <><Check className="w-4 h-4 mr-1" />{t('med_taken')}</> : t('med_not_taken')}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('med_add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('med_name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{t('med_dosage')}</Label><Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} /></div>
            <div><Label>{t('med_frequency')}</Label><Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} /></div>
            <Button onClick={() => addMutation.mutate()} disabled={!form.name || addMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
