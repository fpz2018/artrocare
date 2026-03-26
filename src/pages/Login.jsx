import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, LogIn, UserPlus, CheckCircle, Lock, Globe, Building2 } from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function Login() {
  const { t, language, setLanguage } = useI18n();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formReady, setFormReady] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setFormReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthenticated) return null;

  const isRegister = authMode === 'register';

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!formReady) return;
    setError('');
    setRegistrationSuccess(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(language === 'nl' ? 'Voer een geldig e-mailadres in' : 'Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError(language === 'nl' ? 'Wachtwoord moet minimaal 6 tekens zijn' : 'Password must be at least 6 characters');
      return;
    }
    if (isRegister && name.trim().length < 2) {
      setError(language === 'nl' ? 'Voer je naam in' : 'Enter your name');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await signIn(trimmedEmail, password);
      } else {
        const result = await signUp(trimmedEmail, password, { full_name: name.trim() });
        if (result?.user && !result?.session) {
          setRegistrationSuccess(true);
          return;
        }
      }
    } catch (err) {
      const msg = err?.message || '';
      const status = err?.status || 0;
      if (status === 429 || msg.includes('rate limit')) {
        setError(language === 'nl' ? 'Te veel pogingen. Wacht even en probeer opnieuw.' : 'Too many attempts. Please wait.');
      } else if (msg.includes('User already registered')) {
        setError(language === 'nl' ? 'Dit e-mailadres is al geregistreerd.' : 'This email is already registered.');
      } else if (msg.includes('Invalid login credentials')) {
        setError(language === 'nl' ? 'Onjuist e-mailadres of wachtwoord.' : 'Incorrect email or password.');
      } else if (msg.includes('Email not confirmed')) {
        setError(language === 'nl' ? 'Bevestig eerst je e-mailadres.' : 'Please confirm your email first.');
      } else {
        setError(msg || (language === 'nl' ? 'Er ging iets mis.' : 'Something went wrong.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(language === 'nl' ? 'Voer een geldig e-mailadres in' : 'Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(trimmedEmail);
    } finally {
      setResetEmailSent(true);
      setLoading(false);
    }
  };

  const switchMode = (mode) => { setAuthMode(mode); setError(''); setRegistrationSuccess(false); setResetEmailSent(false); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}>
          <Globe className="w-4 h-4 mr-1" />{language === 'nl' ? 'EN' : 'NL'}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-2">
            <Heart className="w-6 h-6 text-blue-600" /> Artrocare
          </Link>
        </div>

        <Card className="shadow-xl border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authMode === 'forgot_password'
                ? <><Lock className="w-5 h-5 text-blue-600" /> {language === 'nl' ? 'Wachtwoord vergeten' : 'Forgot password'}</>
                : isRegister
                ? <><UserPlus className="w-5 h-5 text-blue-600" /> {t('register_title')}</>
                : <><LogIn className="w-5 h-5 text-blue-600" /> {t('login_title')}</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authMode === 'forgot_password' ? (
              resetEmailSent ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <p className="font-semibold">{language === 'nl' ? 'E-mail verstuurd!' : 'Email sent!'}</p>
                  <p className="text-sm text-gray-500">{language === 'nl' ? 'Controleer je inbox voor de reset-link.' : 'Check your inbox for the reset link.'}</p>
                  <Button variant="outline" onClick={() => switchMode('login')}>{language === 'nl' ? 'Terug naar inloggen' : 'Back to login'}</Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-600">{language === 'nl' ? 'Vul je e-mailadres in voor een reset-link.' : 'Enter your email for a reset link.'}</p>
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')} required />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? (language === 'nl' ? 'Versturen...' : 'Sending...') : (language === 'nl' ? 'Reset-link versturen' : 'Send reset link')}
                  </Button>
                  <div className="text-center">
                    <button type="button" onClick={() => switchMode('login')} className="text-sm text-gray-500 hover:underline">
                      {language === 'nl' ? 'Terug naar inloggen' : 'Back to login'}
                    </button>
                  </div>
                </form>
              )
            ) : registrationSuccess ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="font-semibold">{language === 'nl' ? 'Registratie gelukt!' : 'Registration successful!'}</p>
                <p className="text-sm text-gray-500">{language === 'nl' ? 'Klik op de bevestigingslink in je inbox.' : 'Click the confirmation link in your inbox.'}</p>
                <Button variant="outline" onClick={() => switchMode('login')}>{language === 'nl' ? 'Naar inloggen' : 'Go to login'}</Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  {isRegister && (
                    <div className="space-y-2">
                      <Label>{t('set_name')}</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder={language === 'nl' ? 'Je volledige naam' : 'Your full name'} required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('password')}</Label>
                      {authMode === 'login' && (
                        <button type="button" onClick={() => switchMode('forgot_password')} className="text-xs text-blue-600 hover:underline">
                          {t('forgot_password')}
                        </button>
                      )}
                    </div>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={language === 'nl' ? 'Minimaal 6 tekens' : 'At least 6 characters'} required minLength={6} />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? (language === 'nl' ? 'Bezig...' : 'Loading...') : authMode === 'login' ? t('login') : (language === 'nl' ? 'Account aanmaken' : 'Create account')}
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                  {authMode === 'login' ? (
                    <p>{t('no_account')}{' '}<button type="button" onClick={() => switchMode('register')} className="text-blue-600 hover:underline font-medium">{t('register')}</button></p>
                  ) : (
                    <p>{t('has_account')}{' '}<button type="button" onClick={() => switchMode('login')} className="text-blue-600 hover:underline font-medium">{t('login')}</button></p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Link to="/register-practice" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600">
                    <Building2 className="w-4 h-4" />
                    {language === 'nl' ? 'Praktijk aanmelden' : 'Register your practice'}
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← {language === 'nl' ? 'Terug naar home' : 'Back to home'}</Link>
        </div>

        <InlineDisclaimer type="general" />
      </div>
    </div>
  );
}
