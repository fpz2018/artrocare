// Page 7 — Cheat Sheet. All protocols on one scannable reference page.
import React from 'react';
import { FitCard } from '../components/ui';
import { STRENGTH_DAYS, PLYO_PHASES, KOT_EXERCISES, SUPPLEMENTS, WEEK_PLAN } from '../lib/data';

function Box({ title, children, accent }) {
  return (
    <FitCard className={accent ? 'border-[#D4A574] bg-[#D4A574]/10' : ''}>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#1B4332]">{title}</h3>
      {children}
    </FitCard>
  );
}

function DayBlock({ day }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[#1B4332]">{day.label}</div>
      <ul className="mt-1 space-y-0.5 text-[13px] text-[#2D3436]">
        {day.exercises.map((e) => (
          <li key={e.name} className="flex justify-between gap-2">
            <span>{e.name}</span>
            <span className="shrink-0 text-[#8B7E6A]">{e.target}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CheatSheet() {
  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B4332]">Cheat Sheet</h1>
        <p className="text-sm text-[#8B7E6A]">Alle protocollen op één pagina</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Column 1 — strength */}
        <div className="space-y-4">
          <Box title="Krachtschema">
            <div className="space-y-3">
              <DayBlock day={STRENGTH_DAYS.dag1} />
              <DayBlock day={STRENGTH_DAYS.dag2} />
              <DayBlock day={STRENGTH_DAYS.dag3} />
            </div>
          </Box>
          <Box title="Golden Rules" accent>
            <ul className="list-disc space-y-1 pl-4 text-[13px] text-[#2D3436]">
              <li>Rust 60-90 sec tussen sets</li>
              <li>Train tot (bijna) falen</li>
              <li>45-60 min max per sessie</li>
            </ul>
          </Box>
        </div>

        {/* Column 2 — plyo, calendar, supps */}
        <div className="space-y-4">
          <Box title="Plyometrie">
            <ul className="space-y-1 text-[13px] text-[#2D3436]">
              {Object.values(PLYO_PHASES).map((p) => (
                <li key={p.label}><span className="font-medium text-[#1B4332]">{p.label}:</span> {p.exercises.join(', ')}</li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-[#8B7E6A]">Veiligheid: zachte ondergrond, goede landing, stop bij pijn.</p>
            <div className="mt-2 text-[13px]">
              <span className="font-medium text-[#1B4332]">KOT (dagelijks):</span> {KOT_EXERCISES.map((e) => e.name).join(', ')}
            </div>
          </Box>

          <Box title="Weekkalender">
            <ul className="space-y-0.5 text-[13px] text-[#2D3436]">
              {WEEK_PLAN.map((w) => (
                <li key={w.day} className="flex justify-between gap-2">
                  <span className="font-medium text-[#1B4332]">{w.day}</span>
                  <span className="text-right text-[#2D3436]">{w.activity}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-[#8B7E6A]">Geen tennis? Zone 2 cardio OF extra rustdag.</p>
          </Box>

          <Box title="Dagelijkse reminders">
            <ul className="list-disc space-y-0.5 pl-4 text-[13px] text-[#2D3436]">
              <li>16:8 fasting (12:00-20:00)</li>
              <li>2L water</li>
              <li>Supplementen innemen</li>
              <li>7-8u slaap</li>
              <li>Koude douche</li>
              <li>Sauna (2-4x/week)</li>
              <li>10-20 min meditatie</li>
            </ul>
          </Box>

          <Box title="Supplementen">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[#8B7E6A]">
                  <th className="pb-1 font-medium">Naam</th>
                  <th className="pb-1 font-medium">Dosis</th>
                  <th className="pb-1 font-medium">Wanneer</th>
                </tr>
              </thead>
              <tbody>
                {SUPPLEMENTS.map((s) => (
                  <tr key={s.name} className="border-t border-[#EDE8E0]">
                    <td className="py-1 pr-1 text-[#2D3436]">{s.name}</td>
                    <td className="py-1 pr-1 text-[#2D3436]">{s.dosage}</td>
                    <td className="py-1 text-[#8B7E6A]">{s.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </div>

        {/* Column 3 — overload, nutrition, important */}
        <div className="space-y-4">
          <Box title="Progressieve overbelasting">
            <ul className="space-y-1 text-[13px] text-[#2D3436]">
              <li><span className="font-medium text-[#1B4332]">Wk 1-2:</span> techniek + basis gewicht</li>
              <li><span className="font-medium text-[#1B4332]">Wk 3-4:</span> +2-5% gewicht of 1-2 reps</li>
              <li><span className="font-medium text-[#1B4332]">Wk 5+:</span> verder opbouwen, deload indien nodig</li>
              <li><span className="font-medium text-[#1B4332]">Maandelijks:</span> wissel oefeningen voor variatie</li>
            </ul>
          </Box>

          <Box title="Voeding quick ref">
            <ul className="space-y-1 text-[13px] text-[#2D3436]">
              <li><span className="font-medium text-[#1B4332]">Calorieën:</span> ~1900 kcal/dag</li>
              <li><span className="font-medium text-[#1B4332]">Proteïne:</span> ~200g (2g/kg)</li>
              <li><span className="font-medium text-[#1B4332]">Macro's:</span> 40% P / 30% V / 30% K</li>
              <li><span className="font-medium text-[#1B4332]">Fasting:</span> 16:8, eetvenster 12:00-20:00</li>
              <li><span className="font-medium text-[#1B4332]">Vezels:</span> 30g+ per dag</li>
              <li><span className="font-medium text-[#1B4332]">Water:</span> 2-3L per dag</li>
            </ul>
          </Box>

          <Box title="Belangrijk" accent>
            <ul className="list-disc space-y-1 pl-4 text-[13px] text-[#2D3436]">
              <li>Consistentie verslaat intensiteit.</li>
              <li>HRV laag? Neem een rustdag.</li>
              <li>Slaap = groei: spier herstelt 's nachts.</li>
              <li>Eiwit + krachttraining = spierbehoud op 61.</li>
              <li>Mobiliteit (KOT) voorkomt blessures.</li>
              <li>Geniet van het proces, niet alleen het doel.</li>
            </ul>
          </Box>
        </div>
      </div>
    </div>
  );
}
