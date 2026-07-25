/**
 * Floating widgets positioning utilities for mobile layout
 * Ensures proper vertical stacking with 12px minimum spacing
 */

export const FLOATING_WIDGET_POSITIONS = {
  // Z-index hierarchy
  Z_INDEX: {
    COMPARISON: 50,
    MOBIVOLT: 60, 
    CHAT: 70,
    EXPANDED_BUBBLE: 80,
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
 * CSS classes for mobile floating widget positions
 * Uses CSS custom properties for responsive positioning
 */
export const MOBILE_POSITION_CLASSES = {
  comparison: 'bottom-[calc(var(--mobile-nav-height,4rem)+env(safe-area-inset-bottom)+16px)] md:bottom-28',
  mobivolt: 'bottom-[calc(var(--mobile-nav-height,4rem)+env(safe-area-inset-bottom)+72px)]',
  chat: 'bottom-[calc(var(--mobile-nav-height,4rem)+env(safe-area-inset-bottom)+128px)] md:bottom-0'
} as const;