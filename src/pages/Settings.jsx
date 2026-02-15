import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Bell, Shield, Globe, Save, CheckCircle } from 'lucide-react';
import { sanitizeInput } from '@/components/utils/sanitize';
import { FullDisclaimer } from '@/components/legal/Disclaimer';

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    height_cm: profile?.height_cm || '',
    weight_kg: profile?.weight_kg || '',
  });

  const [notifications, setNotifications] = useState({
    notify_daily: profile?.notify_daily ?? true,
    notify_exercise: profile?.notify_exercise ?? true,
    notify_progress: profile?.notify_progress ?? true,
    notify_push: profile?.notify_push ?? false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: sanitizeInput(form.full_name),
        height_cm: parseFloat(form.height_cm) || null,
        weight_kg: parseFloat(form.weight_kg) || null,
        language,
        ...notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="w-7 h-7 text-blue-600" />
        {t('set_title')}
      </h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>{t('set_profile')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t('set_name')}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t('set_height')}</Label><Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} min={0} max={300} /></div>
            <div><Label>{t('set_weight')}</Label><Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} min={0} max={500} /></div>
          </div>
          <div>
            <Label>{t('set_language')}</Label>
            <div className="flex gap-2 mt-2">
              <Button variant={language === 'nl' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('nl')}>
                <Globe className="w-4 h-4 mr-1" /> Nederlands
              </Button>
              <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')}>
                <Globe className="w-4 h-4 mr-1" /> English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />{t('set_notifications')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'notify_daily', label: t('set_daily_reminder') },
            { key: 'notify_exercise', label: t('set_exercise_reminder') },
            { key: 'notify_progress', label: t('set_progress_reminder') },
            { key: 'notify_push', label: t('set_push') },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{label}</span>
              <button
                onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                className={`w-12 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
        {saved ? <><CheckCircle className="w-4 h-4 mr-2" />{t('saved')}</> : <><Save className="w-4 h-4 mr-2" />{saving ? t('loading') : t('save')}</>}
      </Button>

      {/* Privacy & Terms */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />{t('set_privacy')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setShowTerms(true)}>{t('set_terms')}</Button>
          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />{t('logout')}
          </Button>
        </CardContent>
      </Card>

      <FullDisclaimer open={showTerms} onOpenChange={setShowTerms} onAgree={() => setShowTerms(false)} />
    </div>
  );
}
