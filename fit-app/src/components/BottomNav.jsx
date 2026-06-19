// Fixed bottom navigation with 7 tabs. Active tab gets the primary colour
// plus a gold indicator bar on top.
import React from 'react';
import {
  LayoutDashboard, Dumbbell, Utensils, Pill, TrendingUp, Snowflake, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Voeding', icon: Utensils },
  { id: 'supplements', label: 'Supps', icon: Pill },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'intermittent', label: 'IL', icon: Snowflake },
  { id: 'cheat', label: 'Cheat', icon: ClipboardList },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-[#EDE8E0] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <ul className="grid grid-cols-7">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                className={cn(
                  'relative flex w-full flex-col items-center gap-0.5 py-2 transition-colors',
                  isActive ? 'text-[#1B4332]' : 'text-[#8B7E6A]',
                )}
              >
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-6 rounded-full bg-[#D4A574]" />
                )}
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
