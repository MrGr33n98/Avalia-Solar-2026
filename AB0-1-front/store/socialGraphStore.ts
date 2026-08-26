import { create } from 'zustand';
import { toast } from 'sonner';
import { toggleFollow } from '@/lib/api/feed';
import type { FeedFollowable } from '@/types/feed';
export const followKey = (target: FeedFollowable) => `${target.type}:${target.id}`;
interface SocialGraphState { following: Record<string, boolean>; pending: Record<string, boolean>; hydrate: (target: FeedFollowable, following: boolean) => void; toggle: (target: FeedFollowable, initial: boolean) => Promise<void>; }
export const useSocialGraphStore = create<SocialGraphState>((set, get) => ({
  following: {}, pending: {},
  hydrate: (target, following) => set((state) => { const key = followKey(target); if (key in state.following || state.pending[key]) return state; return { following: { ...state.following, [key]: following } }; }),
  toggle: async (target, initial) => { const key = followKey(target); if (get().pending[key]) return; const current = get().following[key] ?? initial;
    set((state) => ({ following: { ...state.following, [key]: !current }, pending: { ...state.pending, [key]: true } }));
    try { await toggleFollow(target.type, target.id, current); } catch { set((state) => ({ following: { ...state.following, [key]: current } })); toast.error('Não foi possível atualizar o follow'); }
    finally { set((state) => ({ pending: { ...state.pending, [key]: false } })); }
  },
}));
