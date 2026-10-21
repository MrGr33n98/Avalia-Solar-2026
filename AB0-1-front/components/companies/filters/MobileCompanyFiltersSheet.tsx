'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Loader2, ChevronRight } from 'lucide-react';
import { useCompanyLocationData } from '@/hooks/useCompanyLocationData';
import { useCompanyGeolocation } from '@/hooks/useCompanyGeolocation';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import { useCategories } from '@/hooks/useCategories';
import { companiesApiSafe } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { CompanyFilters } from '@/components/filters/types';
import { CompanyCategoryPicker } from './CompanyCategoryPicker';
import { track } from '@/lib/analytics/consolidated';
import { CommunicationSurfaceManager } from '@/lib/communication-surface-manager';

interface MobileCompanyFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  filters: CompanyFilters;
  onApply: (nextFilters: CompanyFilters) => void;
  initialGpsError?: string | null;
}

export default function MobileCompanyFiltersSheet({
  open,
  onClose,
  filters,
  onApply,
  initialGpsError,
}: MobileCompanyFiltersSheetProps) {
  const [draftFilters, setDraftFilters] = useState<CompanyFilters>(filters);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState<number[]>(filters.category_ids);
  const requestVersionRef = useRef(0);
  const countAbortRef = useRef<AbortController | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [isRendered, setIsRendered] = useState(open);
  const [isEntered, setIsEntered] = useState(open);

  const { states, cities, fetchStates, fetchCities, loadingStates, loadingCities } =
    useCompanyLocationData();
  const { detectingGps, gpsError, setGpsError, getCoordinates } = useCompanyGeolocation();
  const { categories } = useCategories(true);

  // Transition & Communication Surface locking
  useEffect(() => {
    if (open) {
      setIsRendered(true);
      CommunicationSurfaceManager.open('filters_drawer');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const anim = requestAnimationFrame(() => {
        setIsEntered(true);
      });

      return () => {
        cancelAnimationFrame(anim);
        document.body.style.overflow = prevOverflow;
        CommunicationSurfaceManager.close('filters_drawer');
      };
    } else {
      setIsEntered(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleCancel = () => {
    setDraftFilters(filters);
    setDraftCategoryIds(filters.category_ids);
    onClose();
  };

  // Keyboard Escape listener & Focus trap
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCategoryPickerOpen) {
          setIsCategoryPickerOpen(false);
        } else {
          handleCancel();
        }
      } else if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCategoryPickerOpen, filters]);

  const wasOpenRef = useRef(false);

  // Sync draft filters only when modal transitions to open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      setDraftFilters(filters);
      setDraftCategoryIds(filters.category_ids);
      fetchStates();
      setIsCategoryPickerOpen(false);
      closeButtonRef.current?.focus();
      if (initialGpsError) {
        setGpsError(initialGpsError);
      }
    }
    wasOpenRef.current = open;
  }, [open, filters, fetchStates, initialGpsError, setGpsError]);

  useEffect(() => {
    if (open) return;

    previouslyFocusedRef.current?.focus();
  }, [open]);

  // Fetch cities when draft state changes
  const activeState = draftFilters.state[0] || '';
  useEffect(() => {
    if (activeState) {
      fetchCities(activeState);
    }
  }, [activeState, fetchCities]);

  // Real-time counter of matching companies with debounce
  useEffect(() => {
    if (!open) return;
    setLoadingCount(true);
    countAbortRef.current?.abort();
    const controller = new AbortController();
    countAbortRef.current = controller;
    const requestVersion = ++requestVersionRef.current;
    const timer = setTimeout(async () => {
      try {
        const count = await companiesApiSafe.getTotalCount({
          status: 'active' as const,
          q: draftFilters.search || undefined,
          state: draftFilters.state.length > 0 ? draftFilters.state : undefined,
          city: draftFilters.city.length > 0 ? draftFilters.city : undefined,
          category_ids:
            draftFilters.category_ids.length > 0 ? draftFilters.category_ids : undefined,
          min_rating: draftFilters.min_rating || undefined,
          verified: draftFilters.verified || undefined,
          featured: draftFilters.featured || undefined,
          financing_enabled: draftFilters.financing_enabled || undefined,
          whatsapp_enabled: draftFilters.whatsapp_enabled || undefined,
          has_reviews: draftFilters.has_reviews || undefined,
          signal: controller.signal,
          latitude: draftFilters.lat || undefined,
          longitude: draftFilters.lng || undefined,
          radius_km: draftFilters.radius_km || undefined,
        });
        if (requestVersion === requestVersionRef.current) setTotalCount(count);
      } catch (err) {
        console.error(err);
        setTotalCount(null);
      } finally {
        if (requestVersion === requestVersionRef.current) setLoadingCount(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draftFilters, open]);

  if (!isRendered && !open) return null;

  const updateDraft = (updater: Partial<CompanyFilters>) => {
    setDraftFilters((prev) => ({ ...prev, ...updater }));
  };

  // GPS Location Trigger
  const handleGPSLocation = async () => {
    try {
      const coords = await getCoordinates();
      const nextDraft = {
        ...draftFilters,
        lat: coords.lat,
        lng: coords.lng,
        radius_km: draftFilters.radius_km || 50,
        state: [],
        city: [], // Limpa busca manual para evitar conflitos
      };
      setDraftFilters(nextDraft);
      track('location_filter_applied', {
        source: 'companies_filter_sheet',
        radius_km: nextDraft.radius_km,
      });
    } catch {
      // O hook useCompanyGeolocation já atualiza gpsError
    }
  };

  const handleClear = () => {
    const clearedFilters: CompanyFilters = {
      search: '',
      state: [],
      city: [],
      category_ids: [],
      min_rating: null,
      verified: false,
      featured: false,
      financing_enabled: false,
      whatsapp_enabled: false,
      has_reviews: false,
      sort: 'recommended',
      page: 1,
      lat: null,
      lng: null,
      radius_km: null,
    };
    setDraftFilters(clearedFilters);
    setDraftCategoryIds([]);
  };

  const isGpsActive = draftFilters.lat !== null && draftFilters.lng !== null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9500] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-[240ms] ease-out',
        isEntered ? 'opacity-100' : 'opacity-0'
      )}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleCancel();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-company-filters-title"
        tabIndex={-1}
        className={cn(
          'relative flex h-full h-[100dvh] max-h-[100dvh] w-[70vw] max-w-[70vw] flex-col overflow-hidden rounded-l-[20px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] transition-transform duration-[240ms] ease-out',
          isEntered ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 border-b border-slate-100 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id="mobile-company-filters-title" className="text-sm font-bold text-slate-900 truncate">
            Filtrar empresas
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleCancel}
            aria-label="Fechar filtros"
            className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-4 py-3.5 space-y-3.5 [-webkit-overflow-scrolling:touch]">
          {/* 1. Localização */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Localização
            </h3>

            {/* GPS Button */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleGPSLocation}
                className={cn(
                  'flex items-center justify-center gap-1.5 h-10 w-full rounded-xl px-2 text-[11px] font-bold transition-all border text-center',
                  isGpsActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                {detectingGps ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                )}
                <span className="truncate">
                  {isGpsActive ? 'Localização GPS Ativa' : 'Usar minha localização atual'}
                </span>
              </button>
              {gpsError && <p className="text-[10px] text-red-600 font-medium">{gpsError}</p>}
            </div>

            {/* Radius Selector if GPS Active */}
            {isGpsActive && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">
                  Distância (Raio máximo)
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {([25, 50, 100, 200] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updateDraft({ radius_km: r })}
                      className={cn(
                        'h-8 rounded-lg text-[11px] font-semibold border transition-all text-center',
                        draftFilters.radius_km === r
                          ? 'bg-blue-600 border-blue-600 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      )}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => updateDraft({ lat: null, lng: null, radius_km: null })}
                  className={cn(
                    'h-8 w-full rounded-lg text-xs font-semibold border transition-all',
                    draftFilters.radius_km === null
                      ? 'bg-blue-600 border-blue-600 text-white font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  )}
                >
                  Todo Brasil
                </button>
              </div>
            )}

            {/* Manual Selection (State & City) */}
            {!isGpsActive && (
              <div className="flex flex-col gap-2">
                <div className="space-y-1">
                  <label
                    htmlFor="company-filter-state"
                    className="text-[10px] font-bold text-slate-500 uppercase"
                  >
                    Estado
                  </label>
                  <select
                    id="company-filter-state"
                    value={activeState}
                    onChange={(e) => {
                      const stateVal = e.target.value;
                      updateDraft({
                        state: stateVal ? [stateVal] : [],
                        city: [],
                        lat: null,
                        lng: null,
                        radius_km: null,
                      });
                    }}
                    disabled={loadingStates}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Selecione...</option>
                    {activeState && !states.includes(activeState) && (
                      <option value={activeState}>
                        {BRAZIL_STATES_OPTIONS.find((opt) => opt.state === activeState)?.label ||
                          activeState}
                      </option>
                    )}
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {BRAZIL_STATES_OPTIONS.find((opt) => opt.state === st)?.label || st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="company-filter-city"
                    className="text-[10px] font-bold text-slate-500 uppercase"
                  >
                    Cidade
                  </label>
                  <select
                    id="company-filter-city"
                    value={draftFilters.city[0] || ''}
                    onChange={(e) => {
                      const cityVal = e.target.value;
                      updateDraft({
                        city: cityVal ? [cityVal] : [],
                        lat: null,
                        lng: null,
                        radius_km: null,
                      });
                    }}
                    disabled={!activeState || loadingCities}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {(draftFilters.city[0] || '') &&
                      !cities.includes(draftFilters.city[0] || '') && (
                        <option value={draftFilters.city[0] || ''}>
                          {draftFilters.city[0] || ''}
                        </option>
                      )}
                    {cities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Categoria */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              O que você procura?
            </h3>
            <button
              type="button"
              onClick={() => setIsCategoryPickerOpen(true)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
            >
              <span className="truncate pr-1">
                {draftFilters.category_ids.length === 0
                  ? 'Todas as categorias'
                  : draftFilters.category_ids.length === 1
                    ? categories.find((c) => c.id === draftFilters.category_ids[0])?.name ||
                      'Categoria selecionada'
                    : `${draftFilters.category_ids.length} categorias selecionadas`}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* 3. Confiança */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confiança</h3>
            <label className="flex items-center gap-2.5 min-h-10 w-full bg-slate-50 rounded-xl px-3 py-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draftFilters.verified}
                onChange={(e) => updateDraft({ verified: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
              />
              <span className="text-xs font-semibold text-slate-700 leading-tight">
                Somente empresas verificadas
              </span>
            </label>
          </div>

          {/* 4. Avaliação */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avaliação</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { label: 'Qualquer', value: null },
                  { label: '4.0+', value: 4.0 },
                  { label: '4.5+', value: 4.5 },
                  { label: 'Excelente (5.0)', value: 5.0 },
                  { label: 'Com avaliações', value: 'has_reviews' as const },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() =>
                    updateDraft(
                      opt.value === 'has_reviews'
                        ? { has_reviews: !draftFilters.has_reviews }
                        : { min_rating: opt.value }
                    )
                  }
                  className={cn(
                    'flex flex-col items-center justify-center h-10 rounded-xl border text-[10px] font-bold transition-all px-1 text-center',
                    opt.value === 'has_reviews' && 'col-span-2',
                    opt.value === 'has_reviews'
                      ? draftFilters.has_reviews
                      : draftFilters.min_rating === opt.value
                        ? 'bg-blue-600 border-blue-600 text-white font-extrabold'
                        : 'bg-white border-slate-200 text-slate-600'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Atendimento */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Atendimento e Recursos
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2.5 min-h-10 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.whatsapp_enabled}
                  onChange={(e) => updateDraft({ whatsapp_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-600 leading-tight">WhatsApp disponível</span>
              </label>

              <label className="flex items-center gap-2.5 min-h-10 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.financing_enabled}
                  onChange={(e) => updateDraft({ financing_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-600 leading-tight">Financiamento</span>
              </label>
            </div>
          </div>
        </div>

        {/* Subvisão interna de Categorias (restringida aos 70vw) */}
        {isCategoryPickerOpen && (
          <div
            className="absolute inset-0 z-30 flex flex-col bg-white rounded-l-[20px] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar categorias"
          >
            <CompanyCategoryPicker
              selectedIds={draftCategoryIds}
              onChange={setDraftCategoryIds}
              embedded={true}
              onCancel={() => {
                setDraftCategoryIds(draftFilters.category_ids);
                setIsCategoryPickerOpen(false);
              }}
              onConfirm={() => {
                updateDraft({ category_ids: draftCategoryIds });
                setIsCategoryPickerOpen(false);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="shrink-0 px-3.5 sm:px-4 py-3 border-t border-slate-100 bg-white flex flex-col gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => {
              onApply({ ...draftFilters, page: 1 });
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            {loadingCount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span className="truncate">
              {loadingCount
                ? 'Contando...'
                : totalCount !== null
                  ? `Ver ${totalCount} ${totalCount === 1 ? 'empresa' : 'empresas'}`
                  : 'Aplicar filtros'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors h-8"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
