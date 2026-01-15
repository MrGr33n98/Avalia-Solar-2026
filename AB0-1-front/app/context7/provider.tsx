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

type Context7Value = {
  gallery: GalleryState;
  dispatchGallery: React.Dispatch<GalleryAction>;
};

const Context7 = createContext<Context7Value | null>(null);

export function Context7Provider({ children }: { children: React.ReactNode }) {
  const [gallery, dispatchGallery] = useReducer(galleryReducer, initialGallery);
  const value = useMemo(() => ({ gallery, dispatchGallery }), [gallery]);
  return <Context7.Provider value={value}>{children}</Context7.Provider>;
}

export function useGalleryContext7() {
  const ctx = useContext(Context7);
  if (!ctx) throw new Error('useGalleryContext7 must be used within Context7Provider');
  return ctx;
}

