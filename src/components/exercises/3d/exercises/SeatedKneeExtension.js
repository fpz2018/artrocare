// NEMEX Exercise: Seated Knee Extension (Zittend knie-extensie)
// Targets: Quadriceps (right leg)

export default {
  id: 'seated-knee-extension',
  duration: 4, // seconds per cycle
  fps: 30,

  // Camera setup — slightly right-front view to see knee movement
  camera: {
    position: [2.5, 1.2, 2.5],
    fov: 40,
    lookAt: [0, 0.6, 0],
  },

  // Base pose: seated on chair, torso upright
  basePose: {
    // Torso tilted slightly back (seated posture)
    torsoTilt: -5, // degrees from vertical

    // Left leg static (planted on ground, ~90° knee)
    leftHip: -90,
    leftKnee: 90,

    // Right hip stays at ~90° (seated), knee animates
    rightHip: -90,

    // Arms resting on thighs
    leftShoulder: -30,
    leftElbow: 90,
    rightShoulder: -30,
    rightElbow: 90,
  },

  // Animated keyframes — normalized time (0–1)
  keyframes: {
    rightKnee: [
      { t: 0.0, angle: 90 },   // fully bent (seated)
      { t: 0.35, angle: 5 },   // nearly fully extended
      { t: 0.55, angle: 5 },   // hold at top
      { t: 0.9, angle: 90 },   // return to bent
      { t: 1.0, angle: 90 },   // rest
    ],
  },

  // Muscle activation per phase (matches keyframe timing)
  muscles: {
    quadricepsRight: {
      mesh: 'rightUpperLeg',
      side: 'front',
      // Intensity at each keyframe time point
      intensity: [
        { t: 0.0, v: 0.1 },
        { t: 0.2, v: 0.8 },
        { t: 0.35, v: 1.0 },
        { t: 0.55, v: 0.9 },
        { t: 0.7, v: 0.4 },
        { t: 0.9, v: 0.1 },
        { t: 1.0, v: 0.1 },
      ],
      color: '#10b981', // emerald-500
    },
  },

  // Movement trail configuration
  trail: {
    joint: 'rightAnkle',
    color: '#3b82f6', // blue-500
    maxPoints: 60,
    lineWidth: 2,
  },

  // Chair props
  props: {
    showChair: true,
    chairHeight: 0.45, // meters from ground
  },

  // i18n keys (flat key format matching src/i18n/*.js)
  i18n: {
    title: 'nemex_seated_knee_extension_title',
    muscles: 'nemex_seated_knee_extension_muscles',
    tips: [
      'nemex_seated_knee_extension_tip1',
      'nemex_seated_knee_extension_tip2',
      'nemex_seated_knee_extension_tip3',
    ],
  },
};
