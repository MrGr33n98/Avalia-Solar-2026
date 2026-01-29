'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'avalia_solar_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites from localStorage', e);
      }
    }
  }, []);

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setFavorites(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(id);
      const next = isFavorite ? prev.filter((favId) => favId !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
