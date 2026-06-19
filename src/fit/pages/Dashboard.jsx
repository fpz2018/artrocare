// Page 1 — Dashboard. One-glance overview of the day.
import React from 'react';
import {
  Dumbbell, Utensils, Pill, TrendingUp, Snowflake, ClipboardList, Check, X,
} from 'lucide-react';
import { FitCard, KpiCard, SectionHeading } from '../components/ui';
import { TARGETS } from '../lib/data';
import { formatDutchDate, todayISO, weekDates, WEEKDAY_LETTERS } from '../lib/date';

function StatusRow({ label, value, done }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#EDE8E0] last:border-0">
      <span className="text-sm text-[#2D3436]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#1B4332]">
        {value}
        {done === true && <Check className="h-4 w-4 text-[#1B4332]" />}
        {done === false && <X className="h-4 w-4 text-[#8B7E6A]" />}
      </span>
    </div>
  );
}

const NAV = [
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Voeding', icon: Utensils },
  { id: 'supplements', label: 'Supplementen', icon: Pill },
  { id: 'progress', label: 'Progressie', icon: TrendingUp },
  { id: 'intermittent', label: 'Intermittent', icon: Snowflake },
  { id: 'cheat', label: 'Cheat Sheet', icon: ClipboardList },
];

export default function Dashboard({ workouts, nutrition, supplements, progress, intermittent, onNavigate }) {
  const today = todayISO();
  const week = weekDates(today);

  const trainedDates = new Set(workouts.workouts.map((w) => w.date));
  const trainedThisWeek = week.filter((d) => trainedDates.has(d)).length;

  const todayWorkout = workouts.workouts.find((w) => w.date === today);
  const lastProgress = progress.entries.length ? progress.entries[progress.entries.length - 1] : null;

  const cal = nutrition.totals.calories;
  const prot = nutrition.totals.protein;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">{formatDutchDate(today)}</h1>
        <p className="text-sm text-[#8B7E6A]">Jouw dagelijkse overzicht — stap voor stap naar 94kg</p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Trainingen deze week"
          value={`${trainedThisWeek}/${TARGETS.workoutsPerWeek}`}
          current={trainedThisWeek}
          max={TARGETS.workoutsPerWeek}
          onClick={() => onNavigate('training')}
        />
        <KpiCard
          label="Calorieën vandaag"
          value={`${cal}`}
          sub={`/ ${TARGETS.calories} kcal`}
          current={cal}
          max={TARGETS.calories}
          onClick={() => onNavigate('nutrition')}
        />
        <KpiCard
          label="Proteïne vandaag"
          value={`${prot}g`}
          sub={`/ ${TARGETS.protein}g`}
          current={prot}
          max={TARGETS.protein}
          onClick={() => onNavigate('nutrition')}
        />
        <KpiCard
          label="Supplementen"
          value={`${supplements.takenCount}/${TARGETS.supplements}`}
          sub={`${Math.round((supplements.takenCount / TARGETS.supplements) * 100)}%`}
          current={supplements.takenCount}
          max={TARGETS.supplements}
          onClick={() => onNavigate('supplements')}
        />
      </div>

      {/* Week overview */}
      <FitCard>
        <SectionHeading>Weekoverzicht</SectionHeading>
        <div className="flex justify-between gap-1">
          {week.map((d, i) => {
            const isToday = d === today;
            const trained = trainedDates.has(d);
            const color = trained ? 'bg-[#1B4332]' : isToday ? 'bg-[#D4A574]' : 'bg-[#EDE8E0]';
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <div className={`h-9 w-full rounded-md ${color}`} />
                <span className="text-[11px] text-[#8B7E6A]">{WEEKDAY_LETTERS[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#8B7E6A]">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-[#1B4332]" /> Getraind</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-[#D4A574]" /> Vandaag</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-[#EDE8E0]" /> Rust</span>
        </div>
      </FitCard>

      {/* Status today */}
      <FitCard>
        <SectionHeading>Status Vandaag</SectionHeading>
        <StatusRow
          label="Training"
          value={todayWorkout ? `${typeLabel(todayWorkout)} ` : 'Nog niet'}
          done={!!todayWorkout}
        />
        <StatusRow label="Supplementen" value={`${supplements.takenCount}/${TARGETS.supplements}`} />
        <StatusRow
          label="Koude expositie"
          value={intermittent.today.coldExposure ? `${intermittent.today.coldDuration} min ` : 'Nog niet'}
          done={intermittent.today.coldExposure}
        />
        <StatusRow
          label="Meditatie"
          value={intermittent.today.meditation ? `${intermittent.today.meditationDuration} min ` : 'Nog niet'}
          done={intermittent.today.meditation}
        />
        <StatusRow
          label="Slaap (gister)"
          value={lastProgress ? `${lastProgress.sleepQuality}/10` : '—'}
        />
        <StatusRow
          label="Gewicht (laatst)"
          value={lastProgress ? `${lastProgress.weight} kg` : '—'}
        />
      </FitCard>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-[#EDE8E0] bg-white p-3 shadow-sm transition hover:shadow-md"
          >
            <Icon className="h-5 w-5 text-[#1B4332]" />
            <span className="text-[11px] font-medium text-[#2D3436]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function typeLabel(w) {
  const map = { strength: 'Kracht', plyo: 'Plyometrie', tennis: 'Tennis', cardio: 'Cardio', kot: 'KOT' };
  const dayMap = { dag1: 'D1', dag2: 'D2', dag3: 'D3' };
  return `${map[w.type] || w.type}${w.day ? ' ' + dayMap[w.day] : ''}`;
}
