import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import {
  Heart, Dumbbell, Apple, BookOpen, TrendingUp, Globe,
  LogIn, UserPlus, Building2, CheckCircle, Lock
} from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function Home() {
  const { t, language, setLanguage } = useI18n();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  // Prevent password-manager auto-submit: form is only interactive after 800ms
  const [formReady, setFormReady] = useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setFormReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const isRegister = authMode === 'register';

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!formReady) return; // Block auto-submit from password manager extensions
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
      setError(language === 'nl' ? 'Voer je naam in (minimaal 2 tekens)' : 'Enter your name (at least 2 characters)');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await signIn(trimmedEmail, password);
      } else {
        const metadata = { full_name: name.trim() };
        const result = await signUp(trimmedEmail, password, metadata);

        // Check if email confirmation is required
        if (result?.user && !result?.session) {
          setRegistrationSuccess(true);
          return;
        }
      }
    } catch (err) {
      // Handle specific error types with user-friendly messages
      const msg = err?.message || '';
      const status = err?.status || 0;

      if (status === 429 || msg.includes('rate limit') || msg.includes('Too Many Requests')) {
        setError(language === 'nl'
          ? 'Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.'
          : 'Too many attempts. Please wait a few minutes and try again.');
      } else if (msg.includes('User already registered') || msg.includes('already been registered')) {
        setError(language === 'nl'
          ? 'Dit e-mailadres is al geregistreerd. Probeer in te loggen.'
          : 'This email is already registered. Try logging in.');
      } else if (msg.includes('Invalid login credentials')) {
        setError(language === 'nl'
          ? 'Onjuist e-mailadres of wachtwoord.'
          : 'Incorrect email or password.');
      } else if (msg.includes('Email not confirmed')) {
        setError(language === 'nl'
          ? 'Bevestig eerst je e-mailadres via de link in je inbox.'
          : 'Please confirm your email address first via the link in your inbox.');
      } else {
        setError(msg || (language === 'nl' ? 'Er ging iets mis. Probeer het opnieuw.' : 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Dumbbell, title: t('home_feature_exercises'), desc: t('home_feature_exercises_desc') },
    { icon: Apple, title: t('home_feature_nutrition'), desc: t('home_feature_nutrition_desc') },
    { icon: BookOpen, title: t('home_feature_education'), desc: t('home_feature_education_desc') },
    { icon: TrendingUp, title: t('home_feature_tracking'), desc: t('home_feature_tracking_desc') },
  ];

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setRegistrationSuccess(false);
    setResetEmailSent(false);
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
      setResetEmailSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setResetEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
        >
          <Globe className="w-4 h-4 mr-1" />
          {language === 'nl' ? 'EN' : 'NL'}
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Heart className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">{t('app_name')}</h1>
              </div>
              <p className="text-xl text-gray-600">{t('home_tagline')}</p>
              <p className="text-gray-500">{t('home_description')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="bg-white/80 border-blue-100">
                  <CardContent className="p-4">
                    <Icon className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <InlineDisclaimer type="general" />
          </div>

          {/* Right: Auth form */}
          <Card className="shadow-xl border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {authMode === 'login' ? (
                  <><LogIn className="w-5 h-5 text-blue-600" /> {t('login_title')}</>
                ) : authMode === 'forgot_password' ? (
                  <><Lock className="w-5 h-5 text-blue-600" /> {language === 'nl' ? 'Wachtwoord vergeten' : 'Forgot password'}</>
                ) : (
                  <><UserPlus className="w-5 h-5 text-blue-600" /> {t('register_title')}</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {authMode === 'forgot_password' ? (
                resetEmailSent ? (
                  <div className="text-center py-6 space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {language === 'nl' ? 'E-mail verstuurd!' : 'Email sent!'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {language === 'nl'
                        ? 'Als dit e-mailadres bij ons bekend is, ontvang je een link om je wachtwoord te resetten.'
                        : 'If this email is registered, you will receive a password reset link.'}
                    </p>
                    <Button variant="outline" onClick={() => switchAuthMode('login')} className="mt-2">
                      {language === 'nl' ? 'Terug naar inloggen' : 'Back to login'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {language === 'nl'
                        ? 'Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.'
                        : 'Enter your email address and we\'ll send you a reset link.'}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">{t('email')}</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('email')}
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                    )}
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                      {loading
                        ? (language === 'nl' ? 'Versturen...' : 'Sending...')
                        : (language === 'nl' ? 'Reset-link versturen' : 'Send reset link')}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => switchAuthMode('login')}
                        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        {language === 'nl' ? 'Terug naar inloggen' : 'Back to login'}
                      </button>
                    </div>
                  </form>
                )
              ) : registrationSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'nl' ? 'Registratie gelukt!' : 'Registration successful!'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'nl'
                      ? 'Controleer je e-mail inbox en klik op de bevestigingslink om je account te activeren.'
                      : 'Check your email inbox and click the confirmation link to activate your account.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => switchAuthMode('login')}
                    className="mt-4"
                  >
                    {language === 'nl' ? 'Naar inloggen' : 'Go to login'}
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {isRegister && (
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('set_name')}</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={language === 'nl' ? 'Je volledige naam' : 'Your full name'}
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('email')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('password')}</Label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => switchAuthMode('forgot_password')}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {t('forgot_password')}
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={language === 'nl' ? 'Minimaal 6 tekens' : 'At least 6 characters'}
                        required
                        minLength={6}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className={`w-full ${isTherapist ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {loading
                        ? (language === 'nl' ? 'Bezig...' : 'Loading...')
                        : authMode === 'login'
                          ? t('login')
                          : (language === 'nl' ? 'Account aanmaken' : 'Create account')
                      }
                    </Button>
                  </form>

                  <div className="mt-4 text-center text-sm text-gray-600">
                    {authMode === 'login' ? (
                      <p>
                        {t('no_account')}{' '}
                        <button
                          type="button"
                          onClick={() => switchAuthMode('register')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {t('register')}
                        </button>
                      </p>
                    ) : (
                      <p>
                        {t('has_account')}{' '}
                        <button
                          type="button"
                          onClick={() => switchAuthMode('login')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {t('login')}
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <Link
                      to="/register-practice"
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 hover:underline"
                    >
                      <Building2 className="w-4 h-4" />
                      {language === 'nl' ? 'Praktijk aanmelden' : 'Register your practice'}
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
