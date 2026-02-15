import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Pill, Lock, Shield, AlertTriangle, Star } from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

const evidenceColors = { strong: 'bg-green-100 text-green-700', moderate: 'bg-amber-100 text-amber-700', limited: 'bg-orange-100 text-orange-700', insufficient: 'bg-red-100 text-red-700' };

export default function Supplements() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [selected, setSelected] = useState(null);

  const { data: supplements = [], isLoading } = useQuery({
    queryKey: ['supplements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('supplements').select('*').order('name_nl');
      if (error) throw error;
      return data || [];
    },
  });

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'practice';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Pill className="w-7 h-7 text-purple-600" />
        {t('supp_title')}
      </h1>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{t('supp_safety')}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {supplements.map((supp) => {
            const isLocked = supp.is_premium && !isPremium;
            return (
              <Card
                key={supp.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${isLocked ? 'opacity-60' : ''}`}
                onClick={() => !isLocked && setSelected(supp)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{language === 'nl' ? supp.name_nl : supp.name_en}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {language === 'nl' ? supp.description_nl : supp.description_en}
                      </p>
                    </div>
                    {isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : <Star className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={evidenceColors[supp.evidence_level] || ''}>{supp.evidence_level}</Badge>
                    {supp.is_premium && <Badge variant="secondary">{t('supp_premium_only')}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'nl' ? selected.name_nl : selected.name_en}</DialogTitle>
              <DialogDescription>{language === 'nl' ? selected.description_nl : selected.description_en}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">{t('supp_dosage')}</h4>
                <p>{language === 'nl' ? selected.dosage_nl : selected.dosage_en}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('supp_timing')}</h4>
                <p>{language === 'nl' ? selected.timing_nl : selected.timing_en}</p>
              </div>
              {(language === 'nl' ? selected.benefits_nl : selected.benefits_en)?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1">{t('supp_benefits')}</h4>
                  <ul className="space-y-1">
                    {(language === 'nl' ? selected.benefits_nl : selected.benefits_en).map((b, i) => (
                      <li key={i} className="text-green-700">✓ {b}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(language === 'nl' ? selected.safety_notes_nl : selected.safety_notes_en) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-xs">{language === 'nl' ? selected.safety_notes_nl : selected.safety_notes_en}</p>
                  </div>
                </div>
              )}
              <InlineDisclaimer type="supplements" />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <InlineDisclaimer type="supplements" />
    </div>
  );
}
