'use client';

// P0 PERF FIX: removido framer-motion (~31KB gzip) do critical path da category page.
// Animações de hover/entrance implementadas via CSS puro sem impacto no bundle inicial.
import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';
import { cn } from '@/lib/utils';
import { CategoryIcon, CategoryIconProps } from './CategoryIcon';

export interface CategoryMotionIconProps extends CategoryIconProps {
  motionMode?: 'none' | 'interactive' | 'entrance' | 'selected';
}

export function CategoryMotionIcon({
  motionMode = 'interactive',
  className,
  ...props
}: CategoryMotionIconProps) {
  const visual = resolveCategoryVisual(props.slug, props.name, props.visualKey);
  const preset = visual?.motionPreset || 'neutral';

  // Se modo for 'none', renderiza o ícone estático direto
  if (motionMode === 'none') {
    return <CategoryIcon {...props} className={className} />;
  }

  const fillsAvailableSpace = props.fill || props.size === 'fill';

  // Animações via CSS — zero JS, zero framer-motion no bundle
  const motionClass = [
    'relative flex items-center justify-center',
    // Entrance: fade-in + scale via keyframes CSS
    motionMode === 'entrance' && 'animate-category-icon-entrance',
    // Interactive: hover scale via CSS transition + group hover (sem JS)
    motionMode === 'interactive' && 'transition-transform duration-200 ease-out hover:scale-105 active:scale-95',
    // Selected: scale pulse via CSS animation
    motionMode === 'selected' && 'animate-category-icon-selected',
    fillsAvailableSpace && 'h-full w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Glow radial para charging — apenas via CSS, sem framer-motion
  const isCharging = preset === 'charging';
  const isInteractive = motionMode === 'interactive';

  return (
    <div className={motionClass}>
      {/* Glow radial extremamente discreto atrás de carregadores */}
      {isCharging && isInteractive && (
        <span
          className="absolute inset-[-8px] rounded-full opacity-0 transition-opacity duration-300 pointer-events-none hover:opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
      )}
      <CategoryIcon {...props} />
    </div>
  );
}
