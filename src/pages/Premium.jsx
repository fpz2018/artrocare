import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown, Check, Mail, Dumbbell, ChefHat, Pill, Stethoscope, Users, Sparkles, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

const FOUNDING_PRICE = 97;
const REGULAR_PRICE = 197;
const FOUNDING_LIMIT = 50;

export default function Premium() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'practice';

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          email: profile.email,
          locale: language,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Dumbbell, key: 'fm_feature_program' },
    { icon: Stethoscope, key: 'fm_feature_checkins' },
    { icon: ChefHat, key: 'fm_feature_recipes' },
    { icon: Pill, key: 'fm_feature_supplements' },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full border border-amber-200">
          <Sparkles className="w-4 h-4" /> {t('fm_badge')}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('fm_title')}</h1>
        <p className="text-gray-500 max-w-md mx-auto">{t('fm_subtitle')}</p>
      </div>

      {/* Price card */}
      <Card className="border-2 border-amber-300 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          {t('fm_limited')}
        </div>
        <CardContent className="p-8 space-y-6">
          {/* Price */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-gray-400 line-through">{REGULAR_PRICE}</span>
              <span className="text-5xl font-bold text-gray-900">{FOUNDING_PRICE}</span>
            </div>
            <p className="text-sm text-gray-500">{t('fm_price_note')}</p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{t(key)}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isPremium ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{t('fm_already_member')}</span>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold py-6"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  {t('fm_cta')}
                </>
              )}
            </Button>
          )}

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 pt-2">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {t('fm_trust_secure')}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t('fm_trust_limit')}</span>
          </div>
        </CardContent>
      </Card>

      {/* What you get details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">{t('fm_what_you_get')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{t(`fm_benefit_${i}`)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-gray-700 mb-2">{t('fm_questions')}</p>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />{t('prem_contact')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
