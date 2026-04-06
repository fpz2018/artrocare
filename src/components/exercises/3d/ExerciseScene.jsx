import React, { useCallback, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import HumanModel from './HumanModel';
import MovementTrail from './MovementTrail';

/**
 * ExerciseScene — The full 3D scene: Canvas + lighting + camera + model + trail.
 */
export default function ExerciseScene({ exerciseData, normalizedTime, muscleIntensities }) {
  const [trailPoints, setTrailPoints] = useState([]);
  const lastTimeRef = useRef(-1);

  const handleJointPosition = useCallback((jointName, position) => {
    if (jointName !== exerciseData.trail?.joint) return;
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
      dpr={[1, 2]}
      camera={{
        position: cam.position,
        fov: cam.fov,
        near: 0.1,
        far: 50,
      }}
      shadows={false}
      style={{ background: 'linear-gradient(180deg, #fafaf9 0%, #f0efed 100%)' }}
      gl={{ antialias: true, alpha: false, toneMapping: 3 }}
    >
      <CameraLookAt target={cam.lookAt} />

      {/* Ambient: soft overall illumination */}
      <ambientLight intensity={0.5} color="#fff5ee" />

      {/* Key light: warm, from upper-right-front */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.0}
        color="#fff8f0"
      />

      {/* Fill light: cooler, from left to soften shadows */}
      <directionalLight
        position={[-3, 3, 2]}
        intensity={0.4}
        color="#e8eef5"
      />

      {/* Rim light: subtle backlight for depth */}
      <directionalLight
        position={[0, 3, -4]}
        intensity={0.3}
        color="#f0e8ff"
      />

      {/* Ground bounce light */}
      <hemisphereLight
        color="#ffeedd"
        groundColor="#d4c8bb"
        intensity={0.3}
      />

      <HumanModel
        exerciseData={exerciseData}
        normalizedTime={normalizedTime}
        muscleIntensities={muscleIntensities}
        onJointPosition={handleJointPosition}
      />

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
