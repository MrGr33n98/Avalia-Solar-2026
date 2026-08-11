export const OPEN_COMPARISON_DOCK_EVENT = 'avalia:open-comparison-dock';
export const OPEN_COMPARISON_MODAL_EVENT = 'avalia:open-comparison-modal';
export const OPEN_ASSISTANT_COMPACT_EVENT = 'avalia:open-assistant-compact';

export function openComparisonDock() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_COMPARISON_DOCK_EVENT));
}

export function openComparisonModal() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_COMPARISON_MODAL_EVENT));
}

export function notifyAssistantCompactOpen() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_COMPACT_EVENT));
}
