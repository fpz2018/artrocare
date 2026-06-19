// Page 5 — Progressie. Body metrics, weight chart and history.
import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { FitCard, SectionHeading, PrimaryButton, Field } from '../components/ui';
import { todayISO, formatShort } from '../lib/date';

const empty = { weight: '', waist: '', bodyFat: '', hrv: '', sleepQuality: '', energyLevel: '' };

function StatCard({ label, value, unit, diff, lowerIsBetter }) {
  // diff: positive means value went up vs the previous entry.
  let color = 'text-[#8B7E6A]';
  let Icon = Minus;
  if (diff > 0) { Icon = ArrowUp; color = lowerIsBetter ? 'text-red-600' : 'text-green-600'; }
  else if (diff < 0) { Icon = ArrowDown; color = lowerIsBetter ? 'text-green-600' : 'text-red-600'; }
  return (
    <FitCard className="p-3">
      <div className="text-[12px] font-medium text-[#8B7E6A]">{label}</div>
      <div className="mt-0.5 text-2xl font-bold text-[#1B4332]">{value ?? '—'}<span className="text-sm text-[#8B7E6A]">{value != null ? unit : ''}</span></div>
      {diff != null && value != null && (
        <div className={`mt-0.5 flex items-center gap-0.5 text-[11px] ${color}`}>
          <Icon className="h-3 w-3" />{Math.abs(diff).toFixed(1)}{unit}
        </div>
      )}
    </FitCard>
  );
}

// Lightweight SVG line chart for weight (last 20 entries).
function WeightChart({ entries }) {
  const data = entries.slice(-20).map((e) => ({ date: e.date, weight: e.weight }));
  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-[#8B7E6A]">Log minstens 2 metingen voor een grafiek.</p>;
  }
  const W = 320, H = 160, pad = 28;
  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (w) => H - pad - ((w - min) / (max - min || 1)) * (H - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.weight).toFixed(1)}`).join(' ');
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => pad + f * (H - pad * 2));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {gridYs.map((gy, i) => (
        <line key={i} x1={pad} y1={gy} x2={W - pad} y2={gy} stroke="#EDE8E0" strokeWidth="1" />
      ))}
      {[max, min].map((v, i) => (
        <text key={i} x={4} y={i === 0 ? pad + 4 : H - pad + 4} fontSize="9" fill="#8B7E6A">{v.toFixed(0)}</text>
      ))}
      <path d={path} fill="none" stroke="#1B4332" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.weight)} r="3.5" fill="#D4A574" stroke="#1B4332" strokeWidth="1" />
          {(i === 0 || i === data.length - 1) && (
            <text x={x(i)} y={H - 8} fontSize="8" fill="#8B7E6A" textAnchor="middle">{formatShort(d.date)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Progress({ entries, addEntry, deleteEntry }) {
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  const sorted = entries; // already sorted asc by the hook
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const diff = (field) => (last && prev ? last[field] - prev[field] : null);

  const submit = () => {
    if (form.weight === '') return;
    addEntry({
      date: todayISO(),
      weight: Number(form.weight),
      waist: Number(form.waist) || 0,
      bodyFat: form.bodyFat === '' ? undefined : Number(form.bodyFat),
      hrv: Number(form.hrv) || 0,
      sleepQuality: Number(form.sleepQuality) || 0,
      energyLevel: Number(form.energyLevel) || 0,
    });
    setForm(empty);
    setOpen(false);
  };

  const history = [...sorted].reverse().slice(0, 14);

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Progressie</h1>
        <p className="text-sm text-[#8B7E6A]">Lichaamsmaten en trends</p>
      </header>

      {!open && (
        <PrimaryButton className="w-full py-3" onClick={() => setOpen(true)}>
          <Plus className="h-5 w-5" /> Vandaag Loggen
        </PrimaryButton>
      )}

      {open && (
        <FitCard className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Field label="Gewicht (kg)" type="number" inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <Field label="Taille (cm)" type="number" inputMode="decimal" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
            <Field label="Vet % (optioneel)" type="number" inputMode="decimal" value={form.bodyFat} onChange={(e) => setForm({ ...form, bodyFat: e.target.value })} />
            <Field label="HRV" type="number" inputMode="numeric" value={form.hrv} onChange={(e) => setForm({ ...form, hrv: e.target.value })} />
            <Field label="Slaap (1-10)" type="number" inputMode="numeric" value={form.sleepQuality} onChange={(e) => setForm({ ...form, sleepQuality: e.target.value })} />
            <Field label="Energie (1-10)" type="number" inputMode="numeric" value={form.energyLevel} onChange={(e) => setForm({ ...form, energyLevel: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <PrimaryButton className="flex-1" onClick={submit}>Opslaan</PrimaryButton>
            <button type="button" onClick={() => { setOpen(false); setForm(empty); }} className="rounded-md border border-[#EDE8E0] px-4 text-sm font-medium text-[#8B7E6A]">Annuleren</button>
          </div>
        </FitCard>
      )}

      {/* Latest stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Gewicht" value={last?.weight} unit="kg" diff={diff('weight')} lowerIsBetter />
        <StatCard label="Taille" value={last?.waist} unit="cm" diff={diff('waist')} lowerIsBetter />
        <StatCard label="HRV" value={last?.hrv} unit="" diff={diff('hrv')} />
      </div>

      {/* Chart */}
      <FitCard>
        <SectionHeading>Gewichtsgrafiek</SectionHeading>
        <WeightChart entries={sorted} />
      </FitCard>

      {/* History table */}
      <FitCard>
        <SectionHeading>Geschiedenis</SectionHeading>
        {history.length === 0 ? (
          <p className="text-sm text-[#8B7E6A]">Nog geen metingen gelogd.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#EDE8E0] text-left text-[12px] text-[#8B7E6A]">
                  <th className="rounded-l-md p-2 font-medium">Datum</th>
                  <th className="p-2 font-medium">Gew.</th>
                  <th className="p-2 font-medium">Taille</th>
                  <th className="p-2 font-medium">HRV</th>
                  <th className="p-2 font-medium">Slaap</th>
                  <th className="p-2 font-medium">Energie</th>
                  <th className="rounded-r-md p-2" />
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={e.id} className="border-b border-[#EDE8E0] last:border-0">
                    <td className="p-2 text-[#2D3436]">{formatShort(e.date)}</td>
                    <td className="p-2 text-[#2D3436]">{e.weight}</td>
                    <td className="p-2 text-[#2D3436]">{e.waist}</td>
                    <td className="p-2 text-[#2D3436]">{e.hrv}</td>
                    <td className="p-2 text-[#2D3436]">{e.sleepQuality}</td>
                    <td className="p-2 text-[#2D3436]">{e.energyLevel}</td>
                    <td className="p-2">
                      <button type="button" onClick={() => deleteEntry(e.id)} className="text-[#8B7E6A] hover:text-red-600" aria-label="Verwijder meting">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FitCard>
    </div>
  );
}
