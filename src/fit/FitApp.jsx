// Root of the self-contained "Fit Worden op 61" fitness tracker, mounted at
// /fit. It owns the active-tab state and calls every data hook once so all
// pages share a single, in-sync source of truth (no global store needed).
import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import {
  useWorkouts, useNutrition, useSupplements, useProgress, useIntermittent,
} from './lib/hooks';

import Dashboard from './pages/Dashboard';
import Training from './pages/Training';
import Nutrition from './pages/Nutrition';
import Supplements from './pages/Supplements';
import Progress from './pages/Progress';
import Intermittent from './pages/Intermittent';
import CheatSheet from './pages/CheatSheet';

export default function FitApp() {
  const [tab, setTab] = useState('dashboard');

  const workouts = useWorkouts();
  const nutrition = useNutrition();
  const supplements = useSupplements();
  const progress = useProgress();
  const intermittent = useIntermittent();

  const go = (t) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F1EB] text-[#2D3436]">
      <div className="mx-auto w-full max-w-[480px] pb-20 md:max-w-6xl">
        {tab === 'dashboard' && (
          <Dashboard
            workouts={workouts}
            nutrition={nutrition}
            supplements={supplements}
            progress={progress}
            intermittent={intermittent}
            onNavigate={go}
          />
        )}
        {tab === 'training' && <Training {...workouts} />}
        {tab === 'nutrition' && <Nutrition {...nutrition} />}
        {tab === 'supplements' && <Supplements {...supplements} />}
        {tab === 'progress' && <Progress {...progress} />}
        {tab === 'intermittent' && <Intermittent {...intermittent} />}
        {tab === 'cheat' && <CheatSheet />}
      </div>
      <BottomNav active={tab} onChange={go} />
    </div>
  );
}
