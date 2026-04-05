import React, { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Bell } from 'lucide-react';

export default function PainPrediction({ measurements = [] }) {
  const { t } = useI18n();

  const trend = useMemo(() => {
    if (measurements.length < 3) return null;

    const recent = measurements.slice(-3);
    const prior = measurements.slice(-6, -3);

    const avg = (arr) => {
      const vals = arr.map((m) => m.pain_level).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const recentAvg = avg(recent);
    const priorAvg = avg(prior);

    if (recentAvg == null || priorAvg == null || priorAvg === 0) return null;

    const pctChange = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
    const direction = pctChange > 5 ? 'up' : pctChange < -5 ? 'down' : 'stable';

    return { pctChange: Math.abs(pctChange), direction };
  }, [measurements]);

  const trendConfig = {
    up: {
      Icon: TrendingUp,
      label: t('pred_trend_up'),
      color: 'text-amber-700',
      bg: 'from-amber-50 to-orange-50',
      iconColor: 'text-amber-600',
    },
    down: {
      Icon: TrendingDown,
      label: t('pred_trend_down'),
      color: 'text-green-700',
      bg: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
    },
    stable: {
      Icon: Minus,
      label: t('pred_trend_stable'),
      color: 'text-blue-700',
      bg: 'from-blue-50 to-sky-50',
      iconColor: 'text-blue-600',
    },
  };

  if (!trend) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            {t('pred_trend_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('pred_no_trend_data')}</p>
        </CardContent>
      </Card>
    );
  }

  const { Icon, label, color, bg, iconColor } = trendConfig[trend.direction];

  return (
    <Card className={`bg-gradient-to-br ${bg} border-gray-200`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {t('pred_trend_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-base font-semibold ${color}`}>
          {label}
          {trend.direction !== 'stable' && (
            <span className="font-normal text-sm ml-1">
              ({trend.pctChange}%{t('pred_trend_pct_suffix')})
            </span>
          )}
        </p>

        {trend.direction === 'up' && (
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/60 rounded-lg p-2.5">
            <Bell className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{t('pred_therapist_notified')}</span>
          </div>
        )}

        <p className="text-xs text-gray-400">{t('pred_set_by_therapist')}</p>
      </CardContent>
    </Card>
  );
}
