import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// ─── Body dimensions (meters, approximate human proportions) ───────────────
const BODY = {
  head: { radius: 0.1 },
  neck: { length: 0.06, radius: 0.04 },
  torso: { length: 0.45, radiusTop: 0.15, radiusBottom: 0.12 },
  upperArm: { length: 0.28, radius: 0.035 },
  forearm: { length: 0.25, radius: 0.03 },
  upperLeg: { length: 0.42, radius: 0.06 },
  lowerLeg: { length: 0.40, radius: 0.045 },
  foot: { length: 0.22, height: 0.06, width: 0.08 },
  joint: { radius: 0.025 },
};

const BODY_COLOR = '#d1d5db';       // gray-300 — clean, stylized
const JOINT_COLOR = '#9ca3af';      // gray-400
const SKIN_ROUGHNESS = 0.7;
const SKIN_METALNESS = 0.05;

// ─── Capsule helper (a cylinder with rounded ends) ─────────────────────────
function Capsule({ length, radius, color = BODY_COLOR, ...props }) {
  return (
    <mesh {...props}>
      <capsuleGeometry args={[radius, length, 8, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={SKIN_ROUGHNESS}
        metalness={SKIN_METALNESS}
      />
    </mesh>
  );
}

function JointSphere({ radius = BODY.joint.radius, color = JOINT_COLOR, ...props }) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

// ─── Interpolate keyframes ─────────────────────────────────────────────────
function interpolateKeyframes(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 0;
  if (t <= keyframes[0].t) return keyframes[0].angle;
  if (t >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1].angle;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (t >= a.t && t <= b.t) {
      const local = (t - a.t) / (b.t - a.t);
      // Smooth step for natural motion
      const smooth = local * local * (3 - 2 * local);
      return a.angle + (b.angle - a.angle) * smooth;
    }
  }
  return keyframes[keyframes.length - 1].angle;
}

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

// ─── Main HumanModel component ────────────────────────────────────────────
export default function HumanModel({
  exerciseData,
  normalizedTime = 0,
  muscleIntensities = {},
  onJointPosition,
}) {
  const groupRef = useRef();

  // Compute joint angles from keyframes
  const angles = useMemo(() => {
    const base = exerciseData.basePose || {};
    const kf = exerciseData.keyframes || {};
    const result = { ...base };

    for (const [joint, frames] of Object.entries(kf)) {
      result[joint] = interpolateKeyframes(frames, normalizedTime);
    }
    return result;
  }, [exerciseData, normalizedTime]);

  // Convert to radians
  const r = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(angles)) {
      out[k] = deg2rad(v);
    }
    return out;
  }, [angles]);

  // Muscle glow color for quadriceps
  const quadIntensity = muscleIntensities.quadricepsRight || 0;
  const glowColor = useMemo(() => {
    return new THREE.Color('#10b981').multiplyScalar(quadIntensity * 2);
  }, [quadIntensity]);

  // Report ankle position for trail
  const rightAnkleRef = useRef();
  React.useEffect(() => {
    if (rightAnkleRef.current && onJointPosition) {
      const pos = new THREE.Vector3();
      rightAnkleRef.current.getWorldPosition(pos);
      onJointPosition('rightAnkle', pos);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Pelvis (root) — positioned at seat height ── */}
      <group position={[0, exerciseData.props?.chairHeight || 0.45, 0]}>

        {/* ── Torso ── */}
        <group rotation={[r.torsoTilt || 0, 0, 0]}>
          <Capsule
            length={BODY.torso.length}
            radius={BODY.torso.radiusTop}
            position={[0, BODY.torso.length / 2, 0]}
          />

          {/* ── Neck + Head ── */}
          <group position={[0, BODY.torso.length + BODY.neck.length, 0]}>
            <Capsule length={BODY.neck.length} radius={BODY.neck.radius} />
            <mesh position={[0, BODY.neck.length / 2 + BODY.head.radius, 0]}>
              <sphereGeometry args={[BODY.head.radius, 20, 16]} />
              <meshStandardMaterial
                color={BODY_COLOR}
                roughness={SKIN_ROUGHNESS}
                metalness={SKIN_METALNESS}
              />
            </mesh>
          </group>

          {/* ── Left Arm ── */}
          <group position={[BODY.torso.radiusTop + 0.01, BODY.torso.length - 0.02, 0]}>
            <JointSphere radius={0.035} />
            <group rotation={[r.leftShoulder || 0, 0, 0]}>
              <Capsule
                length={BODY.upperArm.length}
                radius={BODY.upperArm.radius}
                position={[0, -BODY.upperArm.length / 2, 0]}
              />
              <group position={[0, -BODY.upperArm.length, 0]}>
                <JointSphere />
                <group rotation={[r.leftElbow || 0, 0, 0]}>
                  <Capsule
                    length={BODY.forearm.length}
                    radius={BODY.forearm.radius}
                    position={[0, -BODY.forearm.length / 2, 0]}
                  />
                </group>
              </group>
            </group>
          </group>

          {/* ── Right Arm ── */}
          <group position={[-BODY.torso.radiusTop - 0.01, BODY.torso.length - 0.02, 0]}>
            <JointSphere radius={0.035} />
            <group rotation={[r.rightShoulder || 0, 0, 0]}>
              <Capsule
                length={BODY.upperArm.length}
                radius={BODY.upperArm.radius}
                position={[0, -BODY.upperArm.length / 2, 0]}
              />
              <group position={[0, -BODY.upperArm.length, 0]}>
                <JointSphere />
                <group rotation={[r.rightElbow || 0, 0, 0]}>
                  <Capsule
                    length={BODY.forearm.length}
                    radius={BODY.forearm.radius}
                    position={[0, -BODY.forearm.length / 2, 0]}
                  />
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ── Left Leg (static, planted) ── */}
        <group position={[0.08, 0, 0]}>
          <JointSphere radius={0.04} />
          <group rotation={[r.leftHip || 0, 0, 0]}>
            <Capsule
              length={BODY.upperLeg.length}
              radius={BODY.upperLeg.radius}
              position={[0, -BODY.upperLeg.length / 2, 0]}
            />
            <group position={[0, -BODY.upperLeg.length, 0]}>
              <JointSphere radius={0.035} />
              <group rotation={[r.leftKnee || 0, 0, 0]}>
                <Capsule
                  length={BODY.lowerLeg.length}
                  radius={BODY.lowerLeg.radius}
                  position={[0, -BODY.lowerLeg.length / 2, 0]}
                />
                {/* Left foot */}
                <group position={[0, -BODY.lowerLeg.length, 0]}>
                  <JointSphere radius={0.03} />
                  <mesh position={[0, -BODY.foot.height / 2, BODY.foot.length / 4]}>
                    <boxGeometry args={[BODY.foot.width, BODY.foot.height, BODY.foot.length]} />
                    <meshStandardMaterial color={BODY_COLOR} roughness={SKIN_ROUGHNESS} metalness={SKIN_METALNESS} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ── Right Leg (animated) ── */}
        <group position={[-0.08, 0, 0]}>
          <JointSphere radius={0.04} />
          <group rotation={[r.rightHip || 0, 0, 0]}>
            {/* Upper leg with muscle glow */}
            <group position={[0, -BODY.upperLeg.length / 2, 0]}>
              <Capsule
                length={BODY.upperLeg.length}
                radius={BODY.upperLeg.radius}
              />
              {/* Muscle glow overlay */}
              {quadIntensity > 0.05 && (
                <mesh>
                  <capsuleGeometry args={[BODY.upperLeg.radius + 0.008, BODY.upperLeg.length, 8, 16]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive={glowColor}
                    emissiveIntensity={quadIntensity * 1.5}
                    transparent
                    opacity={quadIntensity * 0.45}
                    roughness={0.3}
                    metalness={0.0}
                  />
                </mesh>
              )}
            </group>

            <group position={[0, -BODY.upperLeg.length, 0]}>
              <JointSphere radius={0.035} />
              {/* Knee joint highlight when active */}
              {quadIntensity > 0.3 && (
                <mesh>
                  <sphereGeometry args={[0.045, 16, 12]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive={glowColor}
                    emissiveIntensity={quadIntensity}
                    transparent
                    opacity={quadIntensity * 0.3}
                  />
                </mesh>
              )}
              <group rotation={[r.rightKnee || 0, 0, 0]}>
                <Capsule
                  length={BODY.lowerLeg.length}
                  radius={BODY.lowerLeg.radius}
                  position={[0, -BODY.lowerLeg.length / 2, 0]}
                />
                {/* Right ankle — tracked for trail */}
                <group ref={rightAnkleRef} position={[0, -BODY.lowerLeg.length, 0]}>
                  <JointSphere radius={0.03} />
                  <mesh position={[0, -BODY.foot.height / 2, BODY.foot.length / 4]}>
                    <boxGeometry args={[BODY.foot.width, BODY.foot.height, BODY.foot.length]} />
                    <meshStandardMaterial color={BODY_COLOR} roughness={SKIN_ROUGHNESS} metalness={SKIN_METALNESS} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ── Chair (simple wireframe-ish) ── */}
      {exerciseData.props?.showChair && (
        <Chair height={exerciseData.props.chairHeight || 0.45} />
      )}

      {/* ── Ground plane ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#f9fafb" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Chair component ───────────────────────────────────────────────────────
function Chair({ height }) {
  const seatDepth = 0.4;
  const seatWidth = 0.45;
  const seatThickness = 0.03;
  const legRadius = 0.015;
  const backHeight = 0.4;

  return (
    <group position={[0, 0, -0.05]}>
      {/* Seat */}
      <mesh position={[0, height, -seatDepth / 2 + 0.05]}>
        <boxGeometry args={[seatWidth, seatThickness, seatDepth]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, height + backHeight / 2, -seatDepth + 0.05]}>
        <boxGeometry args={[seatWidth, backHeight, seatThickness]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* 4 Legs */}
      {[
        [seatWidth / 2 - 0.03, 0.05],
        [-seatWidth / 2 + 0.03, 0.05],
        [seatWidth / 2 - 0.03, -seatDepth + 0.08],
        [-seatWidth / 2 + 0.03, -seatDepth + 0.08],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]}>
          <cylinderGeometry args={[legRadius, legRadius, height, 8]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Export helper ──────────────────────────────────────────────────────────
export { interpolateKeyframes, deg2rad };
