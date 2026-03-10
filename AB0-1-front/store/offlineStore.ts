import { create } from 'zustand';

interface OfflineStoreState {
  isOnline: boolean;
  swSupported: boolean;
  swRegistered: boolean;
  backgroundSyncSupported: boolean;
  updateAvailable: boolean;
  queueSize: number;
  lastSyncAt: number | null;
  setOnline: (isOnline: boolean) => void;
  setSwSupported: (swSupported: boolean) => void;
  setSwRegistered: (swRegistered: boolean) => void;
  setBackgroundSyncSupported: (backgroundSyncSupported: boolean) => void;
  setUpdateAvailable: (updateAvailable: boolean) => void;
  setQueueSize: (queueSize: number) => void;
  setLastSyncAt: (lastSyncAt: number) => void;
}

export const useOfflineStore = create<OfflineStoreState>((set) => ({
  isOnline: true,
  swSupported: false,
  swRegistered: false,
  backgroundSyncSupported: false,
  updateAvailable: false,
  queueSize: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSwSupported: (swSupported) => set({ swSupported }),
  setSwRegistered: (swRegistered) => set({ swRegistered }),
  setBackgroundSyncSupported: (backgroundSyncSupported) =>
    set({ backgroundSyncSupported }),
  setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),
  setQueueSize: (queueSize) => set({ queueSize }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
