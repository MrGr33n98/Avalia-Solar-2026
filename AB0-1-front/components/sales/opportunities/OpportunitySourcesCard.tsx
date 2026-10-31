'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Globe,
  Loader2,
  Megaphone,
  MessageCircle,
  Plus,
  Share2,
  Store,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { salesApi } from '@/lib/api/sales/client';
import type { ApiSource } from '@/lib/api/sales/types';

type SourceValue = { id: number | null; name: string; slug?: string } | string | null | undefined;

export interface OpportunitySourcesCardProps {
  opportunityId: number;
  currentSource?: SourceValue;
  currentSourceId?: number | null;
  onUpdated?: () => void;
}

/** Normaliza o shape legado (string) e o novo ({ id, name, slug }). */
export function resolveSourceName(source: SourceValue): string | null {
  if (!source) return null;
  if (typeof source === 'string') return source.trim() || null;
  return source.name?.trim() || null;
}

function iconForSource(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/whats|zap/.test(n)) return MessageCircle;
  if (/indica|referral|parceiro|partner/.test(n)) return Users;
  if (/social|instagram|facebook|linkedin/.test(n)) return Share2;
  if (/marketplace|avalia/.test(n)) return Store;
  if (/ads|campanha|evento|feira|outbound/.test(n)) return Megaphone;
  return Globe;
}

export const OpportunitySourcesCard: React.FC<OpportunitySourcesCardProps> = ({
  opportunityId,
  currentSource,
  currentSourceId,
  onUpdated,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: number | null; name: string } | null>(null);

  useEffect(() => {
    const name = resolveSourceName(currentSource);
    setSelected(name ? { id: currentSourceId ?? null, name } : null);
  }, [currentSource, currentSourceId]);

  useEffect(() => {
    if (!open || sources.length > 0) return;
    setLoadingList(true);
    salesApi
      .getSources()
      .then(setSources)
      .catch(() => setError('Não foi possível carregar as origens.'))
      .finally(() => setLoadingList(false));
  }, [open, sources.length]);

  const term = query.trim();
  const filtered = useMemo(
    () => sources.filter((s) => s.name.toLowerCase().includes(term.toLowerCase())),
    [sources, term]
  );
  const exactMatch = sources.some((s) => s.name.toLowerCase() === term.toLowerCase());

  const persist = async (next: { id: number | null; name: string } | null) => {
    const previous = selected;
    setSelected(next);
    setSaving(true);
    setError(null);
    try {
      await salesApi.updateOpportunity(opportunityId, { source_id: next?.id ?? null });
      setOpen(false);
      setQuery('');
      onUpdated?.();
    } catch (err: unknown) {
      setSelected(previous);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar origem.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!term) return;
    setSaving(true);
    setError(null);
    try {
      const created = await salesApi.createSource({ name: term });
      setSources((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
      await persist({ id: created.id, name: created.name });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar origem.');
      setSaving(false);
    }
  };

  const count = selected ? 1 : 0;
  const SelectedIcon = selected ? iconForSource(selected.name) : Globe;

  return (
    <Card className="border-slate-200 bg-white shadow-2xs" data-testid="opportunity-sources-card">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer font-extrabold text-slate-800"
      >
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-sky-700" />
          <span>Sources ({count})</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-testid="opportunity-sources-add"
                className="text-sky-700 text-xs font-bold hover:underline"
                disabled={saving}
              >
                {selected ? 'Alterar' : '+ Add'}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && term && !exactMatch) void handleCreate();
                }}
                placeholder="Buscar ou criar origem..."
                aria-label="Buscar origem"
                className="mb-2 h-8 w-full rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-sky-600"
              />
              <div className="max-h-56 overflow-y-auto">
                {loadingList ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {filtered.map((s) => {
                      const Icon = iconForSource(s.name);
                      const isCurrent = selected?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={saving}
                          onClick={() => void persist({ id: s.id, name: s.name })}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium ${
                            isCurrent ? 'bg-sky-50 font-bold text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="truncate">{s.name}</span>
                        </button>
                      );
                    })}
                    {term && !exactMatch && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleCreate()}
                        data-testid="opportunity-sources-create"
                        className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-slate-100 px-2 py-1.5 text-left text-xs font-bold text-sky-700 hover:bg-sky-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="truncate">Criar &quot;{term}&quot;</span>
                      </button>
                    )}
                    {!term && filtered.length === 0 && (
                      <p className="py-2 text-center text-[11px] text-slate-400">Nenhuma origem cadastrada</p>
                    )}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <ChevronDown
            onClick={() => setExpanded(!expanded)}
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
          />
        </div>
      </div>
      {expanded && (
        <CardContent className="p-4 space-y-2">
          {selected ? (
            <div className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900">
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SelectedIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate" data-testid="opportunity-sources-selected">
                {selected.name}
              </span>
              <button
                type="button"
                aria-label={`Remover origem ${selected.name}`}
                disabled={saving}
                onClick={() => void persist(null)}
                className="rounded-full p-0.5 text-sky-700 hover:bg-sky-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-center text-[11px] text-slate-400">No sources added</p>
          )}
          {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
        </CardContent>
      )}
    </Card>
  );
};

export default OpportunitySourcesCard;

