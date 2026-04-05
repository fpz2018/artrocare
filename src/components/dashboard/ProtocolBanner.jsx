import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/button';
import { ArrowRight, Dumbbell, UserCheck } from 'lucide-react';
import { useI18n } from '@/i18n';

const ROUTE_CONFIG = {
  A: {
    icon: '🟢',
    label: 'Route A — Zelfmanagement',
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
    btn: 'bg-green-600 hover:bg-green-700',
    weeks: 6,
  },
  B: {
    icon: '🟠',
    label: 'Route B — Begeleid programma',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-800',
    btn: 'bg-orange-500 hover:bg-orange-600',
    weeks: 12,
  },
  C: {
    icon: '🔴',
    label: 'Route C — Intensief programma',
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
    btn: 'bg-red-600 hover:bg-red-700',
    weeks: 18,
  },
};

const JOINT_LABEL = {
  hip: 'Heup',
  knee: 'Knie',
  hand: 'Hand',
  shoulder: 'Schouder',
};

const SIDE_LABEL = {
  left: 'Links',
  right: 'Rechts',
  bilateral: 'Beide zijden',
};

export default function ProtocolBanner({ patientId }) {
  const { t } = useI18n();
  const { data: protocol, isLoading } = useQuery({
    queryKey: ['active-protocol', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_protocols')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    },
    enabled: !!patientId,
  });

  if (isLoading || !protocol) return null;

  const config = ROUTE_CONFIG[protocol.route];
  if (!config) return null;

  const startedAt = new Date(protocol.started_at);
  const now = new Date();
  const daysSinceStart = Math.floor((now - startedAt) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, config.weeks);
  const progressPct = Math.round((currentWeek / config.weeks) * 100);

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{config.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {JOINT_LABEL[protocol.joint_type] || protocol.joint_type}
              {protocol.side ? ` · ${SIDE_LABEL[protocol.side] || protocol.side}` : ''}
            </p>
          </div>
        </div>
        <Link to="/exercises">
          <Button size="sm" className={`${config.btn} text-white`}>
            <Dumbbell className="w-4 h-4 mr-1.5" />
            Oefeningen week {currentWeek}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Ingesteld door therapeut */}
      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
        <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{t('protocol_set_by_therapist')}</span>
      </div>

      {/* Voortgangsbalk */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Week {currentWeek} van {config.weeks}</span>
          <span>{progressPct}% voltooid</span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-2 border border-white">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              backgroundColor: protocol.route === 'A' ? '#16a34a' : protocol.route === 'B' ? '#ea580c' : '#dc2626',
            }}
          />
        </div>
      </div>
    </div>
  );
}
