import { useEffect, useState } from 'react';

type Draft = { version: 1; step: number; rating: number; answers: Record<string, number>; comment: string; updatedAt: string };

export function useReviewDraft(token: string) {
  const key = `avaliasolar:review:${token}:v1`;
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch {
      setDraft(null);
    }
  }, [key]);

  const save = (value: Omit<Draft, 'version' | 'updatedAt'>) => {
    const next: Draft = { ...value, version: 1, updatedAt: new Date().toISOString() };
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  const clear = () => {
    try { window.localStorage.removeItem(key); } catch { /* storage unavailable */ }
    setDraft(null);
  };

  return { draft, save, clear };
}
