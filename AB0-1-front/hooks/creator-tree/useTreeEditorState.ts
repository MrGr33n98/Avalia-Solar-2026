'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreatorTreeAppearance, CreatorTreeSettings } from '@/types/creator-tree';
import { reviewerTreeSettingsApi } from '@/lib/api/creatorTree';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useTreeEditorState(initial: CreatorTreeSettings | null) {
  const [themeKey, setThemeKey] = useState(initial?.theme_key || 'solar');
  const [appearance, setAppearance] = useState<CreatorTreeAppearance>(initial?.appearance || {});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const latest = useRef({ themeKey, appearance });

  useEffect(() => {
    if (!initial) return;
    setThemeKey(initial.theme_key || 'solar');
    setAppearance(initial.appearance || {});
    latest.current = { themeKey: initial.theme_key || 'solar', appearance: initial.appearance || {} };
  }, [initial]);

  const save = useCallback(async () => {
    const id = ++requestId.current;
    controller.current?.abort();
    controller.current = new AbortController();
    const snapshot = latest.current;
    setStatus('saving');
    try {
      await reviewerTreeSettingsApi.update({ theme_key: snapshot.themeKey, appearance: snapshot.appearance }, controller.current.signal);
      if (id !== requestId.current) return;
      setStatus('saved');
      setLastSavedAt(Date.now());
    } catch {
      if (id === requestId.current) setStatus('error');
    }
  }, []);

  const scheduleSave = useCallback((nextTheme: string, nextAppearance: CreatorTreeAppearance, delay = 450) => {
    latest.current = { themeKey: nextTheme, appearance: nextAppearance };
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(() => void save(), delay);
  }, [save]);

  const update = useCallback((next: { theme_key?: string; appearance?: CreatorTreeAppearance }, delay = 450) => {
    const nextTheme = next.theme_key ?? latest.current.themeKey;
    const nextAppearance = next.appearance ?? latest.current.appearance;
    setThemeKey(nextTheme);
    setAppearance(nextAppearance);
    scheduleSave(nextTheme, nextAppearance, delay);
  }, [scheduleSave]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await save();
  }, [save]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); controller.current?.abort(); }, []);

  return { themeKey, appearance, status, lastSavedAt, update, flush, isDirty: status === 'saving' || status === 'error' };
}
