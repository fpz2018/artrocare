import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2, UserPlus } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [form, setForm] = useState({ full_name: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteError('Ongeldige uitnodigingslink.');
      setLoadingInvite(false);
      return;
    }

    async function fetchInvite() {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, practices(name, city)')
        .eq('token', token)
        .single();

      if (error || !data) {
        setInviteError('Uitnodiging niet gevonden.');
      } else if (data.status === 'accepted') {
        setInviteError('Deze uitnodiging is al geaccepteerd.');
      } else if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
        setInviteError('Deze uitnodiging is verlopen. Vraag een nieuwe aan.');
      } else {
        setInvitation(data);
      }
      setLoadingInvite(false);
    }

    fetchInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) { setError('Vul je naam in.'); return; }
    if (form.password.length < 8) { setError('Wachtwoord moet minimaal 8 tekens zijn.'); return; }
    if (form.password !== form.password2) { setError('Wachtwoorden komen niet overeen.'); return; }

    setLoading(true);
    try {
      // Account aanmaken
      const { error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: form.password,
        options: {
          data: {
            full_name:        form.full_name.trim(),
            register_as:      invitation.role,
            practice_id:      invitation.practice_id,
            invitation_token: token,
          },
        },
      });
      if (authError) throw authError;
      // Trigger handle_new_user markeert uitnodiging als 'accepted' automatisch

      setDone(true);
    } catch (err) {
      setError(err.message || 'Er is iets misgegaan.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Uitnodiging ongeldig</h2>
            <p className="text-gray-600 text-sm">{inviteError}</p>
            <Button variant="outline" onClick={() => navigate('/')}>Terug naar inloggen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Account aangemaakt!</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Controleer je e-mail om je account te bevestigen. Daarna kun je inloggen bij{' '}
              <strong>{invitation.practices?.name}</strong>.
            </p>
            <Button onClick={() => navigate('/')}>Naar inloggen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Uitnodiging accepteren</h1>
          <p className="text-gray-500 text-sm mt-1">
            Je bent uitgenodigd als therapeut bij <strong>{invitation.practices?.name}</strong>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-5 h-5 text-blue-500" /> Jouw account aanmaken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>E-mailadres</Label>
                <Input value={invitation.email} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-1">
                <Label>Jouw naam <span className="text-red-500">*</span></Label>
                <Input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jan de Vries"
                />
              </div>
              <div className="space-y-1">
                <Label>Wachtwoord <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minimaal 8 tekens"
                />
              </div>
              <div className="space-y-1">
                <Label>Wachtwoord bevestigen <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={form.password2}
                  onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                  placeholder="Herhaal wachtwoord"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Account aanmaken
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
