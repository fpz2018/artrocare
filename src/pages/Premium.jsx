import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, CreditCard, Users, Euro, ArrowRight, Stethoscope } from 'lucide-react';

export default function Premium() {
  const { profile } = useAuth();
  const { language } = useI18n();
  const isPremium = profile?.subscription_tier === 'premium';

  const nl = {
    title: 'Pricing',
    subtitle: 'Eerlijk gedeeld: patiënt én fysiotherapeut betalen elk een klein deel.',
    patient_card_title: 'Voor patiënten',
    patient_price: '€ 2',
    patient_period: '/maand',
    patient_desc: 'Volledige toegang tot alle functies van Artrocare.',
    patient_features: [
      'Alle oefeningen (NEMEX-TJR programma)',
      'Dagelijkse check-ins & pijntracking',
      'Alle lessen & kennisbank',
      'Persoonlijk voedingsplan',
      'Supplementengids',
      'Voortgang delen met therapeut',
      'Maandelijks opzegbaar',
    ],
    patient_cta_active: 'Abonnement actief',
    patient_cta: 'Abonnement starten',
    practice_card_title: 'Voor fysiotherapeuten',
    practice_price: '€ 2',
    practice_period: '/actieve patiënt/mnd',
    practice_desc: 'Betaal alleen voor patiënten die de app daadwerkelijk gebruiken.',
    practice_features: [
      'Therapeuten-dashboard met patiëntoverzicht',
      'Real-time voortgang & pijnmonitoring',
      'HOOS-12 uitkomstmaten',
      'Opvlammingssignalering',
      'Onbeperkt therapeuten per praktijk',
      'Geen vast abonnement – pay-per-active-user',
      'Automatische maandelijkse incasso',
    ],
    practice_cta: 'Betaalmethode instellen',
    active_label: 'Actief',
    shared_title: 'Gedeelde verantwoordelijkheid',
    shared_desc: 'De kosten zijn eerlijk verdeeld: u betaalt €2/mnd als patiënt, uw fysiotherapeut betaalt €2/mnd per actieve patiënt. Samen financiert u de app die u beiden gebruikt.',
    active_patients_note: 'Actief = minimaal 1 meting in de afgelopen 30 dagen.',
    goto_billing: 'Naar mijn facturering',
  };

  const en = {
    title: 'Pricing',
    subtitle: 'Fairly shared: patient and physiotherapist each pay a small share.',
    patient_card_title: 'For patients',
    patient_price: '€ 2',
    patient_period: '/month',
    patient_desc: 'Full access to all Artrocare features.',
    patient_features: [
      'All exercises (NEMEX-TJR program)',
      'Daily check-ins & pain tracking',
      'All lessons & knowledge base',
      'Personalized nutrition plan',
      'Supplements guide',
      'Share progress with therapist',
      'Cancel monthly',
    ],
    patient_cta_active: 'Subscription active',
    patient_cta: 'Start subscription',
    practice_card_title: 'For physiotherapists',
    practice_price: '€ 2',
    practice_period: '/active patient/month',
    practice_desc: 'Only pay for patients who actually use the app.',
    practice_features: [
      'Therapist dashboard with patient overview',
      'Real-time progress & pain monitoring',
      'HOOS-12 outcome measures',
      'Flare-up alerts',
      'Unlimited therapists per practice',
      'No fixed subscription – pay-per-active-user',
      'Automatic monthly direct debit',
    ],
    practice_cta: 'Set up payment method',
    active_label: 'Active',
    shared_title: 'Shared responsibility',
    shared_desc: 'Costs are fairly split: you pay €2/month as a patient, your physiotherapist pays €2/month per active patient. Together you fund the app you both use.',
    active_patients_note: 'Active = at least 1 measurement in the past 30 days.',
    goto_billing: 'Go to my billing',
  };

  const t = language === 'nl' ? nl : en;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Crown className="w-7 h-7 text-amber-500" />
          {t.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Twee prijs-kaarten naast elkaar */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* Patiënt kaart */}
        <Card className={`relative border-2 ${isPremium ? 'border-green-400 shadow-lg' : 'border-blue-200'}`}>
          {isPremium && (
            <div className="absolute -top-3 left-4">
              <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {t.active_label}
              </span>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="w-5 h-5 text-amber-500" />
              {t.patient_card_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-gray-900">{t.patient_price}</span>
              <span className="text-gray-500 text-sm mb-1">{t.patient_period}</span>
            </div>
            <p className="text-sm text-gray-600">{t.patient_desc}</p>
            <ul className="space-y-2">
              {t.patient_features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {profile?.role === 'patient' && (
              <Link to="/billing">
                <Button
                  className={`w-full mt-2 ${isPremium ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isPremium ? t.patient_cta_active : t.patient_cta}
                  {!isPremium && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Fysiotherapeut kaart */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="w-5 h-5 text-purple-500" />
              {t.practice_card_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-gray-900">{t.practice_price}</span>
              <span className="text-gray-500 text-sm mb-1">{t.practice_period}</span>
            </div>
            <p className="text-sm text-gray-600">{t.practice_desc}</p>
            <ul className="space-y-2">
              {t.practice_features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {profile?.role === 'practice_admin' && (
              <Link to="/billing">
                <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t.practice_cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gedeelde verantwoordelijkheid uitleg */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex -space-x-2 shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center">
              <Euro className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t.shared_title}</h3>
            <p className="text-sm text-gray-600">{t.shared_desc}</p>
            <p className="text-xs text-gray-400 mt-2">{t.active_patients_note}</p>
          </div>
        </CardContent>
      </Card>

      {/* Link naar billing */}
      {(profile?.role === 'patient' || profile?.role === 'practice_admin') && (
        <div className="text-center">
          <Link to="/billing" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            {t.goto_billing} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
