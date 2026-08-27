'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreatorTreeAppearance, CreatorTreeAppearancePreset, CreatorTreePresetKey, CreatorTreeSettings } from '@/types/creator-tree';
import { reviewerTreeSettingsApi } from '@/lib/api/creatorTree';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type Snapshot = { themeKey: string; appearance: CreatorTreeAppearance };
const MAX_HISTORY = 25;
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const CREATOR_TREE_PRESETS: readonly CreatorTreeAppearancePreset[] = [
  ['solar','Solar','solar','gradient','#fff7ed','#f97316','sans'], ['executive','Executive','monochrome','color','#f8fafc','#0f172a','sans'],
  ['midnight','Midnight','dark','gradient','#020617','#6366f1','sans'], ['minimal','Minimal','monochrome','color','#ffffff','#111827','sans'],
  ['ocean','Ocean','neo','gradient','#ecfeff','#0891b2','sans'], ['editorial','Editorial','monochrome','color','#fafaf9','#292524','serif'],
  ['tech','Tech','neo','gradient','#111827','#2dd4bf','mono'], ['glass','Glass','glass','gradient','#dbeafe','#ffffff','sans'],
].map(([key,label,theme,type,bg,color,font]) => ({ key: key as CreatorTreePresetKey, label, theme_key: theme, appearance: { background: { type: type as 'color'|'gradient', value: bg }, buttonStyle: { variant: key === 'minimal' ? 'outline' : key === 'glass' || key === 'midnight' ? 'glass' : 'solid', rounding: key === 'ocean' || key === 'glass' ? 'full' : 'md', shadow: 'md', color, textColor: '#ffffff' }, fontFamily: font as 'sans'|'serif'|'mono', fontColor: color, textColor: color, fontScale: 'md' } })) as readonly CreatorTreeAppearancePreset[];

export function useTreeEditorState(initial: CreatorTreeSettings | null) {
  const [themeKey, setThemeKey] = useState(initial?.theme_key || 'solar');
  const [appearance, setAppearance] = useState<CreatorTreeAppearance>(initial?.appearance || {});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [, refreshHistory] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const history = useRef<Snapshot[]>([]);
  const historyIndex = useRef(-1);
  const latest = useRef({ themeKey, appearance });

  useEffect(() => {
    if (!initial) return;
    setThemeKey(initial.theme_key || 'solar');
    setAppearance(initial.appearance || {});
    latest.current = { themeKey: initial.theme_key || 'solar', appearance: initial.appearance || {} };
    history.current = [{ themeKey: initial.theme_key || 'solar', appearance: copy(initial.appearance || {}) }];
    historyIndex.current = 0;
    refreshHistory((value) => value + 1);
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
    history.current = [...history.current.slice(0, historyIndex.current + 1), { themeKey: nextTheme, appearance: copy(nextAppearance) }].slice(-MAX_HISTORY);
    historyIndex.current = history.current.length - 1;
    refreshHistory((value) => value + 1);
    scheduleSave(nextTheme, nextAppearance, delay);
  }, [scheduleSave]);

  const moveHistory = useCallback((direction: -1 | 1) => {
    const next = historyIndex.current + direction;
    if (next < 0 || next >= history.current.length) return;
    historyIndex.current = next;
    refreshHistory((value) => value + 1);
    const snapshot = history.current[next];
    setThemeKey(snapshot.themeKey); setAppearance(snapshot.appearance);
    scheduleSave(snapshot.themeKey, snapshot.appearance);
  }, [scheduleSave]);
  const undo = useCallback(() => moveHistory(-1), [moveHistory]);
  const redo = useCallback(() => moveHistory(1), [moveHistory]);
  const resetAppearance = useCallback(() => update({ appearance: {} }), [update]);
  const applyPreset = useCallback((key: CreatorTreePresetKey) => {
    const preset = CREATOR_TREE_PRESETS.find((item) => item.key === key);
    if (preset) update({ theme_key: preset.theme_key, appearance: copy(preset.appearance) });
  }, [update]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await save();
  }, [save]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); controller.current?.abort(); }, []);

  return { themeKey, appearance, status, lastSavedAt, update, flush, undo, redo, resetAppearance, applyPreset, presets: CREATOR_TREE_PRESETS, canUndo: historyIndex.current > 0, canRedo: historyIndex.current < history.current.length - 1, isDirty: status === 'saving' || status === 'error' };
}
