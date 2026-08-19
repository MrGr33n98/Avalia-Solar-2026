import { create } from 'zustand';

interface FeedState {
  trendingTopics: string[];
  setTrendingTopics: (topics: string[]) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  trendingTopics: ['#InversoresHibridos', '#MercadoLivreEnergia', '#BateriasLithium', '#RegulacaoANEEL'],
  setTrendingTopics: (topics) => set({ trendingTopics: topics }),
}));
