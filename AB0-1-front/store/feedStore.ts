import { create } from 'zustand';
import type { FeedItem } from '@/types/feed';

interface FeedState {
  trendingTopics: string[];
  setTrendingTopics: (topics: string[]) => void;
  items: FeedItem[];
  setItems: (items: FeedItem[]) => void;
  prependPublication: (pub: FeedItem) => void;
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  trendingTopics: [
    '#InversoresHibridos',
    '#MercadoLivreEnergia',
    '#BateriasLithium',
    '#RegulacaoANEEL',
  ],
  setTrendingTopics: (topics) => set({ trendingTopics: topics }),
  items: [],
  setItems: (items) => set({ items }),
  prependPublication: (pub) => set((state) => ({
    items: [pub, ...state.items.filter((item) => item.id !== pub.id)],
  })),
  isComposerOpen: false,
  openComposer: () => set({ isComposerOpen: true }),
  closeComposer: () => set({ isComposerOpen: false }),
}));
