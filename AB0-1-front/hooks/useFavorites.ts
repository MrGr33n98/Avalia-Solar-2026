'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'avalia_solar_favorites';

function parseFavorites(value: string | null): number[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    setFavorites(parseFavorites(localStorage.getItem(STORAGE_KEY)));
  }, []);

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavorites(parseFavorites(e.newValue));
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
