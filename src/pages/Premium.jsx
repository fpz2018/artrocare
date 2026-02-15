import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Mail, Zap, Shield, Star, ToggleLeft, ToggleRight } from 'lucide-react';

const plans = [
  {
    id: 'free', priceMonthly: 0, priceYearly: 0,
    features: ['basic_exercises', 'daily_tracking', 'core_lessons', 'pain_prediction', 'basic_nutrition'],
  },
  {
    id: 'premium', priceMonthly: 9.99, priceYearly: 89.99,
    features: ['all_exercises', 'daily_tracking', 'all_lessons', 'advanced_prediction', 'personalized_nutrition', 'supplements_guide', 'therapist_sharing', 'priority_support'],
  },
  {
    id: 'practice', priceMonthly: 49.99, priceYearly: 449.99,
    features: ['everything_premium', 'therapist_dashboard', 'patient_management', 'analytics', 'branding', 'api_access'],
  },
];

export default function Premium() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [yearly, setYearly] = useState(false);

  const currentTier = profile?.subscription_tier || 'free';

  const featureLabels = {
    nl: {
      basic_exercises: 'Basis oefeningen', daily_tracking: 'Dagelijkse tracking', core_lessons: '3 kernlessen',
      pain_prediction: 'Pijnvoorspelling', basic_nutrition: 'Basis voedingstips', all_exercises: 'Alle oefeningen (NEMEX-TJR)',
      all_lessons: 'Alle lessen', advanced_prediction: 'Geavanceerde voorspelling', personalized_nutrition: 'Persoonlijk voedingsplan',
      supplements_guide: 'Supplementengids', therapist_sharing: 'Therapeut-deling', priority_support: 'Prioriteit support',
      everything_premium: 'Alles van Premium', therapist_dashboard: 'Therapeut dashboard', patient_management: 'Patient management',
      analytics: 'Analytics', branding: 'Eigen branding', api_access: 'API toegang',
    },
    en: {
      basic_exercises: 'Basic exercises', daily_tracking: 'Daily tracking', core_lessons: '3 core lessons',
      pain_prediction: 'Pain prediction', basic_nutrition: 'Basic nutrition tips', all_exercises: 'All exercises (NEMEX-TJR)',
      all_lessons: 'All lessons', advanced_prediction: 'Advanced prediction', personalized_nutrition: 'Personalized nutrition plan',
      supplements_guide: 'Supplements guide', therapist_sharing: 'Therapist sharing', priority_support: 'Priority support',
      everything_premium: 'Everything in Premium', therapist_dashboard: 'Therapist dashboard', patient_management: 'Patient management',
      analytics: 'Analytics', branding: 'Custom branding', api_access: 'API access',
    },
  };

  const labels = featureLabels[language] || featureLabels.nl;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Crown className="w-7 h-7 text-amber-500" />
        {t('prem_title')}
      </h1>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!yearly ? 'font-semibold' : 'text-gray-500'}`}>{t('prem_monthly')}</span>
        <button onClick={() => setYearly(!yearly)} className="relative w-12 h-6">
          <div className={`w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${yearly ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </div>
        </button>
        <span className={`text-sm ${yearly ? 'font-semibold' : 'text-gray-500'}`}>{t('prem_yearly')}</span>
        {yearly && <Badge className="bg-green-100 text-green-700 text-xs">-25%</Badge>}
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const price = yearly ? plan.priceYearly : plan.priceMonthly;

          return (
            <Card
              key={plan.id}
              className={`relative ${isCurrent ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' : ''} ${plan.id === 'premium' ? 'border-amber-300' : ''}`}
            >
              {plan.id === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white"><Star className="w-3 h-3 mr-1" />{language === 'nl' ? 'Populair' : 'Popular'}</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.id === 'free' && <Zap className="w-5 h-5 text-gray-500" />}
                  {plan.id === 'premium' && <Crown className="w-5 h-5 text-amber-500" />}
                  {plan.id === 'practice' && <Shield className="w-5 h-5 text-purple-500" />}
                  {t(`prem_${plan.id}`)}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{price === 0 ? (language === 'nl' ? 'Gratis' : 'Free') : `€${price}`}</span>
                  {price > 0 && <span className="text-gray-500 text-sm">{yearly ? t('prem_per_year') : t('prem_per_month')}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {labels[f] || f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${isCurrent ? 'bg-gray-200 text-gray-700' : plan.id === 'premium' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={isCurrent}
                >
                  {isCurrent ? t('prem_current') : price === 0 ? t('prem_current') : t('prem_upgrade')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-gray-700 mb-2">
            {language === 'nl' ? 'Vragen over Premium? Neem contact met ons op.' : 'Questions about Premium? Contact us.'}
          </p>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />{t('prem_contact')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
