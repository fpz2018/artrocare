import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain, TrendingUp, Moon, Frown, Activity, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, ShieldCheck
} from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

export default function PainPrediction({ measurements = [] }) {
  const { t } = useI18n();
  const [showDetails, setShowDetails] = useState(false);

  const prediction = useMemo(() => {
    if (measurements.length < 5) {
      return { level: 'insufficient_data', score: 0, confidence: 0, factors: [], recommendations: [] };
    }

    const recent = measurements.slice(-7);
    const prior = measurements.slice(-14, -7);

    const avg = (arr, key) => {
      const vals = arr.map((m) => m[key]).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const recentPain = avg(recent, 'pain_level');
    const priorPain = avg(prior, 'pain_level');
    const recentSleep = avg(recent, 'sleep_quality');
    const recentStress = avg(recent, 'stress_level');
    const exerciseDays = recent.filter((m) => m.exercise_done).length;

    let score = 0;
    const factors = [];
    const recommendations = [];

    // Rising pain
    if (priorPain > 0 && recentPain > priorPain + 1) {
      score += 2;
      factors.push('rising_pain');
      recommendations.push(t('language') === 'nl' ? 'Verminder tijdelijk de intensiteit van je oefeningen' : 'Temporarily reduce exercise intensity');
    }

    // Poor sleep
    if (recentSleep < 5 && recentSleep > 0) {
      score += 2;
      factors.push('poor_sleep');
      recommendations.push(t('language') === 'nl' ? 'Focus op slaaphygiene: vaste bedtijden, geen schermen voor het slapen' : 'Focus on sleep hygiene: consistent bedtimes, no screens before sleep');
    }

    // High stress
    if (recentStress > 6) {
      score += 1.5;
      factors.push('high_stress');
      recommendations.push(t('language') === 'nl' ? 'Probeer ontspanningsoefeningen of ademhalingsoefeningen' : 'Try relaxation exercises or breathing exercises');
    }

    // Low activity
    if (exerciseDays < 2) {
      score += 1;
      factors.push('low_activity');
      recommendations.push(t('language') === 'nl' ? 'Probeer minstens 3x per week te bewegen, ook al is het licht' : 'Try to exercise at least 3x per week, even if it\'s light');
    }

    const level = score >= 5 ? 'high' : score >= 3 ? 'moderate' : 'low';
    const confidence = Math.min(90, 40 + measurements.length * 3);

    return { level, score, confidence, factors, recommendations };
  }, [measurements, t]);

  const riskColors = { low: 'text-green-700', moderate: 'text-amber-700', high: 'text-red-700', insufficient_data: 'text-gray-500' };
  const riskBgColors = { low: 'from-green-50 to-emerald-50', moderate: 'from-amber-50 to-orange-50', high: 'from-red-50 to-rose-50', insufficient_data: 'from-gray-50 to-slate-50' };

  const factorIcons = {
    rising_pain: TrendingUp,
    poor_sleep: Moon,
    high_stress: Frown,
    low_activity: Activity,
  };

  return (
    <Card className={`bg-gradient-to-br ${riskBgColors[prediction.level]} border-gray-200`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            {t('pred_title')}
          </CardTitle>
          <Badge className={riskColors[prediction.level]}>
            {t(`pred_${prediction.level}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {prediction.level !== 'insufficient_data' && (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{t('pred_confidence')}</span>
                <span className="font-semibold">{Math.round(prediction.confidence)}%</span>
              </div>
              <Progress value={prediction.confidence} className="h-2" />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-center"
            >
              {showDetails ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {showDetails ? t('close') : t('pred_factors')}
            </Button>

            {showDetails && (
              <div className="space-y-4">
                {prediction.factors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">{t('pred_factors')}:</p>
                    <div className="space-y-2">
                      {prediction.factors.map((factor) => {
                        const Icon = factorIcons[factor] || AlertTriangle;
                        return (
                          <div key={factor} className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-amber-600" />
                            <span className="capitalize">{factor.replace(/_/g, ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {prediction.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">{t('pred_recommendations')}:</p>
                    <ul className="space-y-1 text-sm">
                      {prediction.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <InlineDisclaimer type="ai" />
      </CardContent>
    </Card>
  );
}
