import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, Mail, Phone, Calendar, Send, BarChart3 } from 'lucide-react';
import { sanitizeInput, isValidEmail, createRateLimiter } from '@/components/utils/sanitize';
import { format, subDays } from 'date-fns';

const rateLimiter = createRateLimiter(60000);

export default function Therapist() {
  const { profile, updateProfile } = useAuth();
  const { t, language } = useI18n();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    therapist_email: profile?.therapist_email || '',
    therapist_name: profile?.therapist_name || '',
    therapist_practice: profile?.therapist_practice || '',
    therapist_phone: profile?.therapist_phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: recentMeasurements = [] } = useQuery({
    queryKey: ['measurements', profile?.id, 'therapist'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', profile.id)
        .gte('date', ninetyDaysAgo)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const saveTherapist = async () => {
    if (!isValidEmail(form.therapist_email)) return;
    setSaving(true);
    try {
      await updateProfile({
        therapist_email: sanitizeInput(form.therapist_email),
        therapist_name: sanitizeInput(form.therapist_name),
        therapist_practice: sanitizeInput(form.therapist_practice),
        therapist_phone: sanitizeInput(form.therapist_phone),
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async () => {
    if (!rateLimiter.canCall()) return;
    setSending(true);
    try {
      // In production, this would call a Netlify Function to send email
      rateLimiter.call();
      setSent(true);
      setMessageForm({ subject: '', body: '' });
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const hasTherapist = profile?.therapist_email;

  // Simple stats
  const avgPain = recentMeasurements.length > 0
    ? (recentMeasurements.reduce((sum, m) => sum + (m.pain_level || 0), 0) / recentMeasurements.length).toFixed(1)
    : '-';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Stethoscope className="w-7 h-7 text-blue-600" />
        {t('ther_title')}
      </h1>

      {/* Therapist Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('ther_my_therapist')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? t('cancel') : hasTherapist ? t('edit') : t('ther_link')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div><Label>{t('ther_email')}</Label><Input type="email" value={form.therapist_email} onChange={(e) => setForm({ ...form, therapist_email: e.target.value })} /></div>
              <div><Label>{t('ther_name')}</Label><Input value={form.therapist_name} onChange={(e) => setForm({ ...form, therapist_name: e.target.value })} /></div>
              <div><Label>{t('ther_practice')}</Label><Input value={form.therapist_practice} onChange={(e) => setForm({ ...form, therapist_practice: e.target.value })} /></div>
              <div><Label>{t('ther_phone')}</Label><Input value={form.therapist_phone} onChange={(e) => setForm({ ...form, therapist_phone: e.target.value })} /></div>
              <Button onClick={saveTherapist} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? t('loading') : t('save')}</Button>
            </div>
          ) : hasTherapist ? (
            <div className="space-y-2">
              <p className="font-semibold">{profile.therapist_name || profile.therapist_email}</p>
              {profile.therapist_practice && <p className="text-sm text-gray-500">{profile.therapist_practice}</p>}
              <div className="flex gap-4 text-sm text-gray-600">
                {profile.therapist_email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{profile.therapist_email}</span>}
                {profile.therapist_phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{profile.therapist_phone}</span>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{language === 'nl' ? 'Nog geen therapeut gekoppeld.' : 'No therapist linked yet.'}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats for sharing */}
      {hasTherapist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {t('ther_share')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{avgPain}</p>
                <p className="text-xs text-gray-600">{language === 'nl' ? 'Gem. pijn (90 dagen)' : 'Avg. pain (90 days)'}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{recentMeasurements.length}</p>
                <p className="text-xs text-gray-600">{language === 'nl' ? 'Metingen (90 dagen)' : 'Measurements (90 days)'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Form */}
      {hasTherapist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5 text-blue-600" />
              {t('ther_message')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{t('ther_subject')}</Label><Input value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} maxLength={100} /></div>
            <div><Label>{t('ther_body')}</Label><Textarea value={messageForm.body} onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })} rows={4} maxLength={1000} /></div>
            <Button
              onClick={sendMessage}
              disabled={!messageForm.subject || !messageForm.body || sending || !rateLimiter.canCall()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sent ? t('saved') : sending ? t('loading') : !rateLimiter.canCall() ? t('ther_cooldown') : t('ther_send')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
