import { create } from 'zustand';
import type { FeedItem, TrendingTopic } from '@/types/feed';

interface FeedState {
  suggestedCreators: { id: number; name: string; slug?: string; avatar_url?: string | null }[];
  suggestedCompanies: { id: number; name: string; slug?: string; logo_url?: string | null; rating?: number | string }[];
  suggestedGroups: { id: number; name: string; slug?: string }[];
  setSuggestions: (creators: FeedState['suggestedCreators'], companies: FeedState['suggestedCompanies'], groups: FeedState['suggestedGroups']) => void;
  trendingTopics: TrendingTopic[];
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  items: FeedItem[];
  setItems: (items: FeedItem[]) => void;
  prependPublication: (pub: FeedItem) => void;
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  suggestedCreators: [],
  suggestedCompanies: [],
  suggestedGroups: [],
  setSuggestions: (suggestedCreators, suggestedCompanies, suggestedGroups) => set({ suggestedCreators, suggestedCompanies, suggestedGroups }),
  trendingTopics: [],
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
