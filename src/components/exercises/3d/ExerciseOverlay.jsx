import React, { useMemo } from 'react';
import { useI18n } from '@/i18n';

/**
 * ExerciseOverlay — 2D HTML overlay on top of the 3D canvas.
 * Shows exercise name, active muscle groups, and rotating tips.
 */
export default function ExerciseOverlay({ exerciseData, normalizedTime }) {
  const { t } = useI18n();

  // Rotate through tips based on animation cycle
  const tipIndex = useMemo(() => {
    const tips = exerciseData.i18n?.tips || [];
    if (tips.length === 0) return -1;
    // Show each tip for 1/n of the cycle
    return Math.floor(normalizedTime * tips.length) % tips.length;
  }, [exerciseData.i18n?.tips, normalizedTime]);

  const title = t(exerciseData.i18n?.title) || exerciseData.id;
  const muscles = t(exerciseData.i18n?.muscles) || '';
  const tips = exerciseData.i18n?.tips || [];
  const currentTip = tipIndex >= 0 ? t(tips[tipIndex]) : '';

  return (
    <div
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4"
      style={{ zIndex: 10 }}
    >
      {/* Top bar: exercise name + muscle groups */}
      <div>
        <div className="bg-white/85 backdrop-blur-sm rounded-lg px-3 py-2 inline-block shadow-sm">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
            {title}
          </h3>
          {muscles && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs sm:text-sm text-emerald-700 font-medium">
                {muscles}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: current tip / attention point */}
      {currentTip && (
        <div className="mb-1">
          <div className="bg-white/85 backdrop-blur-sm rounded-lg px-3 py-2 inline-block shadow-sm max-w-[85%]">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-0.5 shrink-0">💡</span>
              <p className="text-xs sm:text-sm text-gray-700">
                {currentTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
