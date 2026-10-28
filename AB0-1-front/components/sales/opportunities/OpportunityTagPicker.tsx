'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Plus, Search, Tag as TagIcon, X } from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import type { ApiTag } from '@/lib/api/sales/types';

interface OpportunityTagPickerProps {
  opportunityId: number;
  initialTags?: ApiTag[];
  onUpdated?: () => void;
  className?: string;
}

export default function OpportunityTagPicker({
  opportunityId,
  initialTags = [],
  onUpdated,
  className = '',
}: OpportunityTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allTags, setAllTags] = useState<ApiTag[]>([]);
  const [appliedTags, setAppliedTags] = useState<ApiTag[]>(initialTags);
  const [loading, setLoading] = useState(false);
  const [savingTagId, setSavingTagId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep appliedTags in sync with prop updates
  useEffect(() => {
    setAppliedTags(initialTags);
  }, [initialTags]);

  // Load organization tags when dropdown opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    async function loadOrgTags() {
      setLoading(true);
      setError(null);
      try {
        const tags = await salesApi.getTags('Opportunity');
        if (isMounted) {
          setAllTags(tags);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Erro ao carregar marcadores do servidor.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrgTags();

    // Auto focus search input when opened
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [open]);

  // Handle click outside and Escape key to close dropdown
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const appliedIds = useMemo(
    () => new Set(appliedTags.map((t) => t.id)),
    [appliedTags]
  );

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTags.some((t) => t.name.toLowerCase() === q);
  }, [allTags, search]);

  const handleToggleTag = async (tag: ApiTag) => {
    setSavingTagId(tag.id);
    setError(null);
    try {
      if (appliedIds.has(tag.id)) {
        await salesApi.removeTag(tag.id, 'Opportunity', opportunityId);
        setAppliedTags((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        await salesApi.applyTag(tag.id, 'Opportunity', opportunityId);
        setAppliedTags((prev) => [...prev, tag]);
      }
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Falha ao atualizar marcador na oportunidade.');
    } finally {
      setSavingTagId(null);
    }
  };

  const handleCreateAndApply = async () => {
    const tagName = search.trim();
    if (!tagName) return;

    setCreating(true);
    setError(null);
    try {
      const newTag = await salesApi.createTag({
        name: tagName,
        color: '#0284c7',
        entity_type: 'Opportunity',
      });
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      await salesApi.applyTag(newTag.id, 'Opportunity', opportunityId);
      setAppliedTags((prev) => [...prev, newTag]);
      setSearch('');
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar e aplicar novo marcador.');
    } finally {
      setCreating(false);
    }
  };

  const handleQuickRemove = async (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      await salesApi.removeTag(tagId, 'Opportunity', opportunityId);
      setAppliedTags((prev) => prev.filter((t) => t.id !== tagId));
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Falha ao remover marcador.');
    }
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={dropdownRef}>
      {/* List of currently applied tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {appliedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor: `${tag.color || '#0284c7'}15`,
              color: tag.color || '#0284c7',
              border: `1px solid ${tag.color || '#0284c7'}40`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color || '#0284c7' }}
            />
            <span className="truncate max-w-[130px]">{tag.name}</span>
            <button
              type="button"
              onClick={(e) => handleQuickRemove(tag.id, e)}
              className="ml-0.5 rounded p-0.5 hover:bg-black/10 focus:outline-hidden cursor-pointer"
              title={`Remover marcador ${tag.name}`}
              aria-label={`Remover marcador ${tag.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {/* Trigger button for tag selector */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline focus:outline-hidden cursor-pointer"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Plus className="h-3 w-3" />
          <span>{appliedTags.length === 0 ? 'Add tags...' : 'Add tag...'}</span>
        </button>
      </div>

      {/* Inline Floating Dropdown Menu (no portal traps, immune to modal z-index issues) */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xl ring-1 ring-slate-900/10 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ minWidth: '18rem' }}
          role="dialog"
          aria-label="Marcadores da oportunidade"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-sky-600" />
                Marcadores da oportunidade
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Fechar marcadores"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ou criar marcador..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2 text-[11px] text-red-600 font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Tag options list */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
              {loading ? (
                <div className="flex items-center justify-center py-4 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5 text-sky-600" />
                  <span className="text-[11px]">Carregando marcadores...</span>
                </div>
              ) : filteredTags.length === 0 && !search.trim() ? (
                <div className="py-4 text-center text-[11px] text-slate-400">
                  Nenhum marcador cadastrado.
                </div>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = appliedIds.has(tag.id);
                  const isSaving = savingTagId === tag.id;

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      disabled={isSaving}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-200'
                          : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || '#0284c7' }}
                        />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                      ) : isSelected ? (
                        <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Create new tag option if not exact match */}
            {search.trim() && !exactMatch && (
              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={handleCreateAndApply}
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition cursor-pointer"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-sky-600" />
                      <span>Criando marcador...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 text-sky-700" />
                      <span>Criar marcador &ldquo;{search.trim()}&rdquo;</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
