import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, CheckCircle, AlertCircle, Clock, Users,
  Euro, Calendar, ArrowRight, RefreshCw, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatEuro(amount) {
  return `€ ${parseFloat(amount || 0).toFixed(2).replace('.', ',')}`;
}

function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Actief',      class: 'bg-green-100 text-green-700' },
    paid:      { label: 'Betaald',     class: 'bg-green-100 text-green-700' },
    pending:   { label: 'In afwachting', class: 'bg-yellow-100 text-yellow-700' },
    suspended: { label: 'Opgeschort', class: 'bg-red-100 text-red-700' },
    failed:    { label: 'Mislukt',     class: 'bg-red-100 text-red-700' },
    canceled:  { label: 'Geannuleerd', class: 'bg-gray-100 text-gray-600' },
    valid:     { label: 'Geldig',      class: 'bg-green-100 text-green-700' },
    invalid:   { label: 'Ongeldig',    class: 'bg-red-100 text-red-700' },
    open:      { label: 'Openstaand',  class: 'bg-blue-100 text-blue-700' },
  };
  const s = map[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  return <Badge className={`text-xs ${s.class}`}>{s.label}</Badge>;
}

// ─── Patiënt Billing ──────────────────────────────────────────────────────────

function PatientBilling({ profile }) {
  const { language } = useI18n();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, payRes] = await Promise.all([
        supabase.from('billing_subscriptions').select('*').eq('user_id', profile.id).maybeSingle(),
        supabase.from('billing_payments').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(12),
      ]);
      setSubscription(subRes.data);
      setPayments(payRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/mollie-patient-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ redirectUrl: `${window.location.origin}/billing?checkout=success` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fout bij starten betaling');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error(err.message);
      setCheckoutLoading(false);
    }
  };

  const isActive = subscription?.status === 'active' || profile.subscription_tier === 'premium';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status kaart */}
      <Card className={isActive ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}>
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`p-3 rounded-full ${isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isActive
              ? <CheckCircle className="w-6 h-6 text-green-600" />
              : <AlertCircle className="w-6 h-6 text-amber-600" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {isActive
                ? (language === 'nl' ? 'Abonnement actief' : 'Subscription active')
                : (language === 'nl' ? 'Geen actief abonnement' : 'No active subscription')}
            </h3>
            {isActive ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>{language === 'nl' ? 'Uw abonnement: ' : 'Your subscription: '}
                  <strong>{formatEuro(subscription?.amount ?? 2)}/maand</strong>
                </p>
                {subscription?.next_payment_at && (
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {language === 'nl' ? 'Volgende betaling: ' : 'Next payment: '}
                    {formatDate(subscription.next_payment_at)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  {language === 'nl'
                    ? 'Start uw abonnement voor volledige toegang tot Artrocare (€2/maand).'
                    : 'Start your subscription for full access to Artrocare (€2/month).'}
                </p>
                <Button
                  onClick={startCheckout}
                  disabled={checkoutLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {checkoutLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    : <CreditCard className="w-4 h-4 mr-2" />}
                  {language === 'nl' ? 'Abonnement starten – €2/mnd' : 'Start subscription – €2/month'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-gray-500">
                  {language === 'nl'
                    ? 'Via Mollie – iDEAL, SEPA-incasso of creditcard. Maandelijks opzegbaar.'
                    : 'Via Mollie – iDEAL, SEPA direct debit or credit card. Cancel monthly.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uitleg pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-blue-600" />
            {language === 'nl' ? 'Hoe werkt de betaling?' : 'How does payment work?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'U betaalt €2 per maand voor toegang tot de Artrocare app.'
                : 'You pay €2 per month for access to the Artrocare app.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'Uw fysiotherapeut betaalt eveneens €2/maand als u actief gebruik maakt van de app.'
                : 'Your physiotherapist also pays €2/month when you actively use the app.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'Maandelijks opzegbaar via de opzeg-knop hieronder. Geen verborgen kosten.'
                : 'Cancel monthly via the cancel button below. No hidden costs.'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Betalingshistorie */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'nl' ? 'Betalingshistorie' : 'Payment history'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.description || 'Artrocare abonnement'}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.paid_at || p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="text-sm font-semibold text-gray-800">{formatEuro(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opzeggen */}
      {isActive && (
        <Card className="border-red-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {language === 'nl' ? 'Abonnement opzeggen' : 'Cancel subscription'}
              </p>
              <p className="text-xs text-gray-500">
                {language === 'nl'
                  ? 'Neem contact op via e-mail om uw abonnement op te zeggen.'
                  : 'Contact us by email to cancel your subscription.'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
              <XCircle className="w-4 h-4 mr-1" />
              {language === 'nl' ? 'Opzeggen' : 'Cancel'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Praktijk Billing ─────────────────────────────────────────────────────────

function PracticeBilling({ profile }) {
  const { language } = useI18n();
  const [mandate, setMandate] = useState(null);
  const [payments, setPayments] = useState([]);
  const [activeCount, setActiveCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const practiceId = profile.practice_id;
      if (!practiceId) return;

      const [mandateRes, payRes] = await Promise.all([
        supabase.from('billing_mandates').select('*').eq('practice_id', practiceId).maybeSingle(),
        supabase.from('billing_payments').select('*').eq('practice_id', practiceId)
          .order('created_at', { ascending: false }).limit(12),
      ]);
      setMandate(mandateRes.data);
      setPayments(payRes.data || []);

      // Actieve patiënten tellen (laatste 30 dagen)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

      // Therapeuten van deze praktijk
      const { data: therapists } = await supabase
        .from('profiles')
        .select('id')
        .eq('practice_id', practiceId)
        .eq('role', 'therapist');

      if (therapists?.length) {
        const therapistIds = therapists.map(t => t.id);
        // Patiënten van deze therapeuten
        const { data: patients } = await supabase
          .from('profiles')
          .select('id')
          .in('therapist_id', therapistIds)
          .eq('role', 'patient');

        if (patients?.length) {
          const patientIds = patients.map(p => p.id);
          // Unieke actieve patiënten
          const { data: measurements } = await supabase
            .from('measurements')
            .select('user_id')
            .in('user_id', patientIds)
            .gte('date', cutoff);

          const uniqueActive = new Set((measurements || []).map(m => m.user_id));
          setActiveCount(uniqueActive.size);
        } else {
          setActiveCount(0);
        }
      } else {
        setActiveCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [profile.practice_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const startMandateSetup = async () => {
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/mollie-practice-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ redirectUrl: `${window.location.origin}/practice?checkout=success` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fout bij instellen betaalmethode');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error(err.message);
      setCheckoutLoading(false);
    }
  };

  const estimatedBill = activeCount !== null ? (activeCount * 2).toFixed(2) : null;
  const mandateActive = mandate?.status === 'valid';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actieve patiënten + schatting */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">
                {language === 'nl' ? 'Actieve patiënten (30 dgn)' : 'Active patients (30 days)'}
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {activeCount !== null ? activeCount : '–'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'nl' ? '≥1 meting in afgelopen 30 dagen' : '≥1 measurement in last 30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-600">
                {language === 'nl' ? 'Schatting deze maand' : 'Estimate this month'}
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {estimatedBill !== null ? `€ ${estimatedBill.replace('.', ',')}` : '–'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {activeCount !== null ? `${activeCount} × € 2,00` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mandaat status */}
      <Card className={mandateActive ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}>
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`p-3 rounded-full ${mandateActive ? 'bg-green-100' : 'bg-amber-100'}`}>
            {mandateActive
              ? <CheckCircle className="w-6 h-6 text-green-600" />
              : <Clock className="w-6 h-6 text-amber-600" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {mandateActive
                ? (language === 'nl' ? 'Betaalmethode ingesteld' : 'Payment method set up')
                : (language === 'nl' ? 'Betaalmethode instellen' : 'Set up payment method')}
            </h3>
            {mandateActive ? (
              <div className="text-sm text-gray-600 space-y-1">
                {mandate.method && (
                  <p>{language === 'nl' ? 'Methode: ' : 'Method: '}
                    <strong className="capitalize">{mandate.method.replace('_', ' ')}</strong>
                  </p>
                )}
                {mandate.holder_name && (
                  <p>{language === 'nl' ? 'Rekeninghouder: ' : 'Account holder: '}
                    <strong>{mandate.holder_name}</strong>
                  </p>
                )}
                {mandate.account_number && (
                  <p>IBAN: <strong>{mandate.account_number}</strong></p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'nl'
                    ? 'Maandelijkse automatische incasso op de 1e van de maand.'
                    : 'Monthly automatic direct debit on the 1st of the month.'}
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  {language === 'nl'
                    ? 'Stel een SEPA-incasso of creditcard in voor automatische maandelijkse facturering.'
                    : 'Set up a SEPA direct debit or credit card for automatic monthly billing.'}
                </p>
                <Button
                  onClick={startMandateSetup}
                  disabled={checkoutLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {checkoutLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    : <CreditCard className="w-4 h-4 mr-2" />}
                  {language === 'nl' ? 'Betaalmethode instellen' : 'Set up payment method'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-gray-500">
                  {language === 'nl'
                    ? 'Via Mollie – iDEAL, SEPA-incasso of creditcard.'
                    : 'Via Mollie – iDEAL, SEPA direct debit or credit card.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uitleg pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-blue-600" />
            {language === 'nl' ? 'Hoe werkt de facturering?' : 'How does billing work?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'U betaalt €2 per actieve patiënt per maand.'
                : 'You pay €2 per active patient per month.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'Actief = minimaal 1 meting geregistreerd in de afgelopen 30 dagen.'
                : 'Active = at least 1 measurement logged in the past 30 days.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'Patiënten die stoppen met de app kosten u niets meer.'
                : 'Patients who stop using the app no longer cost you anything.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>
              {language === 'nl'
                ? 'Automatische incasso op de 1e van elke maand.'
                : 'Automatic direct debit on the 1st of each month.'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Betalingshistorie */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'nl' ? 'Factuurhistorie' : 'Invoice history'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {p.description || `${p.active_patients_count ?? '?'} actieve patiënten`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.billing_period_start
                        ? `${formatDate(p.billing_period_start)} – ${formatDate(p.billing_period_end)}`
                        : formatDate(p.paid_at || p.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="text-sm font-semibold text-gray-800">{formatEuro(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Hoofd pagina ─────────────────────────────────────────────────────────────

export default function Billing() {
  const { profile } = useAuth();
  const { language } = useI18n();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('checkout');
    if (status === 'success') {
      toast.success(
        language === 'nl'
          ? 'Betaling geslaagd! Uw abonnement wordt zo verwerkt.'
          : 'Payment successful! Your subscription will be processed shortly.',
      );
    }
  }, [searchParams, language]);

  const isPatient = profile?.role === 'patient';
  const isPracticeAdmin = profile?.role === 'practice_admin';

  if (!isPatient && !isPracticeAdmin) {
    return (
      <div className="text-center py-12 text-gray-500">
        {language === 'nl' ? 'Geen facturering beschikbaar voor uw rol.' : 'No billing available for your role.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          {language === 'nl' ? 'Facturering' : 'Billing'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isPatient
            ? (language === 'nl' ? 'Beheer uw maandelijks abonnement (€2/mnd)' : 'Manage your monthly subscription (€2/month)')
            : (language === 'nl' ? 'Factuuroverzicht op basis van actieve patiënten (€2/patiënt/mnd)' : 'Invoice overview based on active patients (€2/patient/month)')}
        </p>
      </div>

      {isPatient && <PatientBilling profile={profile} />}
      {isPracticeAdmin && <PracticeBilling profile={profile} />}
    </div>
  );
}
