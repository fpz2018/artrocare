// Page 6 — Intermittent Living. Cold exposure, sauna and meditation with timers.
import React from 'react';
import { Snowflake, Flame, Brain, AlertTriangle } from 'lucide-react';
import { FitCard, RoundCheck, MinuteStepper } from '../components/ui';
import { cn } from '@/lib/utils';

function ActivityCard({
  icon: Icon, title, description, done, duration, onToggle, onDuration,
  doneClasses, iconColor, footer,
}) {
  return (
    <FitCard className={cn('space-y-3 transition', done && doneClasses)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', iconColor)} />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#1B4332]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#2D3436]">{description}</p>
        </div>
        <RoundCheck checked={done} onClick={onToggle} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#8B7E6A]">Duur</span>
        <MinuteStepper value={duration} onChange={onDuration} />
      </div>
      {footer}
    </FitCard>
  );
}

export default function Intermittent({ today, update }) {
  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Intermittent Living</h1>
        <p className="text-sm text-[#8B7E6A]">Koude-expositie, sauna en meditatie</p>
      </header>

      <ActivityCard
        icon={Snowflake}
        iconColor="text-blue-500"
        title="Koude-expositie"
        description="Start met 30 sec koude douche, bouw op naar 2-3 min @ 10-15°C."
        done={today.coldExposure}
        duration={today.coldDuration}
        onToggle={() => update({ coldExposure: !today.coldExposure })}
        onDuration={(v) => update({ coldDuration: v })}
        doneClasses="border-blue-400 bg-blue-50"
        footer={(
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 p-2 text-[12px] text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Nooit direct na krachttraining.
          </div>
        )}
      />

      <ActivityCard
        icon={Flame}
        iconColor="text-red-500"
        title="Sauna"
        description="80-100°C, 15-20 min. 2-4x per week. Hydrateer!"
        done={today.sauna}
        duration={today.saunaDuration}
        onToggle={() => update({ sauna: !today.sauna })}
        onDuration={(v) => update({ saunaDuration: v })}
        doneClasses="border-red-400 bg-red-50"
        footer={(
          <p className="rounded-md bg-[#EDE8E0] p-2 text-[12px] italic text-[#8B7E6A]">
            Dr. Rhonda Patrick: sauna 4-7x/week = 40% lagere sterftekans.
          </p>
        )}
      />

      <ActivityCard
        icon={Brain}
        iconColor="text-green-600"
        title="Meditatie / Ademhaling"
        description="10-20 min/dag. 4-7-8 ademhaling of box breathing."
        done={today.meditation}
        duration={today.meditationDuration}
        onToggle={() => update({ meditation: !today.meditation })}
        onDuration={(v) => update({ meditationDuration: v })}
        doneClasses="border-green-400 bg-green-50"
        footer={(
          <p className="rounded-md bg-[#EDE8E0] p-2 text-[12px] italic text-[#8B7E6A]">
            Huberman: Physiological Sigh tussen sets.
          </p>
        )}
      />
    </div>
  );
}
