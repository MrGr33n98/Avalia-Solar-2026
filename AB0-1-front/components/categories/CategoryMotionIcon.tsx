'use client';

import { useReducedMotion, motion } from 'framer-motion';
import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';
import { PRESET_BEHAVIORS, MOTION_TOKENS } from '@/lib/categories/category-motion';
import { CategoryIcon, CategoryIconProps } from './CategoryIcon';

export interface CategoryMotionIconProps extends CategoryIconProps {
  motionMode?: 'none' | 'interactive' | 'entrance' | 'selected';
}

export function CategoryMotionIcon({
  motionMode = 'interactive',
  ...props
}: CategoryMotionIconProps) {
  const shouldReduceMotion = useReducedMotion();
  const visual = resolveCategoryVisual(props.slug, props.name, props.visualKey);
  const preset = visual?.motionPreset || 'neutral';
  const behavior = PRESET_BEHAVIORS[preset];

  // Se reduced-motion estiver ativo ou modo for 'none', renderiza o ícone estático direto
  if (shouldReduceMotion || motionMode === 'none') {
    return <CategoryIcon {...props} />;
  }

  // Definição dos estados de animação (variants) baseados no preset semântico
  const containerVariants = {
    idle: {
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.02))',
    },
    hover: {
      scale: behavior.hover.scale,
      x: behavior.hover.x || 0,
      y: behavior.hover.y || 0,
      rotate: behavior.hover.rotate || 0,
      filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.06))',
      transition: {
        duration: MOTION_TOKENS.duration.normal,
        ease: MOTION_TOKENS.easing,
      },
    },
    pressed: {
      scale: MOTION_TOKENS.scale.pressed,
      x: 0,
      y: 0,
      rotate: 0,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))',
      transition: {
        duration: MOTION_TOKENS.duration.fast,
        ease: MOTION_TOKENS.easing,
      },
    },
    selected: {
      scale: [MOTION_TOKENS.scale.pressed, MOTION_TOKENS.scale.selected, 1],
      transition: {
        duration: MOTION_TOKENS.duration.normal,
        ease: MOTION_TOKENS.easing,
      },
    },
    entrance: {
      opacity: [0, 1],
      scale: [0.96, 1],
      y: [4, 0],
      transition: {
        duration: MOTION_TOKENS.duration.entrance,
        ease: MOTION_TOKENS.easing,
      },
    },
  };

  const isInteractive = motionMode === 'interactive';
  const isSelected = motionMode === 'selected';
  const isEntrance = motionMode === 'entrance';

  // Highlight radial sutil para a categoria de recarga (charging)
  const isCharging = preset === 'charging';

  return (
    <motion.div
      variants={containerVariants}
      initial={isEntrance ? 'entrance' : 'idle'}
      animate={isSelected ? 'selected' : 'idle'}
      whileHover={isInteractive ? 'hover' : undefined}
      whileTap={isInteractive ? 'pressed' : undefined}
      className="relative flex items-center justify-center"
    >
      {/* Glow radial extremamente discreto atrás de carregadores */}
      {isCharging && isInteractive && (
        <span
          className="absolute inset-[-8px] rounded-full bg-radial-gradient opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
      )}
      <CategoryIcon {...props} />
    </motion.div>
  );
}
