import { CategoryMotionPreset } from './category-visual-registry';

export const MOTION_TOKENS = {
  duration: {
    fast: 0.22, // 220ms
    normal: 0.32, // 320ms
    entrance: 0.42, // 420ms
  },
  easing: [0.16, 1, 0.3, 1] as const, // Custom Airbnb/Apple-like cubic-bezier curve
  scale: {
    idle: 1,
    pressed: 0.97,
    selected: 1.04,
  },
};

export interface MotionBehavior {
  hover: {
    scale: number;
    x?: number;
    y?: number;
    rotate?: number;
  };
  pressed: {
    scale: number;
  };
}

export const PRESET_BEHAVIORS: Record<CategoryMotionPreset, MotionBehavior> = {
  solar: {
    hover: {
      scale: 1.03,
      y: -2,
      rotate: 0.8, // 0.8 deg micro-rotation
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
  mobility: {
    hover: {
      scale: 1.025,
      x: 2,
      y: -1,
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
  energyMarket: {
    hover: {
      scale: 1.025,
      y: -2,
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
  charging: {
    hover: {
      scale: 1.025,
      y: -2,
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
  hub: {
    hover: {
      scale: 1.02,
      y: -2,
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
  neutral: {
    hover: {
      scale: 1.02,
      y: -2,
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
    },
  },
};
