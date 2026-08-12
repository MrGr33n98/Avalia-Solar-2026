import { useEffect, useSyncExternalStore } from 'react';

export type CommunicationSurface = 'none' | 'mobivolt' | 'p2p' | 'comparison';
let activeSurface: CommunicationSurface = 'none';
const listeners = new Set<() => void>();

export const CommunicationSurfaceManager = {
  get active() { return activeSurface; },
  open(surface: Exclude<CommunicationSurface, 'none'>) { activeSurface = surface; listeners.forEach((listener) => listener()); },
  close(surface: Exclude<CommunicationSurface, 'none'>) { if (activeSurface !== surface) return; activeSurface = 'none'; listeners.forEach((listener) => listener()); },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
};

export function useCommunicationSurface(surface: Exclude<CommunicationSurface, 'none'>) {
  const active = useSyncExternalStore(CommunicationSurfaceManager.subscribe, () => CommunicationSurfaceManager.active, () => 'none' as CommunicationSurface);
  useEffect(() => () => CommunicationSurfaceManager.close(surface), [surface]);
  return { activeSurface: active, isActive: active === surface, isBlocked: active !== 'none' && active !== surface };
}
