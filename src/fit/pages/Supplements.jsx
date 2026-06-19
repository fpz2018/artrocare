// Page 4 — Supplementen. Daily protocol with dosage, timing and science.
import React from 'react';
import { Clock, Zap } from 'lucide-react';
import { FitCard, SectionHeading, ProgressBar, RoundCheck } from '../components/ui';
import { SUPPLEMENTS, TARGETS } from '../lib/data';
import { cn } from '@/lib/utils';

export default function Supplements({ items, toggle, takenCount }) {
  // Merge the static protocol (science/timing) with the per-day taken state.
  const merged = SUPPLEMENTS.map((s) => {
    const log = items.find((i) => i.name === s.name) || { taken: false, time: '' };
    return { ...s, taken: log.taken, time: log.time };
  });

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Supplementen</h1>
        <p className="text-sm text-[#8B7E6A]">Dagelijks protocol met dosering en timing</p>
      </header>

      {/* Progress */}
      <FitCard>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#1B4332]">Vandaag</span>
          <span className="text-lg font-bold text-[#D4A574]">{takenCount}/{TARGETS.supplements}</span>
        </div>
        <ProgressBar value={takenCount} max={TARGETS.supplements} className="mt-2" />
      </FitCard>

      {/* Supplement list */}
      <div className="space-y-3">
        {merged.map((s) => (
          <FitCard
            key={s.name}
            className={cn(
              'transition',
              s.taken && 'border-[#1B4332] bg-[#1B4332]/5',
            )}
          >
            <div className="flex gap-3">
              <RoundCheck checked={s.taken} onClick={() => toggle(s.name)} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[#1B4332]">{s.name} — {s.dosage}</div>
                <div className="mt-0.5 text-sm text-[#2D3436]">{s.science}</div>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-[#8B7E6A]">
                  <Clock className="h-3.5 w-3.5" />
                  {s.timing}{s.taken && s.time ? ` · ingenomen ${s.time}` : ''}
                </div>
              </div>
            </div>
          </FitCard>
        ))}
      </div>

      {/* Whey reminder */}
      <FitCard className="bg-[#D4A574]/20 border-[#D4A574]">
        <div className="flex items-center gap-2 text-[#1B4332]">
          <Zap className="h-5 w-5" />
          <span className="font-semibold">Whey reminder</span>
        </div>
        <p className="mt-1 text-sm text-[#2D3436]">Whey proteïne 25–50g direct na krachttraining.</p>
      </FitCard>
    </div>
  );
}
