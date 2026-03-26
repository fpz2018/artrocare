import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { FullDisclaimer } from '@/components/legal/Disclaimer';

// ─── HOOS-12 questionnaire items ─────────────────────────────────────────────
// Source: HOOS-12 validated Dutch version (Klässbo et al.)
const HOOS12_ITEMS = [
  { id: 'hoos_pain_walking',    domain: 'pain',     question: 'Pijn bij lopen op een vlakke ondergrond' },
  { id: 'hoos_pain_stairs',     domain: 'pain',     question: 'Pijn bij traplopen' },
  { id: 'hoos_pain_night',      domain: 'pain',     question: "Pijn in bed 's nachts" },
  { id: 'hoos_pain_rest',       domain: 'pain',     question: 'Pijn in rust' },
  { id: 'hoos_sym_morning',     domain: 'symptoms', question: 'Ochtendstijfheid na het wakker worden' },
  { id: 'hoos_sym_later',       domain: 'symptoms', question: 'Stijfheid na zitten, liggen of rusten overdag' },
  { id: 'hoos_adl_stairs',      domain: 'adl',      question: 'Traplopen' },
  { id: 'hoos_adl_stand',       domain: 'adl',      question: 'Opstaan vanuit een stoel' },
  { id: 'hoos_adl_bend',        domain: 'adl',      question: 'Bukken / oppakken van iets van de grond' },
  { id: 'hoos_adl_sock',        domain: 'adl',      question: 'Sokken aan- en uitdoen' },
  { id: 'hoos_qol_aware',       domain: 'qol',      question: 'Hoe vaak bent u zich bewust van uw heupproblemen?' },
  { id: 'hoos_qol_lifestyle',   domain: 'qol',      question: 'In hoeverre heeft u uw leefstijl aangepast om problemen met uw heup te voorkomen?' },
];

const HOOS_OPTIONS = [
  { value: 0, label: 'Nooit / Geen' },
  { value: 1, label: 'Zelden / Mild' },
  { value: 2, label: 'Soms / Matig' },
  { value: 3, label: 'Vaak / Ernstig' },
  { value: 4, label: 'Altijd / Extreem' },
];

// ─── Risk score helpers ───────────────────────────────────────────────────────
// HOOS score: sum of 12 items (0-48), invert → high score = better function
// NRS pain: 0-10
// PCS-related: morning stiffness severity (from HOOS symptoms, proxy)
// Route: A = mild (score 0-7), B = moderate (8-14), C = severe (15-20)
function calcHOOSScore(answers) {
  return HOOS12_ITEMS.reduce((sum, item) => sum + (answers[item.id] ?? 0), 0);
}

function calcRiskScore({ hoosRaw, nrsPain, nrsActivity, durationMonths, prevTreatment }) {
  let score = 0;

  // HOOS: higher raw score = worse function
  if (hoosRaw >= 28) score += 6;       // severe
  else if (hoosRaw >= 16) score += 3;  // moderate
  else score += 1;                      // mild

  // NRS rest pain
  if (nrsPain >= 7) score += 5;
  else if (nrsPain >= 4) score += 3;
  else if (nrsPain >= 1) score += 1;

  // NRS activity pain
  if (nrsActivity >= 7) score += 5;
  else if (nrsActivity >= 4) score += 3;
  else if (nrsActivity >= 1) score += 1;

  // Duration
  if (durationMonths >= 24) score += 2;
  else if (durationMonths >= 6) score += 1;

  // No prior treatment → lower score (naïve patient, often Route A/B)
  if (prevTreatment === 'none') score += 0;
  else if (prevTreatment === 'physio_only') score += 1;
  else if (prevTreatment === 'multiple') score += 2;

  return Math.min(score, 20);
}

function scoreToRoute(score) {
  if (score <= 7) return 'A';
  if (score <= 14) return 'B';
  return 'C';
}

const ROUTE_INFO = {
  A: {
    color: 'green',
    label: 'Route A — Zelfmanagement',
    description: 'Lichte klachten. U start met een zelfgeleid programma van 6 weken: dagelijkse oefeningen, educatie en leefstijladvies. Uw therapeut monitort uw voortgang.',
    weeks: 6,
    intensity: 'Laag',
  },
  B: {
    color: 'orange',
    label: 'Route B — Begeleid programma',
    description: 'Matige klachten. U volgt een begeleiding van 12 weken met intensievere therapeutcontacten, oefentherapie en leefstijlcoaching.',
    weeks: 12,
    intensity: 'Middel',
  },
  C: {
    color: 'red',
    label: 'Route C — Intensief programma',
    description: 'Ernstige klachten of hoge ziektelast. U start direct met een intensief 18-weeksprogramma inclusief reguliere consultaties bij uw therapeut en eventueel aanvullende zorg.',
    weeks: 18,
    intensity: 'Hoog',
  },
};

const ROUTE_COLORS = {
  green: { bg: 'bg-green-50', border: 'border-green-400', badge: 'bg-green-100 text-green-800', icon: '🟢', title: 'text-green-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-800', icon: '🟠', title: 'text-orange-800' },
  red: { bg: 'bg-red-50', border: 'border-red-400', badge: 'bg-red-100 text-red-800', icon: '🔴', title: 'text-red-800' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardOnboarding() {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Collected data
  const [jointType, setJointType] = useState('hip');          // only hip active now
  const [side, setSide] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [prevTreatment, setPrevTreatment] = useState('');
  const [hoosAnswers, setHoosAnswers] = useState({});
  const [nrsPain, setNrsPain] = useState(null);     // rest
  const [nrsActivity, setNrsActivity] = useState(null); // activity

  // Computed result
  const [route, setRoute] = useState(null);
  const [riskScore, setRiskScore] = useState(null);

  const totalSteps = 6; // 0=joint, 1=demographics, 2=HOOS, 3=NRS, 4=calculating, 5=result

  const hoosComplete = HOOS12_ITEMS.every((item) => hoosAnswers[item.id] !== undefined);

  const canNext = () => {
    if (step === 0) return jointType !== '';
    if (step === 1) return side !== '' && dateOfBirth !== '' && durationMonths !== '' && prevTreatment !== '';
    if (step === 2) return hoosComplete;
    if (step === 3) return nrsPain !== null && nrsActivity !== null;
    return true;
  };

  const handleCalculate = () => {
    const hoosRaw = calcHOOSScore(hoosAnswers);
    const score = calcRiskScore({
      hoosRaw,
      nrsPain,
      nrsActivity,
      durationMonths: parseInt(durationMonths) || 0,
      prevTreatment,
    });
    const assignedRoute = scoreToRoute(score);
    setRiskScore(score);
    setRoute(assignedRoute);
    setStep(5);
  };

  const handleNext = () => {
    if (step === 3) {
      handleCalculate();
    } else {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const hoosRaw = calcHOOSScore(hoosAnswers);
      const bmi = heightCm && weightKg
        ? Math.round((parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2)) * 10) / 10
        : null;

      // 1. Create patient_protocol record
      const { data: protocol, error: protocolError } = await supabase
        .from('patient_protocols')
        .insert({
          patient_id: user.id,
          joint_type: jointType,
          side,
          route,
          risk_score: riskScore,
          current_week: 0,
          current_phase: 1,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (protocolError) throw protocolError;

      // 2. Save HOOS assessment
      const { error: hoosError } = await supabase
        .from('patient_assessments')
        .insert({
          patient_id: user.id,
          protocol_id: protocol.id,
          assessment_type: 'HOOS',
          week: 0,
          answers: hoosAnswers,
          scores: { raw: hoosRaw, items: hoosAnswers },
        });

      if (hoosError) throw hoosError;

      // 3. Save NRS assessment
      const { error: nrsError } = await supabase
        .from('patient_assessments')
        .insert({
          patient_id: user.id,
          protocol_id: protocol.id,
          assessment_type: 'NRS',
          week: 0,
          answers: { rest: nrsPain, activity: nrsActivity },
          scores: { rest: nrsPain, activity: nrsActivity },
        });

      if (nrsError) throw nrsError;

      // 4. Save demographics assessment
      const { error: demoError } = await supabase
        .from('patient_assessments')
        .insert({
          patient_id: user.id,
          protocol_id: protocol.id,
          assessment_type: 'demographics',
          week: 0,
          answers: {
            side,
            date_of_birth: dateOfBirth,
            height_cm: heightCm,
            weight_kg: weightKg,
            bmi,
            duration_months: durationMonths,
            prev_treatment: prevTreatment,
          },
          scores: { bmi },
        });

      if (demoError) throw demoError;

      // 5. Update profile
      await updateProfile({
        date_of_birth: dateOfBirth || null,
        affected_joints: [jointType],
        onboarding_completed: true,
      });

      window.location.reload();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.');
      setSaving(false);
    }
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const StepJoint = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Welk gewricht heeft u?</h2>
      <p className="text-sm text-gray-500">Selecteer het gewricht waarvoor u het programma wilt starten. Uw therapeut kan later meerdere gewrichten toevoegen.</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'hip',      label: 'Heup',     emoji: '🦴', active: true },
          { id: 'knee',     label: 'Knie',     emoji: '🦵', active: false },
          { id: 'hand',     label: 'Hand',     emoji: '✋', active: false },
          { id: 'shoulder', label: 'Schouder', emoji: '💪', active: false },
        ].map((j) => (
          <button
            key={j.id}
            onClick={() => j.active && setJointType(j.id)}
            disabled={!j.active}
            className={`p-4 rounded-xl border-2 text-left transition-all relative ${
              !j.active
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : jointType === j.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-2xl">{j.emoji}</span>
            <p className="font-semibold text-sm mt-1">{j.label}</p>
            {!j.active && (
              <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> binnenkort
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const StepDemographics = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Algemene gegevens</h2>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Aangedane zijde</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ v: 'left', l: 'Links' }, { v: 'right', l: 'Rechts' }, { v: 'bilateral', l: 'Beide' }].map((o) => (
            <button key={o.v} onClick={() => setSide(o.v)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${side === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Geboortedatum</label>
        <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Lengte (cm) <span className="text-gray-400 font-normal">optioneel</span></label>
          <Input type="number" placeholder="175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Gewicht (kg) <span className="text-gray-400 font-normal">optioneel</span></label>
          <Input type="number" placeholder="80" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Hoe lang heeft u al heupklachten?</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: '1',   l: '< 3 maanden' },
            { v: '4',   l: '3–6 maanden' },
            { v: '9',   l: '6–12 maanden' },
            { v: '18',  l: '1–2 jaar' },
            { v: '30',  l: '2–5 jaar' },
            { v: '72',  l: '> 5 jaar' },
          ].map((o) => (
            <button key={o.v} onClick={() => setDurationMonths(o.v)}
              className={`p-2.5 rounded-lg border-2 text-sm transition-all ${durationMonths === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Eerdere behandeling voor deze klachten?</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { v: 'none',         l: 'Nee, dit is mijn eerste behandeling' },
            { v: 'physio_only',  l: 'Ja, eerder fysiotherapie' },
            { v: 'multiple',     l: 'Ja, meerdere behandelingen (fysio, injecties, etc.)' },
          ].map((o) => (
            <button key={o.v} onClick={() => setPrevTreatment(o.v)}
              className={`p-3 rounded-lg border-2 text-sm text-left transition-all ${prevTreatment === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const StepHOOS = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">HOOS-12: Heup klachten</h2>
        <p className="text-sm text-gray-500 mt-1">Geef aan hoeveel last u de afgelopen week heeft gehad van elk van de volgende problemen <strong>door uw heup</strong>.</p>
      </div>
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {HOOS12_ITEMS.map((item, idx) => (
          <div key={item.id} className="space-y-2">
            <p className="text-sm font-medium text-gray-800">{idx + 1}. {item.question}</p>
            <div className="flex gap-1.5 flex-wrap">
              {HOOS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setHoosAnswers((prev) => ({ ...prev, [item.id]: opt.value }))}
                  className={`flex-1 min-w-[90px] py-2 px-2 rounded-lg border-2 text-xs text-center transition-all ${
                    hoosAnswers[item.id] === opt.value
                      ? 'border-blue-500 bg-blue-50 font-semibold'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-right">{Object.keys(hoosAnswers).length} / {HOOS12_ITEMS.length} beantwoord</p>
    </div>
  );

  const StepNRS = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pijnmeting (NRS)</h2>
        <p className="text-sm text-gray-500 mt-1">Geef uw gemiddelde pijnscore van de <strong>afgelopen week</strong>. 0 = geen pijn, 10 = ergst denkbare pijn.</p>
      </div>

      <NRSSlider
        label="Pijn in rust"
        value={nrsPain}
        onChange={setNrsPain}
      />

      <NRSSlider
        label="Pijn bij bewegen / activiteit"
        value={nrsActivity}
        onChange={setNrsActivity}
      />
    </div>
  );

  const StepResult = () => {
    const info = ROUTE_INFO[route];
    const colors = ROUTE_COLORS[info.color];
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-2">{colors.icon}</div>
          <h2 className="text-xl font-bold text-gray-900">{info.label}</h2>
          <p className="text-sm text-gray-500 mt-1">Risicoscore: {riskScore} / 20</p>
        </div>

        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4`}>
          <p className="text-sm text-gray-700">{info.description}</p>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Duur</p>
              <p className="font-semibold text-sm">{info.weeks} weken</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Intensiteit</p>
              <p className="font-semibold text-sm">{info.intensity}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Wat nu?</p>
          <p>Uw therapeut ontvangt een melding en bespreekt uw route met u. U kunt alvast beginnen met de eerste oefeningen en educatie.</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}
      </div>
    );
  };

  // Aanroepen als functie (niet als component) zodat React niet unmount bij elke re-render
  // StepResult alleen aanroepen als route bekend is
  const stepComponents = [
    StepJoint(),
    StepDemographics(),
    StepHOOS(),
    StepNRS(),
    null,
    route ? StepResult() : null,
  ];

  const stepLabels = ['Gewricht', 'Gegevens', 'HOOS-12', 'Pijn', '', 'Resultaat'];

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <FullDisclaimer
        open={disclaimerOpen}
        onOpenChange={setDisclaimerOpen}
        onAgree={() => setDisclaimerOpen(false)}
      />

      <Card className="shadow-xl">
        <CardHeader className="text-center pb-4">
          <Heart className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <CardTitle className="text-lg">Intake — Artrocare Protocol</CardTitle>
          {/* Progress bar */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2, 3, 5].map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-1.5 rounded-full transition-colors ${
                  [0,1,2,3,5].indexOf(step) >= i ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Stap {[0,1,2,3,5].indexOf(step) + 1} van 5 — {stepLabels[step]}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {stepComponents[step]}

          {error && step === 5 && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(step === 5 ? 3 : step - 1)}
              disabled={step === 0 || saving}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Terug
            </Button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canNext()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {step === 3 ? 'Bereken route' : 'Volgende'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {saving ? 'Opslaan...' : 'Start mijn programma'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── NRS Slider sub-component ─────────────────────────────────────────────────
function NRSSlider({ label, value, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg border-2 text-sm font-semibold transition-all ${
              value === n
                ? n <= 3
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : n <= 6
                    ? 'border-orange-500 bg-orange-50 text-orange-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                : 'border-gray-200 hover:border-gray-400 text-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0 — Geen pijn</span>
        <span>10 — Ergste pijn</span>
      </div>
      {value !== null && (
        <p className="text-sm font-medium text-gray-700">
          Geselecteerd: <span className={value <= 3 ? 'text-green-600' : value <= 6 ? 'text-orange-600' : 'text-red-600'}>{value}</span>
        </p>
      )}
    </div>
  );
}
