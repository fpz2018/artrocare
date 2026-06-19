// Page 3 — Voeding. 16:8 fasting timer, macros, water and meal log.
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Droplet, Timer, Lightbulb } from 'lucide-react';
import { FitCard, SectionHeading, ProgressBar, PrimaryButton, GoldButton, Field } from '../components/ui';
import { TARGETS } from '../lib/data';
import { hoursSince } from '../lib/date';

function MacroCard({ label, value, max, unit }) {
  return (
    <FitCard className="p-3">
      <div className="text-[12px] font-medium text-[#8B7E6A]">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-[#D4A574]">
        {value}<span className="text-sm text-[#8B7E6A]">/{max}{unit}</span>
      </div>
      <ProgressBar value={value} max={max} className="mt-2" />
    </FitCard>
  );
}

const empty = { name: '', calories: '', protein: '', fat: '', carbs: '' };

export default function Nutrition({ today, totals, addMeal, deleteMeal, addWater, startFasting, stopFasting }) {
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  // Re-render every minute so the fasting counter stays live.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const fastingHours = today.fastingActive ? hoursSince(today.fastingStart) : 0;

  const submitMeal = () => {
    if (!form.name.trim()) return;
    addMeal({
      name: form.name.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      fat: Number(form.fat) || 0,
      carbs: Number(form.carbs) || 0,
    });
    setForm(empty);
    setOpen(false);
  };

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Voeding</h1>
        <p className="text-sm text-[#8B7E6A]">16:8 fasting, macro's en water</p>
      </header>

      {/* Fasting timer */}
      <FitCard className="bg-gradient-to-br from-[#1B4332] to-[#143126] text-white">
        <div className="flex items-center gap-2 text-[#D4A574]">
          <Timer className="h-5 w-5" />
          <span className="text-sm font-medium">16:8 Intermittent Fasting</span>
        </div>
        <div className="mt-2 text-3xl font-bold">
          {today.fastingActive ? `${Math.floor(fastingHours)}u ${Math.round((fastingHours % 1) * 60)}m gevast` : 'Niet aan het vasten'}
        </div>
        <p className="mt-1 text-xs text-white/70">Doel: {TARGETS.fastingHours} uur · Eetvenster: 12:00–20:00</p>
        {today.fastingActive ? (
          <GoldButton className="mt-3 w-full" onClick={stopFasting}>Vasten Stoppen</GoldButton>
        ) : (
          <button
            type="button" onClick={startFasting}
            className="mt-3 w-full rounded-md bg-[#D4A574] px-4 py-2.5 text-sm font-semibold text-[#1B4332]"
          >
            Vasten Starten
          </button>
        )}
      </FitCard>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MacroCard label="Calorieën" value={totals.calories} max={TARGETS.calories} unit="" />
        <MacroCard label="Proteïne" value={totals.protein} max={TARGETS.protein} unit="g" />
        <MacroCard label="Vetten" value={totals.fat} max={TARGETS.fat} unit="g" />
        <MacroCard label="Koolhydraten" value={totals.carbs} max={TARGETS.carbs} unit="g" />
      </div>

      {/* Water */}
      <FitCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-[#D4A574]" />
            <span className="font-semibold text-[#1B4332]">Water</span>
          </div>
          <span className="text-sm font-medium text-[#2D3436]">{today.water}ml / {TARGETS.water}ml</span>
        </div>
        <ProgressBar value={today.water} max={TARGETS.water} className="mt-2" />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => addWater(250)} className="flex-1 rounded-md border border-[#EDE8E0] py-2 text-sm font-medium text-[#1B4332] hover:bg-[#EDE8E0]">+250ml</button>
          <button type="button" onClick={() => addWater(500)} className="flex-1 rounded-md border border-[#EDE8E0] py-2 text-sm font-medium text-[#1B4332] hover:bg-[#EDE8E0]">+500ml</button>
        </div>
      </FitCard>

      {/* Meals */}
      <FitCard>
        <div className="flex items-center justify-between">
          <SectionHeading className="mb-0">Maaltijden</SectionHeading>
          {!open && (
            <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm font-medium text-[#1B4332]">
              <Plus className="h-4 w-4" /> Toevoegen
            </button>
          )}
        </div>

        {open && (
          <div className="mt-3 space-y-2">
            <Field label="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="bijv. Kwark met noten" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kcal" type="number" inputMode="numeric" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              <Field label="Proteïne (g)" type="number" inputMode="numeric" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
              <Field label="Vet (g)" type="number" inputMode="numeric" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
              <Field label="Koolhydraten (g)" type="number" inputMode="numeric" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <PrimaryButton className="flex-1" onClick={submitMeal}>Opslaan</PrimaryButton>
              <button type="button" onClick={() => { setOpen(false); setForm(empty); }} className="rounded-md border border-[#EDE8E0] px-4 text-sm font-medium text-[#8B7E6A]">Annuleren</button>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {today.meals.length === 0 ? (
            <p className="text-sm text-[#8B7E6A]">Nog geen maaltijden vandaag.</p>
          ) : today.meals.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border border-[#EDE8E0] p-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[#2D3436]">{m.name}</div>
                <div className="text-[11px] text-[#8B7E6A]">{m.calories} kcal · {m.protein}g P · {m.fat}g V · {m.carbs}g K</div>
              </div>
              <button type="button" onClick={() => deleteMeal(m.id)} className="rounded-md p-2 text-[#8B7E6A] hover:bg-[#EDE8E0] hover:text-red-600" aria-label="Verwijder maaltijd">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </FitCard>

      {/* Tips */}
      <FitCard className="bg-[#EDE8E0]">
        <div className="flex items-center gap-2 text-[#1B4332]">
          <Lightbulb className="h-5 w-5" />
          <span className="font-semibold">Voedingstips</span>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2D3436]">
          <li>Minimaal 30g proteïne per maaltijd voor spierbehoud.</li>
          <li>Eet eiwit eerst, dan groente, dan koolhydraten.</li>
          <li>Drink een glas water vóór elke maaltijd.</li>
          <li>Houd het eetvenster strak: 12:00–20:00.</li>
        </ul>
      </FitCard>
    </div>
  );
}
