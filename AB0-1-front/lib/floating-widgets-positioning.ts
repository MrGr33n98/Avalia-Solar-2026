/**
 * Floating widgets positioning utilities for mobile layout
 * Ensures proper vertical stacking with 12px minimum spacing
 */

export const FLOATING_WIDGET_POSITIONS = {
  // Z-index hierarchy
  Z_INDEX: {
    COMPARISON: 75,
    MOBIVOLT: 60, 
    CHAT: 70,
    EXPANDED_BUBBLE: 80,
  },
  // Responsive sizing classes
  WIDGET_SIZES: {
    // Small screens (320px - 359px)
    sm: {
      chat: 'h-10 w-10',
      mobivolt: 'max-w-[280px]',
      comparison: 'h-10 min-w-[120px] max-w-[140px] text-xs'
    },
    // Medium screens (360px - 429px) - default mobile
    md: {
      chat: 'h-11 w-11',
      mobivolt: 'max-w-[320px]',
      comparison: 'h-11 min-w-[132px] max-w-[156px] text-sm'
    },
    // Large mobile screens (430px+)
    lg: {
      chat: 'h-12 w-12',
      mobivolt: 'max-w-[360px]',
      comparison: 'h-12 min-w-[144px] max-w-[168px] text-sm'
    }
  }
} as const;

/**
 * Get z-index for floating widgets
 */
export function getFloatingWidgetZIndex(widget: 'comparison' | 'mobivolt' | 'chat' | 'expanded'): number {
  const key = widget.toUpperCase() as keyof typeof FLOATING_WIDGET_POSITIONS.Z_INDEX;
  return FLOATING_WIDGET_POSITIONS.Z_INDEX[key] || 50;
}

/**
 * Get responsive size classes for floating widgets
 */
export function getFloatingWidgetSizeClasses(widget: 'chat' | 'mobivolt' | 'comparison'): string {
  const sizes = FLOATING_WIDGET_POSITIONS.WIDGET_SIZES;
  return [
    // Small screens
    `min-[320px]:max-[359px]:${sizes.sm[widget]}`,
    // Medium screens (default)
    sizes.md[widget],
    // Large screens  
    `min-[430px]:${sizes.lg[widget]}`
  ].join(' ');
}

/**
 * CSS classes for responsive floating widget positions (Mobile + Desktop)
 * Prevents overlap by explicitly stacking widgets vertically.
 */
export const WIDGET_POSITION_CLASSES = {
  // Chat / MobiVolt always sit at the very bottom right corner
  chat: 'bottom-[calc(var(--mobile-nav-height,_4rem)_+_env(safe-area-inset-bottom)_+_16px)] right-4 md:bottom-6 md:right-6',
  mobivolt: 'bottom-[calc(var(--mobile-nav-height,_4rem)_+_env(safe-area-inset-bottom)_+_16px)] right-4 md:bottom-6 md:right-6',
  
  // Comparison dock sits on the right, above the chat on both mobile and desktop
  comparison: 'bottom-[calc(var(--mobile-nav-height,_4rem)_+_env(safe-area-inset-bottom)_+_80px)] right-4 md:bottom-24 md:right-6 md:left-auto',
} as const;

/**
 * Responsive spacing utilities for preventing content overlap
 */
export const FLOATING_WIDGET_SPACING = {
  // Base spacing between widgets (12px minimum)
  baseGap: 'gap-3', // 12px
  // Responsive padding to prevent overlap with widget content
  contentPadding: {
    // Right padding to account for floating widgets when content is near the edge
    right: 'pr-20 sm:pr-24', // 80px on small, 96px on larger screens
    // Bottom padding to account for widget stack height
    bottom: 'pb-40 sm:pb-48', // 160px on small, 192px on larger screens
  }
} as const;