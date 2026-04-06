import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import ExerciseScene from './ExerciseScene';
import { interpolateKeyframes } from './HumanModel';

/**
 * ExerciseComposition — Remotion composition that drives the 3D scene.
 * Uses Remotion's frame system for precise timeline control.
 */
export default function ExerciseComposition({ exerciseData }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate normalized time (0–1) looping over the exercise duration
  const exerciseDurationFrames = exerciseData.fps * exerciseData.duration;
  const normalizedTime = (frame % exerciseDurationFrames) / exerciseDurationFrames;

  // Compute muscle intensities from exercise data
  const muscleIntensities = useMemo(() => {
    const result = {};
    const muscles = exerciseData.muscles || {};

    for (const [muscleName, muscleConfig] of Object.entries(muscles)) {
      const intensity = muscleConfig.intensity || [];
      // Interpolate intensity at current time
      if (intensity.length > 0) {
        result[muscleName] = interpolateIntensity(intensity, normalizedTime);
      }
    }
    return result;
  }, [exerciseData.muscles, normalizedTime]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ExerciseScene
        exerciseData={exerciseData}
        normalizedTime={normalizedTime}
        muscleIntensities={muscleIntensities}
      />
    </div>
  );
}

// ─── Interpolate muscle intensity ──────────────────────────────────────────
function interpolateIntensity(points, t) {
  if (!points || points.length === 0) return 0;
  if (t <= points[0].t) return points[0].v;
  if (t >= points[points.length - 1].t) return points[points.length - 1].v;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (t >= a.t && t <= b.t) {
      const local = (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * local;
    }
  }
  return points[points.length - 1].v;
}
