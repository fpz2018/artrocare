// "Fit Worden op 61" — static design tokens, daily targets and all
// pre-loaded training / supplement / protocol templates.
//
// This whole module is self-contained: the fitness tracker is mounted at
// /fit and shares nothing with the surrounding artrocare app except the
// shadcn/ui primitives and the `cn` helper.

// Design system palette (used via arbitrary Tailwind values, e.g. bg-[#1B4332]).
export const COLORS = {
  primary: '#1B4332', // deep dark green
  accent: '#D4A574', // warm gold/tan
  secondary: '#8B7E6A', // warm taupe
  bg: '#F5F1EB', // warm paper white
  card: '#FFFFFF',
  lightBg: '#EDE8E0',
  text: '#2D3436',
};

// Daily / weekly goals for the 61-year-old user (104kg → 94kg).
export const TARGETS = {
  workoutsPerWeek: 5,
  calories: 1900,
  protein: 200,
  fat: 70,
  carbs: 190,
  water: 2000, // ml
  fastingHours: 16,
  supplements: 4,
};

export const WORKOUT_TYPES = [
  { id: 'strength', label: 'Kracht' },
  { id: 'plyo', label: 'Plyometrie' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'kot', label: 'KOT' },
];

// Helper to build a fresh exercise row from a template definition.
const ex = (name, target, withWeight = false) => ({
  name,
  target, // display hint like "3x8-12"
  sets: 3,
  reps: 10,
  weight: withWeight ? 0 : undefined,
  completed: false,
});

// Strength templates per training day.
export const STRENGTH_DAYS = {
  dag1: {
    label: 'Dag 1 — Push + Core',
    short: 'Push',
    exercises: [
      ex('Bench press', '3x8-12', true),
      ex('Overhead press', '3x8-12', true),
      ex('Incline DB press', '3x10-15', true),
      ex('Tricep dips', '3x10-15', true),
      ex('Plank', '3x30-60s'),
      ex('Dead bug', '3x10'),
    ],
  },
  dag2: {
    label: 'Dag 2 — Pull + Benen',
    short: 'Pull',
    exercises: [
      ex('Deadlift / RDL', '3x8-12', true),
      ex('Lat pulldown', '3x10-15', true),
      ex('DB rows', '3x10-15', true),
      ex('Leg press', '3x12-15', true),
      ex('Hamstring curl', '3x12-15', true),
      ex('Face pulls', '3x15-20', true),
    ],
  },
  dag3: {
    label: 'Dag 3 — Benen + Arms',
    short: 'Benen',
    exercises: [
      ex('Goblet squat', '3x10-15', true),
      ex('Bulgarian split squat', '3x8-12', true),
      ex('Calf raises', '3x15-20', true),
      ex('Bicep curls', '3x12-15', true),
      ex('Face pulls', '3x15-20', true),
      ex('Plank', '3x30-60s'),
    ],
  },
};

// Plyometrics phases.
export const PLYO_PHASES = {
  fase1: { label: 'Fase 1 (wk 1-2)', exercises: ['Mini-hurdles', 'Line hops', 'Pogos'] },
  fase2: { label: 'Fase 2 (wk 3-4)', exercises: ['Tuck jumps', 'Split jumps', 'Squat jumps'] },
  fase3: { label: 'Fase 3 (wk 5+)', exercises: ['Single-leg bounds', 'Lateral bounds', 'Depth jumps'] },
};

// KOT (Knees Over Toes) — daily mobility/strength.
export const KOT_EXERCISES = [
  ex('Backward walk 10 min', '10 min'),
  ex('Tibialis raises', '3x15'),
  ex('ATG split squat', '3x8-10'),
  ex('Poliquin step-up', '3x8-10'),
];

// Daily supplement protocol.
export const SUPPLEMENTS = [
  {
    name: 'Creatine monohydraat',
    dosage: '5g',
    timing: 'Dagelijks, met maaltijd',
    science: '+5-10% spierkracht',
  },
  {
    name: 'Vitamine D3',
    dosage: '2000-4000 IU',
    timing: 'Ochtend, met vet',
    science: 'Spierfunctie, botdichtheid',
  },
  {
    name: 'Omega-3 EPA/DHA',
    dosage: '2-3g',
    timing: 'Met maaltijd',
    science: 'Vermindert ontsteking',
  },
  {
    name: 'Magnesium bisglycinaat',
    dosage: '300-400mg',
    timing: 'Avond, voor slapen',
    science: '300+ enzymen, slaap',
  },
];

// Weekly calendar shown on the Cheat Sheet.
export const WEEK_PLAN = [
  { day: 'Ma', activity: 'Kracht D1 + KOT' },
  { day: 'Di', activity: 'Plyometrie + Tennis' },
  { day: 'Wo', activity: 'Kracht D2 + KOT' },
  { day: 'Do', activity: 'Zone 2 cardio + Sauna' },
  { day: 'Vr', activity: 'Kracht D3 + KOT' },
  { day: 'Za', activity: 'Tennis / Padel' },
  { day: 'Zo', activity: 'Rust + Meditatie' },
];
