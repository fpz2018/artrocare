import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase v2 PKCE flow: token_hash comes as query param
    // Older implicit flow: access_token comes in URL hash
    // We handle both, plus listen for the PASSWORD_RECOVERY auth event.

    async function tryExchangeToken() {
      // 1. PKCE flow: ?token_hash=...&type=recovery
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');

      if (tokenHash && type === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (!verifyError) {
          setSessionReady(true);
          // Clean up URL
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        setError('Ongeldige of verlopen reset-link. Vraag een nieuwe aan.');
        return;
      }

      // 2. Implicit flow or already-processed session: check existing session
      // Wait briefly for AuthContext to process the hash token first
      await new Promise(r => setTimeout(r, 800));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // 3. If still no session, wait for PASSWORD_RECOVERY event (fired by Supabase)
      // The listener below will catch it
    }

    tryExchangeToken();

    // Listen for the PASSWORD_RECOVERY auth event - most reliable method
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fallback: if after 5s still no session, show error
  useEffect(() => {
    if (sessionReady || success) return;
    const timer = setTimeout(() => {
      if (!sessionReady) {
        setError('Ongeldige of verlopen reset-link. Vraag een nieuwe aan via de inlogpagina.');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [sessionReady, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err?.message || 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Logo height={64} />
        </div>

        <Card className="shadow-xl border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Nieuw wachtwoord instellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">Wachtwoord gewijzigd!</h3>
                <p className="text-gray-600">
                  Je wordt over enkele seconden doorgestuurd naar de inlogpagina.
                </p>
              </div>
            ) : !sessionReady && !error ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Link verifiëren...</p>
              </div>
            ) : error && !sessionReady ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  Terug naar inloggen
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nieuw wachtwoord</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 8 tekens"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Wachtwoord bevestigen</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Herhaal wachtwoord"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2"
                >
                  Terug naar inloggen
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
