// Data hooks for the fitness tracker. Each hook owns one localStorage key
// and exposes a small CRUD-ish API. They are all called once at the top of
// FitApp and passed down as props, so every page shares a single source of
// truth and updates stay in sync without a global store.

import { useState, useEffect, useCallback } from 'react';
import { todayISO } from './date';
import { SUPPLEMENTS } from './data';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / unavailable — fail silently, app stays usable */
    }
  }, [key, value]);

  return [value, setValue];
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------------------------------------------------------------- workouts
export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage('fit:workouts', []);

  const addWorkout = useCallback((w) => {
    setWorkouts((prev) => [{ ...w, id: uid() }, ...prev]);
  }, [setWorkouts]);

  const deleteWorkout = useCallback((id) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, [setWorkouts]);

  return { workouts, addWorkout, deleteWorkout };
}

// --------------------------------------------------------------- nutrition
const emptyNutrition = (date) => ({
  date,
  meals: [],
  water: 0,
  fastingActive: false,
  fastingStart: null,
  fastingEnd: null,
});

export function useNutrition() {
  const [byDate, setByDate] = useLocalStorage('fit:nutrition', {});
  const date = todayISO();
  const today = byDate[date] || emptyNutrition(date);

  const update = useCallback((patch) => {
    setByDate((prev) => {
      const cur = prev[date] || emptyNutrition(date);
      return { ...prev, [date]: { ...cur, ...patch } };
    });
  }, [setByDate, date]);

  const addMeal = useCallback((meal) => {
    setByDate((prev) => {
      const cur = prev[date] || emptyNutrition(date);
      return { ...prev, [date]: { ...cur, meals: [...cur.meals, { ...meal, id: uid() }] } };
    });
  }, [setByDate, date]);

  const deleteMeal = useCallback((id) => {
    setByDate((prev) => {
      const cur = prev[date] || emptyNutrition(date);
      return { ...prev, [date]: { ...cur, meals: cur.meals.filter((m) => m.id !== id) } };
    });
  }, [setByDate, date]);

  const addWater = useCallback((ml) => {
    setByDate((prev) => {
      const cur = prev[date] || emptyNutrition(date);
      return { ...prev, [date]: { ...cur, water: Math.max(0, cur.water + ml) } };
    });
  }, [setByDate, date]);

  const startFasting = useCallback(() => {
    update({ fastingActive: true, fastingStart: new Date().toISOString(), fastingEnd: null });
  }, [update]);

  const stopFasting = useCallback(() => {
    update({ fastingActive: false, fastingEnd: new Date().toISOString() });
  }, [update]);

  // Derived macro totals from the logged meals.
  const totals = today.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      fat: acc.fat + (Number(m.fat) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  return { today, totals, addMeal, deleteMeal, addWater, startFasting, stopFasting };
}

// ------------------------------------------------------------- supplements
export function useSupplements() {
  const [byDate, setByDate] = useLocalStorage('fit:supplements', {});
  const date = todayISO();

  // Lazily seed today's list from the protocol template.
  const items = byDate[date]?.items || SUPPLEMENTS.map((s) => ({
    name: s.name, dosage: s.dosage, taken: false, time: '',
  }));

  const toggle = useCallback((name) => {
    setByDate((prev) => {
      const base = prev[date]?.items || SUPPLEMENTS.map((s) => ({
        name: s.name, dosage: s.dosage, taken: false, time: '',
      }));
      const next = base.map((it) =>
        it.name === name
          ? { ...it, taken: !it.taken, time: !it.taken ? new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '' }
          : it,
      );
      return { ...prev, [date]: { date, items: next } };
    });
  }, [setByDate, date]);

  const takenCount = items.filter((i) => i.taken).length;

  return { items, toggle, takenCount };
}

// ---------------------------------------------------------------- progress
export function useProgress() {
  const [entries, setEntries] = useLocalStorage('fit:progress', []);

  const addEntry = useCallback((e) => {
    setEntries((prev) => {
      // One entry per date — replace if the date already exists.
      const rest = prev.filter((x) => x.date !== e.date);
      return [...rest, { ...e, id: e.id || uid() }].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [setEntries]);

  const deleteEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((x) => x.id !== id));
  }, [setEntries]);

  return { entries, addEntry, deleteEntry };
}

// ------------------------------------------------------------- intermittent
const emptyIntermittent = (date) => ({
  date,
  coldExposure: false, coldDuration: 2,
  sauna: false, saunaDuration: 15,
  meditation: false, meditationDuration: 10,
});

export function useIntermittent() {
  const [byDate, setByDate] = useLocalStorage('fit:intermittent', {});
  const date = todayISO();
  const today = byDate[date] || emptyIntermittent(date);

  const update = useCallback((patch) => {
    setByDate((prev) => {
      const cur = prev[date] || emptyIntermittent(date);
      return { ...prev, [date]: { ...cur, ...patch } };
    });
  }, [setByDate, date]);

  return { today, update };
}
