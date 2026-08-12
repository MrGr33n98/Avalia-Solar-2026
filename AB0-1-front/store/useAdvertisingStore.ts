import { create } from 'zustand';
import { api } from '@/lib/api';
import { createConsumer } from '@rails/actioncable';
import { resolveCableUrl } from '@/lib/cable';

export interface ActiveCampaign {
  id: number;
  name: string;
  description?: string | null;
  target_url?: string | null;
  budget?: number | null;
  company?: { id: number; name: string } | null;
  image_url?: string | null;
}

interface AdvertisingStoreState {
  activeCampaign: ActiveCampaign | null;
  isLoading: boolean;
  isSubscribed: boolean;
  fetchActiveCampaign: () => Promise<void>;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

let cableConsumer: ReturnType<typeof createConsumer> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let subscription: any = null;

export const useAdvertisingStore = create<AdvertisingStoreState>((set, get) => ({
  activeCampaign: null,
  isLoading: false,
  isSubscribed: false,

  fetchActiveCampaign: async () => {
    set({ isLoading: true });
    try {
      const response = await api.request<ActiveCampaign | null>({
        url: '/publicidade_campanhas',
        method: 'GET',
        noCache: true,
      });
      set({ activeCampaign: response.data || null });
    } catch (error) {
      console.error('[useAdvertisingStore] Error fetching active campaign:', error);
      set({ activeCampaign: null });
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToUpdates: () => {
    if (typeof window === 'undefined' || get().isSubscribed) return;

    try {
      const cableUrl = resolveCableUrl();
      if (!cableUrl) return;

      cableConsumer = createConsumer(cableUrl);
      subscription = cableConsumer.subscriptions.create(
        { channel: 'AdvertisingChannel' },
        {
          received: (data: ActiveCampaign | null) => {
            // eslint-disable-next-line no-console
            console.log('[useAdvertisingStore] Received campaign update via WebSocket:', data);
            set({ activeCampaign: data });
          },
        }
      );
      set({ isSubscribed: true });
    } catch (error) {
      console.error('[useAdvertisingStore] ActionCable subscription failed:', error);
    }
  },

  unsubscribeFromUpdates: () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    if (cableConsumer) {
      cableConsumer.disconnect();
      cableConsumer = null;
    }
    set({ isSubscribed: false });
  },
}));
