import React, { useCallback, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import HumanModel from './HumanModel';
import MovementTrail from './MovementTrail';

/**
 * ExerciseScene — The full 3D scene: Canvas + lighting + camera + model + trail.
 * Receives normalizedTime (0–1) and exerciseData from the composition.
 */
export default function ExerciseScene({ exerciseData, normalizedTime, muscleIntensities }) {
  const [trailPoints, setTrailPoints] = useState([]);
  const lastTimeRef = useRef(-1);

  // Collect ankle positions for the trail
  const handleJointPosition = useCallback((jointName, position) => {
    if (jointName !== exerciseData.trail?.joint) return;

    // Only add a new point when time actually advances
    const t = Math.round(normalizedTime * 1000);
    if (t === lastTimeRef.current) return;
    lastTimeRef.current = t;

    setTrailPoints(prev => {
      const maxPts = exerciseData.trail?.maxPoints || 60;
      const next = [...prev, { x: position.x, y: position.y, z: position.z }];
      return next.length > maxPts ? next.slice(next.length - maxPts) : next;
    });
  }, [exerciseData, normalizedTime]);

  const cam = exerciseData.camera || { position: [2, 1.2, 2.5], fov: 40, lookAt: [0, 0.6, 0] };

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: cam.position,
        fov: cam.fov,
        near: 0.1,
        far: 50,
      }}
      shadows={false}
      style={{ background: '#ffffff' }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Set camera look-at target */}
      <CameraLookAt target={cam.lookAt} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} color="#e0e7ff" />

      {/* Human model */}
      <HumanModel
        exerciseData={exerciseData}
        normalizedTime={normalizedTime}
        muscleIntensities={muscleIntensities}
        onJointPosition={handleJointPosition}
      />

      {/* Movement trail */}
      {exerciseData.trail && (
        <MovementTrail
          points={trailPoints}
          color={exerciseData.trail.color}
          maxPoints={exerciseData.trail.maxPoints}
        />
      )}
    </Canvas>
  );
}

// ─── Helper: point camera at target on mount ───────────────────────────────
function CameraLookAt({ target }) {
  const { camera } = useThree();
  React.useEffect(() => {
    if (target) {
      camera.lookAt(...target);
      camera.updateProjectionMatrix();
    }
  }, [camera, target]);
  return null;
}
