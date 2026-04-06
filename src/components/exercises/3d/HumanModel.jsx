import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// ─── Realistic body proportions (meters) ───────────────────────────────────
// Based on average adult proportions, slightly idealized

const SKIN_COLOR = '#e8beac';
const SKIN_COLOR_DARK = '#d4a090';
const JOINT_BLEND = '#dba898';
const HAIR_COLOR = '#4a3728';

// ─── Smooth interpolation helpers ──────────────────────────────────────────

function interpolateKeyframes(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 0;
  if (t <= keyframes[0].t) return keyframes[0].angle;
  if (t >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1].angle;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (t >= a.t && t <= b.t) {
      const local = (t - a.t) / (b.t - a.t);
      const smooth = local * local * (3 - 2 * local);
      return a.angle + (b.angle - a.angle) * smooth;
    }
  }
  return keyframes[keyframes.length - 1].angle;
}

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

// ─── Realistic skin material ───────────────────────────────────────────────

function SkinMaterial({ color = SKIN_COLOR }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.65}
      metalness={0.02}
    />
  );
}

// ─── Tapered limb (wider at one end) ───────────────────────────────────────

function TaperedLimb({ length, radiusTop, radiusBottom, color = SKIN_COLOR, segments = 12, ...props }) {
  return (
    <mesh {...props}>
      <cylinderGeometry args={[radiusTop, radiusBottom, length, segments]} />
      <SkinMaterial color={color} />
    </mesh>
  );
}

// ─── Smooth joint sphere (blends limb connections) ─────────────────────────

function JointBlend({ radius, color = JOINT_BLEND, ...props }) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[radius, 16, 12]} />
      <SkinMaterial color={color} />
    </mesh>
  );
}

// ─── Realistic Head ────────────────────────────────────────────────────────

function Head() {
  return (
    <group>
      {/* Cranium — slightly elongated sphere */}
      <mesh position={[0, 0.02, 0]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.095, 20, 16]} />
        <SkinMaterial />
      </mesh>

      {/* Jaw / lower face */}
      <mesh position={[0, -0.06, 0.02]} scale={[0.82, 0.6, 0.85]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <SkinMaterial />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.01, 0.09]} rotation={[0.3, 0, 0]}>
        <capsuleGeometry args={[0.012, 0.025, 6, 8]} />
        <SkinMaterial color={SKIN_COLOR_DARK} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.09, 0, 0]} rotation={[0, 0, side * 0.15]} scale={[0.5, 1, 0.7]}>
          <sphereGeometry args={[0.025, 10, 8]} />
          <SkinMaterial color={SKIN_COLOR_DARK} />
        </mesh>
      ))}

      {/* Hair (top of head) */}
      <mesh position={[0, 0.06, -0.01]} scale={[1.05, 0.7, 1.05]}>
        <sphereGeometry args={[0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={HAIR_COLOR} roughness={0.9} metalness={0} />
      </mesh>

      {/* Eyes — subtle dark spots */}
      {[-1, 1].map((side) => (
        <mesh key={`eye-${side}`} position={[side * 0.032, 0.01, 0.085]} scale={[1.2, 0.7, 0.5]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color="#3d2b1f" roughness={0.3} metalness={0.1} />
        </mesh>
      ))}

      {/* Eyebrows */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * 0.032, 0.035, 0.082]} scale={[2.2, 0.4, 0.5]}>
          <sphereGeometry args={[0.008, 8, 6]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.8} metalness={0} />
        </mesh>
      ))}

      {/* Mouth line */}
      <mesh position={[0, -0.045, 0.082]} scale={[2, 0.3, 0.5]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <meshStandardMaterial color="#c4877a" roughness={0.6} metalness={0} />
      </mesh>

      {/* Neck */}
      <TaperedLimb
        length={0.06}
        radiusTop={0.04}
        radiusBottom={0.045}
        position={[0, -0.14, 0]}
      />
    </group>
  );
}

// ─── Realistic Hand ────────────────────────────────────────────────────────

function Hand() {
  return (
    <group>
      {/* Palm */}
      <mesh scale={[1, 0.5, 0.8]}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <SkinMaterial />
      </mesh>
      {/* Fingers (simplified as a group) */}
      <mesh position={[0, -0.035, 0]} scale={[0.8, 1, 0.6]}>
        <capsuleGeometry args={[0.015, 0.03, 4, 8]} />
        <SkinMaterial />
      </mesh>
    </group>
  );
}

// ─── Realistic Foot ────────────────────────────────────────────────────────

function Foot() {
  return (
    <group>
      {/* Ankle area */}
      <JointBlend radius={0.03} />
      {/* Foot body */}
      <mesh position={[0, -0.025, 0.04]} scale={[1, 0.5, 1.6]}>
        <capsuleGeometry args={[0.035, 0.04, 6, 10]} />
        <SkinMaterial />
      </mesh>
      {/* Toe area */}
      <mesh position={[0, -0.03, 0.1]} scale={[0.9, 0.4, 0.8]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <SkinMaterial />
      </mesh>
    </group>
  );
}

// ─── Torso (realistic shape) ───────────────────────────────────────────────

function Torso({ quadIntensity = 0 }) {
  return (
    <group>
      {/* Upper chest — broader */}
      <mesh position={[0, 0.15, 0]} scale={[1.1, 1, 0.75]}>
        <capsuleGeometry args={[0.12, 0.12, 8, 16]} />
        <SkinMaterial />
      </mesh>

      {/* Mid torso — slight taper */}
      <mesh position={[0, 0, 0]} scale={[0.95, 1, 0.7]}>
        <capsuleGeometry args={[0.1, 0.14, 8, 16]} />
        <SkinMaterial />
      </mesh>

      {/* Lower torso / pelvis — wider at hips */}
      <mesh position={[0, -0.14, 0]} scale={[1.05, 0.8, 0.75]}>
        <capsuleGeometry args={[0.1, 0.08, 8, 16]} />
        <SkinMaterial />
      </mesh>

      {/* Shoulder caps */}
      {[-1, 1].map((side) => (
        <JointBlend
          key={side}
          radius={0.055}
          position={[side * 0.15, 0.22, 0]}
          color={SKIN_COLOR}
        />
      ))}
    </group>
  );
}

// ─── Upper Arm ─────────────────────────────────────────────────────────────

function UpperArm() {
  return (
    <group>
      <TaperedLimb length={0.26} radiusTop={0.04} radiusBottom={0.032} />
    </group>
  );
}

// ─── Forearm + Hand ────────────────────────────────────────────────────────

function Forearm() {
  return (
    <group>
      <TaperedLimb length={0.24} radiusTop={0.032} radiusBottom={0.025} />
      {/* Wrist blend */}
      <JointBlend radius={0.022} position={[0, -0.12, 0]} color={SKIN_COLOR} />
      {/* Hand */}
      <group position={[0, -0.16, 0]}>
        <Hand />
      </group>
    </group>
  );
}

// ─── Upper Leg (with optional muscle glow) ─────────────────────────────────

function UpperLeg({ glowIntensity = 0, glowColor = '#10b981' }) {
  const emissive = useMemo(() => {
    return new THREE.Color(glowColor).multiplyScalar(glowIntensity * 2);
  }, [glowIntensity, glowColor]);

  return (
    <group>
      {/* Main thigh */}
      <TaperedLimb length={0.40} radiusTop={0.07} radiusBottom={0.045} />

      {/* Muscle glow overlay */}
      {glowIntensity > 0.05 && (
        <mesh>
          <cylinderGeometry args={[0.072, 0.047, 0.40, 12]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={emissive}
            emissiveIntensity={glowIntensity * 1.5}
            transparent
            opacity={glowIntensity * 0.4}
            roughness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Lower Leg ─────────────────────────────────────────────────────────────

function LowerLeg() {
  return (
    <group>
      {/* Calf — thicker at top (calf muscle) */}
      <TaperedLimb length={0.38} radiusTop={0.045} radiusBottom={0.03} />
    </group>
  );
}

// ─── Chair (more realistic) ────────────────────────────────────────────────

function Chair({ height }) {
  const seatDepth = 0.42;
  const seatWidth = 0.46;
  const seatThickness = 0.035;
  const legW = 0.025;
  const backHeight = 0.42;
  const CHAIR_COLOR = '#c4b5a5';
  const CHAIR_DARK = '#a89888';

  return (
    <group position={[0, 0, -0.08]}>
      {/* Seat */}
      <mesh position={[0, height, -seatDepth / 2 + 0.05]}>
        <boxGeometry args={[seatWidth, seatThickness, seatDepth]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Back rest — slightly curved */}
      <mesh position={[0, height + backHeight / 2 + 0.02, -seatDepth + 0.06]}>
        <boxGeometry args={[seatWidth - 0.02, backHeight, seatThickness]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* 4 Legs */}
      {[
        [seatWidth / 2 - 0.04, 0.06],
        [-seatWidth / 2 + 0.04, 0.06],
        [seatWidth / 2 - 0.04, -seatDepth + 0.1],
        [-seatWidth / 2 + 0.04, -seatDepth + 0.1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]}>
          <cylinderGeometry args={[legW, legW, height, 8]} />
          <meshStandardMaterial color={CHAIR_DARK} roughness={0.7} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main HumanModel component ─────────────────────────────────────────────

export default function HumanModel({
  exerciseData,
  normalizedTime = 0,
  muscleIntensities = {},
  onJointPosition,
}) {
  const angles = useMemo(() => {
    const base = exerciseData.basePose || {};
    const kf = exerciseData.keyframes || {};
    const result = { ...base };
    for (const [joint, frames] of Object.entries(kf)) {
      result[joint] = interpolateKeyframes(frames, normalizedTime);
    }
    return result;
  }, [exerciseData, normalizedTime]);

  const r = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(angles)) {
      out[k] = deg2rad(v);
    }
    return out;
  }, [angles]);

  const quadIntensity = muscleIntensities.quadricepsRight || 0;

  // Report ankle position for trail
  const rightAnkleRef = useRef();
  React.useEffect(() => {
    if (rightAnkleRef.current && onJointPosition) {
      const pos = new THREE.Vector3();
      rightAnkleRef.current.getWorldPosition(pos);
      onJointPosition('rightAnkle', pos);
    }
  });

  const seatH = exerciseData.props?.chairHeight || 0.45;

  return (
    <group position={[0, 0, 0]}>
      {/* ── Pelvis (root) at seat height ── */}
      <group position={[0, seatH, 0]}>

        {/* ── Torso ── */}
        <group rotation={[r.torsoTilt || 0, 0, 0]}>
          <Torso />

          {/* ── Head ── */}
          <group position={[0, 0.38, 0.01]}>
            <Head />
          </group>

          {/* ── Left Arm ── */}
          <group position={[0.16, 0.2, 0]}>
            <JointBlend radius={0.04} color={SKIN_COLOR} />
            <group rotation={[r.leftShoulder || 0, 0, 0.1]}>
              <group position={[0, -0.13, 0]}>
                <UpperArm />
              </group>
              <group position={[0, -0.26, 0]}>
                <JointBlend radius={0.028} color={SKIN_COLOR} />
                <group rotation={[r.leftElbow || 0, 0, 0]}>
                  <group position={[0, -0.12, 0]}>
                    <Forearm />
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* ── Right Arm ── */}
          <group position={[-0.16, 0.2, 0]}>
            <JointBlend radius={0.04} color={SKIN_COLOR} />
            <group rotation={[r.rightShoulder || 0, 0, -0.1]}>
              <group position={[0, -0.13, 0]}>
                <UpperArm />
              </group>
              <group position={[0, -0.26, 0]}>
                <JointBlend radius={0.028} color={SKIN_COLOR} />
                <group rotation={[r.rightElbow || 0, 0, 0]}>
                  <group position={[0, -0.12, 0]}>
                    <Forearm />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ── Left Leg (static) ── */}
        <group position={[0.08, -0.08, 0]}>
          <JointBlend radius={0.055} color={SKIN_COLOR} />
          <group rotation={[r.leftHip || 0, 0, 0]}>
            <group position={[0, -0.20, 0]}>
              <UpperLeg />
            </group>
            <group position={[0, -0.40, 0]}>
              <JointBlend radius={0.04} color={SKIN_COLOR} />
              <group rotation={[r.leftKnee || 0, 0, 0]}>
                <group position={[0, -0.19, 0]}>
                  <LowerLeg />
                </group>
                <group position={[0, -0.38, 0]}>
                  <Foot />
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ── Right Leg (animated) ── */}
        <group position={[-0.08, -0.08, 0]}>
          <JointBlend radius={0.055} color={SKIN_COLOR} />
          <group rotation={[r.rightHip || 0, 0, 0]}>
            <group position={[0, -0.20, 0]}>
              <UpperLeg glowIntensity={quadIntensity} />
            </group>
            <group position={[0, -0.40, 0]}>
              <JointBlend radius={0.04} color={SKIN_COLOR} />
              {/* Knee glow */}
              {quadIntensity > 0.3 && (
                <mesh>
                  <sphereGeometry args={[0.05, 12, 10]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive={new THREE.Color('#10b981').multiplyScalar(quadIntensity)}
                    emissiveIntensity={quadIntensity * 0.8}
                    transparent
                    opacity={quadIntensity * 0.25}
                  />
                </mesh>
              )}
              <group rotation={[r.rightKnee || 0, 0, 0]}>
                <group position={[0, -0.19, 0]}>
                  <LowerLeg />
                </group>
                <group ref={rightAnkleRef} position={[0, -0.38, 0]}>
                  <Foot />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ── Chair ── */}
      {exerciseData.props?.showChair && (
        <Chair height={seatH} />
      )}

      {/* ── Ground plane ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

export { interpolateKeyframes, deg2rad };
