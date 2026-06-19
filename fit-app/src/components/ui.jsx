// Small presentational primitives scoped to the fitness tracker. They bake
// in the "Fit Worden op 61" palette via arbitrary Tailwind values so the
// section keeps its own look without depending on the artrocare theme tokens.
import React from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FitCard({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-lg bg-white border border-[#EDE8E0] shadow-sm p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value, max, className }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[#EDE8E0]', className)}>
      <div
        className="h-full rounded-full bg-[#D4A574] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function KpiCard({ label, value, sub, current, max, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg bg-white border border-[#EDE8E0] shadow-sm p-3 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
    >
      <div className="text-[12px] font-medium text-[#8B7E6A]">{label}</div>
      <div className="mt-1 text-[28px] leading-none font-bold text-[#D4A574]">{value}</div>
      {sub && <div className="text-[11px] text-[#8B7E6A] mt-0.5">{sub}</div>}
      {typeof max === 'number' && <ProgressBar value={current} max={max} className="mt-2" />}
    </button>
  );
}

export function SectionHeading({ children, className }) {
  return (
    <h2 className={cn('text-lg font-bold text-[#1B4332] mb-2', className)}>{children}</h2>
  );
}

// Round toggle used for supplements / habits.
export function RoundCheck({ checked, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
        checked
          ? 'border-[#1B4332] bg-[#1B4332] text-white'
          : 'border-[#8B7E6A] bg-white text-transparent',
        className,
      )}
    >
      <Check className="h-4 w-4" strokeWidth={3} />
    </button>
  );
}

// [-] [N min] [+] stepper.
export function MinuteStepper({ value, onChange, unit = 'min', step = 1, min = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#EDE8E0] bg-white text-[#1B4332] hover:bg-[#EDE8E0]"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="min-w-[64px] text-center font-semibold text-[#2D3436]">{value} {unit}</div>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#EDE8E0] bg-white text-[#1B4332] hover:bg-[#EDE8E0]"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// Solid green primary button.
export function PrimaryButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#143126] disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GoldButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md bg-[#D4A574] px-4 py-2.5 text-sm font-semibold text-[#1B4332] shadow-sm transition hover:brightness-95 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Compact numeric/text field used across the forms.
export function Field({ label, className, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[12px] font-medium text-[#8B7E6A]">{label}</span>}
      <input
        className={cn(
          'w-full rounded-md border border-[#EDE8E0] bg-white px-2.5 py-2 text-sm text-[#2D3436] outline-none focus:border-[#D4A574] focus:ring-1 focus:ring-[#D4A574]',
          className,
        )}
        {...props}
      />
    </label>
  );
}
