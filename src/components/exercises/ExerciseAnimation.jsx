import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Play, Pause, Gauge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';

// ─── Lazy-load 3D components (heavy: three.js + remotion) ──────────────────
const ExercisePlayer = lazy(() => import('./3d/ExercisePlayer'));

// ─── 3D NEMEX exercise registry ────────────────────────────────────────────
import SeatedKneeExtensionData from './3d/exercises/SeatedKneeExtension';

const EXERCISES_3D = {
  seated_knee_extension: SeatedKneeExtensionData,
};

// Match exercise titles to 3D exercise data
const TITLE_MATCHERS_3D = [
  { key: 'seated_knee_extension', patterns: ['seated knee extension', 'zittend knie-extensie', 'zittend knie extensie', 'knie-extensie zittend'] },
];

// ─── Colors ─────────────────────────────────────────────────────────────────

const C = {
  body: '#9ca3af',     // gray-400
  active: '#10b981',   // emerald-500
  joint: '#3b82f6',    // blue-500
  ground: '#e5e7eb',   // gray-200
  bg: '#f9fafb',       // gray-50
};

const SPEEDS = [0.5, 1, 1.5];

// ─── Shared SVG parts ───────────────────────────────────────────────────────

function Head({ cx, cy, r = 12 }) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.body} strokeWidth={2.5} />;
}

function Joint({ cx, cy }) {
  return <circle cx={cx} cy={cy} r={3} fill={C.joint} />;
}

function Ground({ y = 170 }) {
  return <line x1={20} y1={y} x2={180} y2={y} stroke={C.ground} strokeWidth={2} strokeDasharray="6 4" />;
}

function Limb({ d, color = C.body, ...props }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function AnimLimb({ variants, color = C.body, duration, speed }) {
  return (
    <motion.path
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={variants}
      animate="animate"
      transition={{
        duration: duration / speed,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    />
  );
}

// ─── 10 Exercise Animations ─────────────────────────────────────────────────

function SeatedKneeExtension({ speed }) {
  // Seated on chair, extending lower leg
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground y={170} />
      {/* Chair */}
      <path d="M50,100 L50,170 M110,100 L110,170 M45,100 L115,100" stroke={C.ground} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Limb d="M80,60 L80,100" />
      <Head cx={80} cy={48} />
      {/* Arms resting on thighs */}
      <Limb d="M80,70 L60,95" />
      <Limb d="M80,70 L100,95" />
      {/* Upper legs (seated) */}
      <Limb d="M80,100 L55,105" />
      <Limb d="M80,100 L105,105" />
      {/* Left lower leg (static) */}
      <Limb d="M55,105 L55,170" />
      {/* Right lower leg (animated - extending) */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M105,105 L105,170',  // bent down
              'M105,105 L145,110',  // extended forward
            ],
          },
        }}
        color={C.active}
        duration={2}
        speed={speed}
      />
      <Joint cx={105} cy={105} />
      <Joint cx={55} cy={105} />
    </svg>
  );
}

function StandingHipAbduction({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      <Head cx={100} cy={28} />
      {/* Torso */}
      <Limb d="M100,40 L100,100" />
      {/* Arms holding something (wall/chair) */}
      <Limb d="M100,55 L70,70" />
      <Limb d="M100,55 L130,70" />
      {/* Standing leg */}
      <Limb d="M100,100 L95,135 L95,170" />
      {/* Moving leg - abduction */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M100,100 L105,135 L105,170',
              'M100,100 L140,125 L155,155',
            ],
          },
        }}
        color={C.active}
        duration={1.8}
        speed={speed}
      />
      <Joint cx={100} cy={100} />
    </svg>
  );
}

function WallSquat({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Wall */}
      <line x1={40} y1={10} x2={40} y2={170} stroke={C.ground} strokeWidth={3} />
      {/* Animated body sliding down wall */}
      <motion.g
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 3 / speed, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Head cx={55} cy={30} />
        {/* Back against wall */}
        <Limb d="M55,42 L45,95" />
        {/* Arms at sides */}
        <Limb d="M50,55 L35,75" />
        <Limb d="M50,55 L65,75" />
      </motion.g>
      {/* Upper legs animated */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M45,95 L80,100 M45,95 L80,100',
              'M45,125 L95,125 M45,125 L95,125',
            ],
          },
        }}
        color={C.active}
        duration={3}
        speed={speed}
      />
      {/* Lower legs */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M80,100 L75,170 M80,100 L85,170',
              'M95,125 L85,170 M95,125 L95,170',
            ],
          },
        }}
        color={C.body}
        duration={3}
        speed={speed}
      />
    </svg>
  );
}

function HeelRaises({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      <motion.g
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 1.5 / speed, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Head cx={100} cy={25} />
        <Limb d="M100,37 L100,95" />
        {/* Arms */}
        <Limb d="M100,55 L75,75" />
        <Limb d="M100,55 L125,75" />
        {/* Legs straight */}
        <Limb d="M100,95 L90,150" />
        <Limb d="M100,95 L110,150" />
        <Joint cx={90} cy={150} />
        <Joint cx={110} cy={150} />
      </motion.g>
      {/* Feet - animated on toes */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M82,170 L98,170 M102,170 L118,170',  // flat
              'M85,150 L92,158 M108,150 L115,158',   // on toes
            ],
          },
        }}
        color={C.active}
        duration={1.5}
        speed={speed}
      />
    </svg>
  );
}

function SeatedLegPress({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Chair back */}
      <path d="M30,40 L30,120 L90,120" stroke={C.ground} strokeWidth={2} fill="none" />
      <Head cx={50} cy={35} />
      {/* Torso reclined */}
      <Limb d="M50,47 L55,120" />
      {/* Arms */}
      <Limb d="M52,70 L35,90" />
      <Limb d="M52,70 L70,90" />
      {/* Legs - press motion */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M55,120 L100,110 L100,145',    // bent
              'M55,120 L120,100 L165,105',     // extended
            ],
          },
        }}
        color={C.active}
        duration={2}
        speed={speed}
      />
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M55,120 L100,125 L100,155',
              'M55,120 L120,115 L165,118',
            ],
          },
        }}
        color={C.active}
        duration={2}
        speed={speed}
      />
      <Joint cx={55} cy={120} />
    </svg>
  );
}

function Bridge({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Person lying, hips rising */}
      {/* Head on ground */}
      <Head cx={40} cy={155} r={10} />
      {/* Arms flat */}
      <Limb d="M50,155 L25,165" />
      <Limb d="M50,155 L25,145" />
      {/* Torso + hips animated up */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M50,155 L100,160',    // flat
              'M50,155 L100,125',    // hips up
            ],
          },
        }}
        color={C.body}
        duration={2.2}
        speed={speed}
      />
      {/* Upper legs */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M100,160 L130,155',
              'M100,125 L130,140',
            ],
          },
        }}
        color={C.active}
        duration={2.2}
        speed={speed}
      />
      {/* Lower legs (feet on ground) */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M130,155 L140,170',
              'M130,140 L140,170',
            ],
          },
        }}
        color={C.body}
        duration={2.2}
        speed={speed}
      />
      {/* Second leg */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M100,160 L135,160 L145,170',
              'M100,125 L135,145 L145,170',
            ],
          },
        }}
        color={C.active}
        duration={2.2}
        speed={speed}
      />
    </svg>
  );
}

function StepUps({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Step/box */}
      <rect x={80} y={140} width={60} height={30} rx={3} fill="none" stroke={C.ground} strokeWidth={2} />
      {/* Animated figure stepping up */}
      <motion.g
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 2 / speed, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Head cx={100} cy={30} />
        <Limb d="M100,42 L100,95" />
        <Limb d="M100,55 L80,75" />
        <Limb d="M100,55 L120,75" />
      </motion.g>
      {/* Stepping leg */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M100,95 L110,130 L110,170',   // on ground
              'M100,70 L110,100 L110,140',    // on step
            ],
          },
        }}
        color={C.active}
        duration={2}
        speed={speed}
      />
      {/* Trailing leg */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M100,95 L90,135 L90,170',
              'M100,70 L90,110 L85,145',
            ],
          },
        }}
        color={C.body}
        duration={2}
        speed={speed}
      />
    </svg>
  );
}

function QuadricepsStretch({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      <Head cx={90} cy={25} />
      <Limb d="M90,37 L90,95" />
      {/* Standing leg */}
      <Limb d="M90,95 L85,135 L85,170" />
      {/* Left arm on wall for balance */}
      <Limb d="M90,55 L60,55" />
      {/* Wall */}
      <line x1={55} y1={30} x2={55} y2={170} stroke={C.ground} strokeWidth={2} />
      {/* Right arm reaching back to grab foot */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M90,55 L115,75',
              'M90,55 L120,95',
            ],
          },
        }}
        color={C.body}
        duration={2.5}
        speed={speed}
      />
      {/* Stretching leg - bending back */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M90,95 L105,130 L105,170',   // straight
              'M90,95 L110,110 L120,90',     // fully bent back
            ],
          },
        }}
        color={C.active}
        duration={2.5}
        speed={speed}
      />
      <Joint cx={90} cy={95} />
    </svg>
  );
}

function HamstringStretch({ speed }) {
  // Seated forward fold
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Legs stretched out on ground */}
      <Limb d="M70,155 L160,155" color={C.active} />
      <Limb d="M70,160 L160,160" color={C.active} />
      {/* Feet */}
      <Limb d="M160,150 L160,165" />
      {/* Torso - bending forward */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M70,155 L70,80',          // upright
              'M70,155 L130,135',        // folded forward
            ],
          },
        }}
        color={C.body}
        duration={3}
        speed={speed}
      />
      {/* Head */}
      <motion.circle
        cx={70} cy={68}
        r={10}
        fill="none"
        stroke={C.body}
        strokeWidth={2.5}
        animate={{ cx: [70, 135], cy: [68, 120] }}
        transition={{ duration: 3 / speed, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      {/* Arms reaching for toes */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M70,110 L55,135 M70,110 L85,135',
              'M120,140 L150,148 M120,140 L150,155',
            ],
          },
        }}
        color={C.body}
        duration={3}
        speed={speed}
      />
      <Joint cx={70} cy={155} />
    </svg>
  );
}

function WalkingLunges({ speed }) {
  return (
    <svg viewBox="0 0 200 190" className="w-full h-full">
      <Ground />
      {/* Animated lunge figure */}
      <motion.g
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 2.5 / speed, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Head cx={95} cy={28} />
        {/* Arms swinging */}
        <AnimLimb
          variants={{
            animate: {
              d: [
                'M95,50 L75,80 M95,50 L115,80',
                'M95,50 L115,80 M95,50 L75,80',
              ],
            },
          }}
          color={C.body}
          duration={2.5}
          speed={speed}
        />
      </motion.g>
      {/* Torso dipping */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M95,40 L95,100',
              'M100,40 L100,110',
            ],
          },
        }}
        color={C.body}
        duration={2.5}
        speed={speed}
      />
      {/* Front leg lunging */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M95,100 L120,135 L120,170',
              'M100,110 L140,140 L140,170',
            ],
          },
        }}
        color={C.active}
        duration={2.5}
        speed={speed}
      />
      {/* Back leg */}
      <AnimLimb
        variants={{
          animate: {
            d: [
              'M95,100 L70,135 L70,170',
              'M100,110 L60,145 L55,170',
            ],
          },
        }}
        color={C.active}
        duration={2.5}
        speed={speed}
      />
    </svg>
  );
}

// ─── Animation Registry ─────────────────────────────────────────────────────

const ANIMATIONS = {
  seated_knee_extension: SeatedKneeExtension,
  standing_hip_abduction: StandingHipAbduction,
  wall_squat: WallSquat,
  heel_raises: HeelRaises,
  seated_leg_press: SeatedLegPress,
  bridge: Bridge,
  step_ups: StepUps,
  quadriceps_stretch: QuadricepsStretch,
  hamstring_stretch: HamstringStretch,
  walking_lunges: WalkingLunges,
};

// Title-based matching (fuzzy, checks if exercise title contains key words)
const TITLE_MATCHERS = [
  { key: 'seated_knee_extension', patterns: ['knee extension', 'been strekken', 'kniebuigingen', 'knee bends'] },
  { key: 'standing_hip_abduction', patterns: ['hip abduction', 'been zijwaarts', 'side leg', 'beenheffen zijwaarts'] },
  { key: 'wall_squat', patterns: ['wall squat', 'muur-squat', 'muur squat'] },
  { key: 'heel_raises', patterns: ['heel raise', 'calf raise', 'hielhef', 'kuithef'] },
  { key: 'seated_leg_press', patterns: ['leg press', 'been druk', 'been duwen'] },
  { key: 'bridge', patterns: ['bridge', 'brug', 'hip thrust'] },
  { key: 'step_ups', patterns: ['step-up', 'step up', 'opstap'] },
  { key: 'quadriceps_stretch', patterns: ['quadriceps stretch', 'quad stretch', 'quadriceps rek'] },
  { key: 'hamstring_stretch', patterns: ['hamstring stretch', 'hamstring rek', 'hamstring'] },
  { key: 'walking_lunges', patterns: ['lunge', 'uitvalspas', 'walking lunge'] },
];

export function getAnimationKey(exercise) {
  if (exercise.animation_key && ANIMATIONS[exercise.animation_key]) {
    return exercise.animation_key;
  }
  const titleLower = `${exercise.title_en || ''} ${exercise.title_nl || ''}`.toLowerCase();
  for (const { key, patterns } of TITLE_MATCHERS) {
    if (patterns.some(p => titleLower.includes(p))) return key;
  }
  return null;
}

function get3DExerciseData(exercise) {
  const titleLower = `${exercise.title_en || ''} ${exercise.title_nl || ''}`.toLowerCase();
  for (const { key, patterns } of TITLE_MATCHERS_3D) {
    if (patterns.some(p => titleLower.includes(p))) return EXERCISES_3D[key];
  }
  return null;
}

export function hasAnimation(exercise) {
  return !!getAnimationKey(exercise) || !!get3DExerciseData(exercise);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ExerciseAnimation({ exercise, sets, reps, duration }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1); // index into SPEEDS
  const speed = SPEEDS[speedIdx];

  // Check for 3D exercise first, then fall back to SVG
  const exerciseData3D = useMemo(() => get3DExerciseData(exercise), [exercise]);
  const animKey = useMemo(() => getAnimationKey(exercise), [exercise]);
  const AnimComponent = animKey ? ANIMATIONS[animKey] : null;

  // Render 3D player for NEMEX exercises
  if (exerciseData3D) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <ExercisePlayer exerciseData={exerciseData3D} />
      </Suspense>
    );
  }

  // Fall back to SVG animation
  if (!AnimComponent) return null;

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);

  return (
    <div className="space-y-2">
      {/* Animation area */}
      <div className="relative bg-gray-50 rounded-xl border border-gray-100 overflow-hidden aspect-[4/3]">
        {playing ? (
          <AnimComponent speed={speed} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Play className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlaying(!playing)}
            className="h-8 w-8 p-0"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleSpeed}
            className="h-8 px-2 text-xs gap-1"
          >
            <Gauge className="w-3 h-3" />
            {speed}x
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          {sets != null && reps != null && (
            <Badge variant="secondary" className="text-xs">{sets}x{reps}</Badge>
          )}
          {duration != null && (
            <Badge variant="secondary" className="text-xs">{duration} min</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
