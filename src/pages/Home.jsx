import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Heart, Dumbbell, Apple, BookOpen, TrendingUp, Globe,
  LogIn, UserPlus, Stethoscope
} from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function Home() {
  const { t, language, setLanguage } = useI18n();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Use effect for navigation instead of calling during render
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(language === 'nl' ? 'Voer een geldig e-mailadres in' : 'Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError(language === 'nl' ? 'Wachtwoord moet minimaal 6 tekens zijn' : 'Password must be at least 6 characters');
      return;
    }
    if (authMode === 'register' && name.trim().length < 2) {
      setError(language === 'nl' ? 'Voer je naam in (minimaal 2 tekens)' : 'Enter your name (at least 2 characters)');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password, { full_name: name.trim() });
      }
      // Navigation handled by onAuthStateChange via AuthProvider
    } catch (err) {
      setError(err.message || t('error'));
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
                ) : (
                  <><UserPlus className="w-5 h-5 text-blue-600" /> {t('register_title')}</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('set_name')}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('set_name')}
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
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password')}
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? t('loading') : authMode === 'login' ? t('login') : t('register')}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  {authMode === 'login' ? (
                    <p>
                      {t('no_account')}{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setError(''); }}
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
                        onClick={() => { setAuthMode('login'); setError(''); }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {t('login')}
                      </button>
                    </p>
                  )}
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="w-full text-gray-500"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  {t('login_as_therapist')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
