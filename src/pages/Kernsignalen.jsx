import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Activity, Apple, Moon, Sparkles, Loader2, Flame,
} from 'lucide-react';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  DOELEN, DREMPELS, VOED_JANEE, HERSTEL_VRAGEN,
  legeDag, normaliseer, beweegTotaal, voedScore, herstelScore,
  signalen, aantalBehaald, berekenStreak,
  isoVandaag, verschuifDag, leesbareDatum,
} from '@/lib/kernsignalen';

// ─── Kleuren (uit het prototype) ──────────────────────────────────────────────
const KLEUR = {
  beweeg: '#35ACE4',
  voed: '#EF7204',
  herstel: '#7fd6c2',
  ai: '#f0c419',
};

// Labels voor de ja/nee-items en slaapvragen.
const VOED_LABELS = {
  volkoren: 'Volkoren granen',
  noten_peulvruchten: 'Noten of peulvruchten',
  omega3: 'Omega-3 (vette vis / lijnzaad)',
  geen_suikerdrank: 'Geen suikerhoudende drank',
  geen_bewerkt_vlees: 'Geen bewerkt vlees',
};
const HERSTEL_LABELS = {
  slaap_duur: '7,5–9 uur echte slaap',
  ochtendlicht: 'Ochtendlicht binnen 30 min',
  vaste_waaktijd: 'Vaste waaktijd aangehouden',
  laatste_hap: 'Laatste hap ≥3 u voor bed',
  geen_alcohol: 'Geen alcohol vlak voor bed',
};

// ─── Kleine UI-bouwstenen ──────────────────────────────────────────────────────

function Stepper({ value, onChange, min = 0, max = 99, step = 1, accent, suffix }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        className="w-9 h-9 shrink-0 rounded-full bg-white/10 text-white text-xl leading-none disabled:opacity-30 active:scale-95 transition"
        aria-label="Minder"
      >
        −
      </button>
      <div className="min-w-[3.5rem] text-center">
        <span className="text-2xl font-semibold text-white tabular-nums">{value}</span>
        {suffix && <span className="text-white/50 text-sm ml-1">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        className="w-9 h-9 shrink-0 rounded-full text-[#10201f] text-xl leading-none disabled:opacity-30 active:scale-95 transition"
        style={{ backgroundColor: accent }}
        aria-label="Meer"
      >
        +
      </button>
    </div>
  );
}

function Toggle({ label, checked, onChange, accent }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full gap-3 rounded-xl px-4 py-3 text-left transition border"
      style={{
        backgroundColor: checked ? `${accent}22` : 'rgba(255,255,255,0.04)',
        borderColor: checked ? accent : 'rgba(255,255,255,0.08)',
      }}
    >
      <span className="text-sm text-white/90">{label}</span>
      <span
        className="w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-[#10201f] text-sm font-bold transition"
        style={{
          backgroundColor: checked ? accent : 'transparent',
          borderColor: checked ? accent : 'rgba(255,255,255,0.25)',
        }}
      >
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}

function SignalDot({ hit, color, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-10 h-10 rounded-full border-2 transition-all duration-300"
        style={{
          backgroundColor: hit ? color : 'transparent',
          borderColor: hit ? color : 'rgba(255,255,255,0.2)',
          boxShadow: hit ? `0 0 16px ${color}66` : 'none',
        }}
      />
      <span className="text-[11px] text-white/60">{label}</span>
    </div>
  );
}

function SignalCard({ icon: Icon, title, subtitle, accent, scoreLabel, hit, children }) {
  return (
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-semibold leading-tight">{title}</h2>
          <p className="text-white/45 text-xs">{subtitle}</p>
        </div>
        <span
          className="text-sm font-semibold px-2.5 py-1 rounded-lg tabular-nums"
          style={{
            backgroundColor: hit ? `${accent}22` : 'rgba(255,255,255,0.05)',
            color: hit ? accent : 'rgba(255,255,255,0.6)',
          }}
        >
          {scoreLabel}
        </span>
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

export default function Kernsignalen() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(isoVandaag());
  const [draft, setDraft] = useState(legeDag());
  const dirtyRef = useRef(false); // pas autosaven na een gebruikersedit

  // Alle entries van de laatste ~90 dagen (voor dag-data + streak).
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['kernsignalen', userId],
    enabled: !!userId,
    queryFn: async () => {
      const vanaf = verschuifDag(isoVandaag(), -90);
      const { data, error } = await supabase
        .from('daily_entries')
        .select('date, beweeg, voed, herstel, ai_analysis, ai_analysis_generated_at')
        .gte('date', vanaf)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const entriesByDate = useMemo(() => {
    const map = {};
    for (const e of entries) map[e.date] = e;
    return map;
  }, [entries]);

  const currentEntry = entriesByDate[selectedDate];
  const streak = useMemo(() => berekenStreak(entriesByDate), [entriesByDate]);

  // Laad de dag in de draft wanneer de datum wijzigt of data binnenkomt.
  useEffect(() => {
    dirtyRef.current = false;
    setDraft(normaliseer(currentEntry));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentEntry?.date, entries.length]);

  // ── Opslaan (upsert; ai_analysis blijft ongemoeid) ───────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('daily_entries')
        .upsert(
          { user_id: userId, date: selectedDate, ...payload },
          { onConflict: 'user_id,date' },
        );
      if (error) throw error;
    },
    onError: (err) => toast.error(`Opslaan mislukt: ${err.message}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kernsignalen', userId] }),
  });

  // Debounced autosave na elke edit.
  useEffect(() => {
    if (!dirtyRef.current || !userId) return;
    const id = setTimeout(() => saveMutation.mutate(draft), 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, userId]);

  // Directe (awaitbare) save — gebruikt vóór de AI-analyse.
  const saveNow = async () => {
    if (!userId) return;
    await saveMutation.mutateAsync(draft);
  };

  // ── AI-analyse ───────────────────────────────────────────────────────────────
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      await saveNow(); // zorg dat de dag in de DB staat
      const { data, error } = await supabase.functions.invoke('analyze-day', {
        body: { date: selectedDate },
      });
      if (error) {
        // Edge Function-fouten dragen vaak een JSON-body met { error }.
        let msg = error.message;
        try {
          const ctx = await error.context?.json();
          if (ctx?.error) msg = ctx.error;
        } catch {
          /* geen JSON-body */
        }
        throw new Error(msg);
      }
      return data.analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kernsignalen', userId] });
      toast.success('Analyse klaar');
    },
    onError: (err) => toast.error(`Analyse mislukt: ${err.message}`),
  });

  // ── Draft-mutatoren ──────────────────────────────────────────────────────────
  const edit = (updater) => {
    dirtyRef.current = true;
    setDraft((d) => updater({ ...d, beweeg: { ...d.beweeg }, voed: { ...d.voed }, herstel: { ...d.herstel } }));
  };
  const setBeweeg = (key, val) => edit((d) => ((d.beweeg[key] = val), d));
  const setVoed = (key, val) => edit((d) => ((d.voed[key] = val), d));
  const setHerstel = (key, val) => edit((d) => ((d.herstel[key] = val), d));

  // ── Afgeleide waarden ────────────────────────────────────────────────────────
  const bTotaal = beweegTotaal(draft.beweeg);
  const vScore = voedScore(draft.voed);
  const hScore = herstelScore(draft.herstel);
  const sig = signalen(draft);
  const behaald = aantalBehaald(draft);
  const isVandaag = selectedDate === isoVandaag();
  const analysis = currentEntry?.ai_analysis;

  return (
    <div className="min-h-[calc(100vh-8rem)] -mx-4 lg:-mx-8 -my-4 lg:-my-8 p-4 lg:p-8"
      style={{ background: 'linear-gradient(160deg, #10201f 0%, #16302e 100%)' }}
    >
      <div className="max-w-md mx-auto space-y-5">
        {/* Titel + streak */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kernsignalen</h1>
            <p className="text-white/50 text-sm">Drie signalen, elke dag.</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: `${KLEUR.ai}1f`, color: KLEUR.ai }}
            title="Aaneengesloten dagen met 3/3 signalen"
          >
            <Flame className="w-4 h-4" />
            {streak}
          </div>
        </div>

        {/* Datum-navigatie */}
        <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/10 px-2 py-2">
          <button
            type="button"
            onClick={() => setSelectedDate((d) => verschuifDag(d, -1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 active:scale-95 transition"
            aria-label="Vorige dag"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-white font-medium">{leesbareDatum(selectedDate)}</div>
            <div className="text-white/40 text-xs tabular-nums">{selectedDate}</div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate((d) => verschuifDag(d, 1))}
            disabled={isVandaag}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 active:scale-95 transition disabled:opacity-25"
            aria-label="Volgende dag"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Signaal-dots */}
        <div className="flex items-center justify-center gap-8 py-2">
          <SignalDot hit={sig.beweeg} color={KLEUR.beweeg} label="Beweeg" />
          <SignalDot hit={sig.voed} color={KLEUR.voed} label="Voed" />
          <SignalDot hit={sig.herstel} color={KLEUR.herstel} label="Herstel" />
        </div>
        <p className="text-center text-white/50 text-sm -mt-2">
          {behaald}/3 signalen behaald{behaald === 3 ? ' — top!' : ''}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : (
          <>
            {/* BEWEEG */}
            <SignalCard
              icon={Activity}
              title="Beweeg"
              subtitle={`Ademloze minuten — doel ${DOELEN.beweeg.totaal}`}
              accent={KLEUR.beweeg}
              hit={sig.beweeg}
              scoreLabel={`${bTotaal} min`}
            >
              {[
                ['ochtend', 'Ochtend', DOELEN.beweeg.ochtend],
                ['middag', 'Middag', DOELEN.beweeg.middag],
                ['avond', 'Avond', DOELEN.beweeg.avond],
              ].map(([key, label, doel]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-white/80">
                    {label} <span className="text-white/35">· doel {doel}</span>
                  </span>
                  <Stepper
                    value={draft.beweeg[key]}
                    onChange={(v) => setBeweeg(key, v)}
                    max={60}
                    accent={KLEUR.beweeg}
                    suffix="min"
                  />
                </div>
              ))}
            </SignalCard>

            {/* VOED */}
            <SignalCard
              icon={Apple}
              title="Voed"
              subtitle="Groente, fruit & gezonde keuzes"
              accent={KLEUR.voed}
              hit={sig.voed}
              scoreLabel={`${vScore}/${DOELEN.voed.score}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">
                  Groente <span className="text-white/35">· doel {DOELEN.voed.groente}</span>
                </span>
                <Stepper value={draft.voed.groente} onChange={(v) => setVoed('groente', v)} max={15} accent={KLEUR.voed} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">
                  Fruit <span className="text-white/35">· doel {DOELEN.voed.fruit}</span>
                </span>
                <Stepper value={draft.voed.fruit} onChange={(v) => setVoed('fruit', v)} max={15} accent={KLEUR.voed} />
              </div>
              <div className="space-y-2 pt-1">
                {VOED_JANEE.map((key) => (
                  <Toggle
                    key={key}
                    label={VOED_LABELS[key]}
                    checked={!!draft.voed[key]}
                    onChange={(v) => setVoed(key, v)}
                    accent={KLEUR.voed}
                  />
                ))}
              </div>
            </SignalCard>

            {/* HERSTEL */}
            <SignalCard
              icon={Moon}
              title="Herstel"
              subtitle="Slaap & ritme"
              accent={KLEUR.herstel}
              hit={sig.herstel}
              scoreLabel={`${hScore}/${DOELEN.herstel.score}`}
            >
              <div className="space-y-2">
                {HERSTEL_VRAGEN.map((key) => (
                  <Toggle
                    key={key}
                    label={HERSTEL_LABELS[key]}
                    checked={!!draft.herstel[key]}
                    onChange={(v) => setHerstel(key, v)}
                    accent={KLEUR.herstel}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-white/80">Uren geslapen</span>
                <Stepper
                  value={draft.herstel.uren}
                  onChange={(v) => setHerstel('uren', v)}
                  max={14}
                  step={0.5}
                  accent={KLEUR.herstel}
                  suffix="u"
                />
              </div>
            </SignalCard>

            {/* AI-ANALYSE */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${KLEUR.ai}22`, color: KLEUR.ai }}
                >
                  <Sparkles className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <h2 className="text-white font-semibold leading-tight">AI-analyse</h2>
                  <p className="text-white/45 text-xs">Kort advies voor morgen</p>
                </div>
              </div>

              {analysis && (
                <div
                  className="rounded-xl p-3 text-sm leading-relaxed text-white/90 whitespace-pre-line"
                  style={{ backgroundColor: `${KLEUR.ai}12`, border: `1px solid ${KLEUR.ai}33` }}
                >
                  {analysis}
                  {currentEntry?.ai_analysis_generated_at && (
                    <div className="text-white/35 text-[11px] mt-2">
                      {new Date(currentEntry.ai_analysis_generated_at).toLocaleString('nl-NL')}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-[#10201f] active:scale-[0.99] transition disabled:opacity-60"
                style={{ backgroundColor: KLEUR.ai }}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Bezig…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> {analysis ? 'Opnieuw analyseren' : 'AI-analyse maken'}
                  </>
                )}
              </button>
            </section>

            <p className="text-center text-white/30 text-xs pb-2">
              Wijzigingen worden automatisch opgeslagen.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
