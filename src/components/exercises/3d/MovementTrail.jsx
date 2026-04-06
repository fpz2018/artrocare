import React, { useRef, useMemo } from 'react';
import { Line } from '@react-three/drei';

/**
 * MovementTrail — renders a fading dotted trail showing the path
 * of a tracked joint (e.g. the ankle during knee extension).
 */
export default function MovementTrail({ points, color = '#3b82f6', maxPoints = 60 }) {
  // Need at least 2 points to draw a line
  if (!points || points.length < 2) return null;

  // Take only the most recent maxPoints
  const recentPoints = points.length > maxPoints
    ? points.slice(points.length - maxPoints)
    : points;

  // Convert to array of [x,y,z]
  const positions = useMemo(() => {
    return recentPoints.map(p => [p.x, p.y, p.z]);
  }, [recentPoints]);

  // Generate vertex colors for fade-out effect (older = more transparent)
  const colors = useMemo(() => {
    return recentPoints.map((_, i) => {
      const alpha = i / (recentPoints.length - 1); // 0 = oldest, 1 = newest
      // Blend from white (faded) to the trail color
      const r = 1 - alpha * (1 - parseInt(color.slice(1, 3), 16) / 255);
      const g = 1 - alpha * (1 - parseInt(color.slice(3, 5), 16) / 255);
      const b = 1 - alpha * (1 - parseInt(color.slice(5, 7), 16) / 255);
      return [r, g, b];
    });
  }, [recentPoints, color]);

  return (
    <Line
      points={positions}
      vertexColors={colors}
      lineWidth={2.5}
      dashed
      dashSize={0.02}
      gapSize={0.015}
    />
  );
}
