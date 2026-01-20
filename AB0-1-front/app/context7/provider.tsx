'use client';
import React, { createContext, useContext, useMemo, useReducer } from 'react';

type GalleryState = {
  photos: { id: string; url: string; title?: string }[];
  videos: { id: string; url: string; thumbnail_url?: string; provider?: string; video_id?: string }[];
  loading: boolean;
};

type GalleryAction =
  | { type: 'set_photos'; photos: GalleryState['photos'] }
  | { type: 'set_videos'; videos: GalleryState['videos'] }
  | { type: 'loading'; loading: boolean };

const initialGallery: GalleryState = { photos: [], videos: [], loading: false };

function galleryReducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case 'set_photos':
      return { ...state, photos: action.photos };
    case 'set_videos':
      return { ...state, videos: action.videos };
    case 'loading':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

// Financing proposal store (Context7)
type FinancingState = {
  submitting: boolean;
  proposalId: number | null;
  status: string | null;
  error: string | null;
};

type FinancingAction =
  | { type: 'proposal_submitting' }
  | { type: 'proposal_submitted'; proposalId: number; status: string }
  | { type: 'proposal_failed'; error: string }
  | { type: 'status_updated'; status: string }
  | { type: 'proposal_clear' };

const initialFinancing: FinancingState = {
  submitting: false,
  proposalId: null,
  status: null,
  error: null,
};

function financingReducer(state: FinancingState, action: FinancingAction): FinancingState {
  switch (action.type) {
    case 'proposal_submitting':
      return { ...state, submitting: true, error: null };
    case 'proposal_submitted':
      return { ...state, submitting: false, proposalId: action.proposalId, status: action.status, error: null };
    case 'proposal_failed':
      return { ...state, submitting: false, error: action.error };
    case 'status_updated':
      return { ...state, status: action.status };
    case 'proposal_clear':
      return { ...initialFinancing };
    default:
      return state;
  }
}

type Context7Value = {
  gallery: GalleryState;
  dispatchGallery: React.Dispatch<GalleryAction>;
  financing: FinancingState;
  dispatchFinancing: React.Dispatch<FinancingAction>;
};

const Context7 = createContext<Context7Value | null>(null);

export function Context7Provider({ children }: { children: React.ReactNode }) {
  const [gallery, dispatchGallery] = useReducer(galleryReducer, initialGallery);
  const [financing, dispatchFinancing] = useReducer(financingReducer, initialFinancing);
  const value = useMemo(() => ({ gallery, dispatchGallery, financing, dispatchFinancing }), [gallery, financing]);
  return <Context7.Provider value={value}>{children}</Context7.Provider>;
}

export function useGalleryContext7() {
  const ctx = useContext(Context7);
  if (!ctx) throw new Error('useGalleryContext7 must be used within Context7Provider');
  return ctx;
}

export function useFinancingContext7() {
  const ctx = useContext(Context7);
  if (!ctx) throw new Error('useFinancingContext7 must be used within Context7Provider');
  return { financing: ctx.financing, dispatchFinancing: ctx.dispatchFinancing };
}
