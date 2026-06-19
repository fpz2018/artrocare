// Page 2 — Training. Log workouts from pre-loaded templates.
import React, { useState } from 'react';
import { Plus, Trash2, Check, Clock } from 'lucide-react';
import { FitCard, SectionHeading, PrimaryButton, RoundCheck, Field } from '../components/ui';
import {
  WORKOUT_TYPES, STRENGTH_DAYS, PLYO_PHASES, KOT_EXERCISES,
} from '../lib/data';
import { todayISO, formatShort } from '../lib/date';
import { cn } from '@/lib/utils';

const TYPE_LABEL = { strength: 'Kracht', plyo: 'Plyometrie', tennis: 'Tennis', cardio: 'Cardio', kot: 'KOT' };

// Build the exercise list for the current type/day/phase selection.
function buildExercises(type, day, phase) {
  if (type === 'strength') {
    return STRENGTH_DAYS[day].exercises.map((e) => ({ ...e }));
  }
  if (type === 'plyo') {
    return PLYO_PHASES[phase].exercises.map((name) => ({
      name, target: '3x5-8', sets: 3, reps: 5, completed: false,
    }));
  }
  if (type === 'kot') {
    return KOT_EXERCISES.map((e) => ({ ...e }));
  }
  // tennis / cardio — single checkbox session
  return [{ name: type === 'tennis' ? 'Tennis / Padel sessie' : 'Cardio sessie', target: '', sets: 0, reps: 0, completed: false }];
}

export default function Training({ workouts, addWorkout, deleteWorkout }) {
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('strength');
  const [day, setDay] = useState('dag1');
  const [phase, setPhase] = useState('fase1');
  const [exercises, setExercises] = useState(() => buildExercises('strength', 'dag1', 'fase1'));
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const todayWorkout = workouts.find((w) => w.date === today);
  const recent = workouts.slice(0, 14);

  const reload = (t, d, p) => setExercises(buildExercises(t, d, p));

  const chooseType = (t) => { setType(t); reload(t, day, phase); };
  const chooseDay = (d) => { setDay(d); reload('strength', d, phase); };
  const choosePhase = (p) => { setPhase(p); reload('plyo', day, p); };

  const toggleExercise = (i) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, completed: !e.completed } : e)));
  };
  const setExField = (i, field, val) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val === '' ? '' : Number(val) } : e)));
  };

  const save = () => {
    addWorkout({
      date: today,
      type,
      day: type === 'strength' ? day : undefined,
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: Number(e.sets) || 0,
        reps: Number(e.reps) || 0,
        weight: e.weight === undefined || e.weight === '' ? undefined : Number(e.weight),
        completed: !!e.completed,
      })),
      notes,
      duration: Number(duration) || 0,
    });
    // reset form
    setOpen(false);
    setNotes('');
    setDuration('');
    reload(type, day, phase);
  };

  const isStrength = type === 'strength';
  const isSimple = type === 'tennis' || type === 'cardio';

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Training</h1>
        <p className="text-sm text-[#8B7E6A]">Log je training met kant-en-klare templates</p>
      </header>

      {/* Status today */}
      <FitCard>
        {todayWorkout ? (
          <div>
            <div className="flex items-center gap-2 text-[#1B4332]">
              <Check className="h-5 w-5" />
              <span className="font-bold">{TYPE_LABEL[todayWorkout.type]}{todayWorkout.day ? ` ${todayWorkout.day.replace('dag', 'D')}` : ''} voltooid</span>
            </div>
            <p className="mt-1 text-sm text-[#8B7E6A]">
              {todayWorkout.duration} min · {todayWorkout.exercises.filter((e) => e.completed).length}/{todayWorkout.exercises.length} oefeningen voltooid
            </p>
          </div>
        ) : !open ? (
          <PrimaryButton className="w-full py-3 text-base" onClick={() => setOpen(true)}>
            <Plus className="h-5 w-5" /> Training Toevoegen
          </PrimaryButton>
        ) : null}
      </FitCard>

      {/* Form */}
      {open && (
        <FitCard className="space-y-4">
          {/* Type selector */}
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-[#8B7E6A]">Type</span>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseType(t.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    type === t.id
                      ? 'border-[#1B4332] bg-[#1B4332] text-white'
                      : 'border-[#EDE8E0] bg-white text-[#8B7E6A]',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strength day selector */}
          {isStrength && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(STRENGTH_DAYS).map(([id, d]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseDay(id)}
                  className={cn(
                    'flex-1 rounded-md border px-2 py-2 text-xs font-medium transition',
                    day === id ? 'border-[#D4A574] bg-[#D4A574] text-[#1B4332]' : 'border-[#EDE8E0] bg-white text-[#8B7E6A]',
                  )}
                >
                  {d.label.split(' — ')[0]}<br />
                  <span className="text-[10px] opacity-80">{d.short}</span>
                </button>
              ))}
            </div>
          )}

          {/* Plyo phase selector */}
          {type === 'plyo' && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLYO_PHASES).map(([id, p]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => choosePhase(id)}
                  className={cn(
                    'flex-1 rounded-md border px-2 py-2 text-[11px] font-medium transition',
                    phase === id ? 'border-[#D4A574] bg-[#D4A574] text-[#1B4332]' : 'border-[#EDE8E0] bg-white text-[#8B7E6A]',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Exercises */}
          {!isSimple && (
            <div className="space-y-2">
              {exercises.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border border-[#EDE8E0] p-2">
                  <RoundCheck checked={e.completed} onClick={() => toggleExercise(i)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[#2D3436]">{e.name}</div>
                    {e.target && <div className="text-[11px] text-[#8B7E6A]">{e.target}</div>}
                  </div>
                  <input
                    type="number" inputMode="numeric" placeholder="sets" value={e.sets}
                    onChange={(ev) => setExField(i, 'sets', ev.target.value)}
                    className="w-14 rounded border border-[#EDE8E0] px-1.5 py-1 text-center text-sm"
                  />
                  <input
                    type="number" inputMode="numeric" placeholder="reps" value={e.reps}
                    onChange={(ev) => setExField(i, 'reps', ev.target.value)}
                    className="w-14 rounded border border-[#EDE8E0] px-1.5 py-1 text-center text-sm"
                  />
                  {isStrength && e.weight !== undefined && (
                    <input
                      type="number" inputMode="numeric" placeholder="kg" value={e.weight}
                      onChange={(ev) => setExField(i, 'weight', ev.target.value)}
                      className="w-16 rounded border border-[#EDE8E0] px-1.5 py-1 text-center text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Simple tennis/cardio */}
          {isSimple && (
            <div className="flex items-center gap-2 rounded-md border border-[#EDE8E0] p-2">
              <RoundCheck checked={exercises[0].completed} onClick={() => toggleExercise(0)} />
              <span className="text-sm font-medium text-[#2D3436]">{exercises[0].name} voltooid</span>
            </div>
          )}

          <Field
            label="Duur (minuten)" type="number" inputMode="numeric" value={duration}
            onChange={(e) => setDuration(e.target.value)} placeholder="bijv. 45"
          />
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#8B7E6A]">Notities</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-md border border-[#EDE8E0] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#D4A574] focus:ring-1 focus:ring-[#D4A574]"
              placeholder="Hoe ging het?"
            />
          </label>

          <div className="flex gap-2">
            <PrimaryButton className="flex-1" onClick={save}>Opslaan</PrimaryButton>
            <button
              type="button" onClick={() => setOpen(false)}
              className="rounded-md border border-[#EDE8E0] px-4 text-sm font-medium text-[#8B7E6A]"
            >
              Annuleren
            </button>
          </div>
        </FitCard>
      )}

      {/* Recent workouts */}
      <div>
        <SectionHeading>Recente trainingen</SectionHeading>
        {recent.length === 0 ? (
          <FitCard><p className="text-sm text-[#8B7E6A]">Nog geen trainingen gelogd.</p></FitCard>
        ) : (
          <div className="space-y-2">
            {recent.map((w) => (
              <FitCard key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-[#1B4332]">
                    {TYPE_LABEL[w.type]}{w.day ? ` ${w.day.replace('dag', 'D')}` : ''}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8B7E6A]">
                    <span>{formatShort(w.date)}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{w.duration} min</span>
                    <span>{w.exercises.filter((e) => e.completed).length}/{w.exercises.length} oef.</span>
                  </div>
                </div>
                <button
                  type="button" onClick={() => deleteWorkout(w.id)}
                  className="rounded-md p-2 text-[#8B7E6A] hover:bg-[#EDE8E0] hover:text-red-600"
                  aria-label="Verwijder training"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </FitCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
