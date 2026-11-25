'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Loader2,
  ChevronRight,
  SlidersHorizontal,
  ShieldCheck,
  Star,
  MessageCircle,
  Landmark,
} from 'lucide-react';
import { useCompanyLocationData } from '@/hooks/useCompanyLocationData';
import { useCompanyGeolocation } from '@/hooks/useCompanyGeolocation';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import { useCategories } from '@/hooks/useCategories';
import { companiesApiSafe } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-error';
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

const RATING_OPTIONS = [
  { label: 'Qualquer', value: null },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
  { label: 'Excelente (5.0)', value: 5.0 },
  { label: 'Com avaliações', value: 'has_reviews' as const },
] as const;

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
  const activeState = draftFilters.state[0] || '';

  const {
    states,
    cities,
    fetchStates,
    fetchCities,
    loadingStates,
    loadingCities,
    citiesStale,
    citiesError,
  } = useCompanyLocationData(activeState);
  const { detectingGps, gpsError, setGpsError, getCoordinates } = useCompanyGeolocation();
  const { categories } = useCategories(true);

  const isGpsActive = draftFilters.lat !== null && draftFilters.lng !== null;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (draftFilters.lat !== null && draftFilters.lng !== null) count += 1;
    else {
      if (draftFilters.state.length > 0) count += 1;
      if (draftFilters.city.length > 0) count += 1;
    }
    if (draftFilters.category_ids.length > 0) count += 1;
    if (draftFilters.verified) count += 1;
    if (draftFilters.min_rating !== null) count += 1;
    if (draftFilters.has_reviews) count += 1;
    if (draftFilters.whatsapp_enabled) count += 1;
    if (draftFilters.financing_enabled) count += 1;
    return count;
  }, [draftFilters]);

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
        if (requestVersion === requestVersionRef.current && !isAbortError(err)) {
          console.error(err);
          setTotalCount(null);
        }
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

  const drawerContent = (
    <div
      className={cn(
        'fixed inset-0 z-[9500] flex justify-end bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:transition-none',
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
          'relative flex h-[100dvh] max-h-[100dvh] w-[70vw] max-w-[360px] sm:w-[360px] sm:max-w-[360px] lg:w-[380px] lg:max-w-[380px] flex-col overflow-hidden rounded-l-2xl border-l border-slate-200/80 bg-white shadow-[-12px_0_32px_rgba(15,23,42,0.14)] transition-transform duration-200 ease-out motion-reduce:transition-none focus:outline-none',
          isEntered ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              aria-hidden="true"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>
            <h2
              id="mobile-company-filters-title"
              className="truncate text-sm font-semibold tracking-tight text-slate-900"
            >
              Filtrar empresas
            </h2>
            {activeFiltersCount > 0 && (
              <span
                aria-live="polite"
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white"
              >
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleCancel}
            aria-label="Fechar filtros"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-py-3 divide-y divide-slate-100 px-4 [-webkit-overflow-scrolling:touch]">
          {/* 1. Localização */}
          <section className="space-y-2.5 py-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Localização
            </h3>

            {/* GPS Button */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleGPSLocation}
                aria-pressed={isGpsActive}
                className={cn(
                  'flex h-10 sm:h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                  isGpsActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {detectingGps ? (
                  <Loader2
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600"
                    aria-hidden="true"
                  />
                ) : (
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
                )}
                <span className="truncate">
                  {isGpsActive ? 'Localização GPS Ativa' : 'Usar minha localização atual'}
                </span>
              </button>
              {gpsError && (
                <p role="alert" className="text-[11px] font-medium text-red-600">
                  {gpsError}
                </p>
              )}
            </div>

            {/* Radius Selector if GPS Active */}
            {isGpsActive && (
              <div className="space-y-1.5">
                <span className="block text-[11px] font-medium text-slate-500">
                  Distância (Raio máximo)
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {([25, 50, 100, 200] as const).map((r) => {
                    const isSelected = draftFilters.radius_km === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => updateDraft({ radius_km: r })}
                        className={cn(
                          'h-8 rounded-lg border text-[11px] font-semibold transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {r} km
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  aria-pressed={draftFilters.radius_km === null}
                  onClick={() => updateDraft({ lat: null, lng: null, radius_km: null })}
                  className={cn(
                    'h-8 w-full rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                    draftFilters.radius_km === null
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  Todo Brasil
                </button>
              </div>
            )}

            {/* Manual Selection (State & City) */}
            {!isGpsActive && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="company-filter-state"
                    className="block text-[11px] font-medium text-slate-600"
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
                    className="h-9 w-full truncate rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">
                      {loadingCities
                        ? 'Carregando cidades...'
                        : citiesError
                          ? 'Cidades indisponíveis'
                          : activeState && cities.length === 0
                            ? 'Nenhuma cidade encontrada'
                            : 'Selecione...'}
                    </option>
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

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="company-filter-city"
                    className="block text-[11px] font-medium text-slate-600"
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
                    className="h-9 w-full truncate rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
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
                  {loadingCities && (
                    <p className="sr-only" role="status" aria-live="polite">
                      Carregando cidades de {activeState}.
                    </p>
                  )}
                  {citiesStale && (
                    <p className="sr-only" role="status">
                      Lista de cidades salva localmente; pode estar desatualizada.
                    </p>
                  )}
                  {citiesError && activeState && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-red-700" role="alert">
                      <span>Não foi possível carregar as cidades.</span>
                      <button
                        type="button"
                        className="shrink-0 underline underline-offset-2"
                        onClick={() => void fetchCities(activeState, true)}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 2. Categoria */}
          <section className="space-y-2 py-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              O que você procura?
            </h3>
            <button
              type="button"
              onClick={() => setIsCategoryPickerOpen(true)}
              className={cn(
                'flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                draftFilters.category_ids.length > 0
                  ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="truncate">
                {draftFilters.category_ids.length === 0
                  ? 'Todas as categorias'
                  : draftFilters.category_ids.length === 1
                    ? categories.find((c) => c.id === draftFilters.category_ids[0])?.name ||
                      'Categoria selecionada'
                    : `${draftFilters.category_ids.length} categorias selecionadas`}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          </section>

          {/* 3. Confiança */}
          <section className="space-y-2 py-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Confiança
            </h3>
            <label
              className={cn(
                'flex min-h-10 sm:min-h-9 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                draftFilters.verified
                  ? 'border-blue-200 bg-blue-50/60 text-blue-950'
                  : 'border-slate-200/80 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <input
                type="checkbox"
                checked={draftFilters.verified}
                onChange={(e) => updateDraft({ verified: e.target.checked })}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <ShieldCheck
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  draftFilters.verified ? 'text-blue-600' : 'text-slate-400'
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium leading-tight">
                Somente empresas verificadas
              </span>
            </label>
          </section>

          {/* 4. Avaliação */}
          <section className="space-y-2 py-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avaliação
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {RATING_OPTIONS.map((opt) => {
                const isSelected =
                  opt.value === 'has_reviews'
                    ? draftFilters.has_reviews
                    : draftFilters.min_rating === opt.value;

                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      updateDraft(
                        opt.value === 'has_reviews'
                          ? { has_reviews: !draftFilters.has_reviews }
                          : { min_rating: opt.value }
                      )
                    }
                    className={cn(
                      'flex h-9 items-center justify-center gap-1 rounded-lg border px-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                      opt.value === 'has_reviews' && 'col-span-2',
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {typeof opt.value === 'number' && (
                      <Star
                        className={cn(
                          'h-3 w-3 shrink-0',
                          isSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. Atendimento */}
          <section className="space-y-2 py-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Atendimento e Recursos
            </h3>
            <div className="flex flex-col gap-1.5">
              <label
                className={cn(
                  'flex min-h-10 sm:min-h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                  draftFilters.whatsapp_enabled
                    ? 'border-blue-200 bg-blue-50/60 text-blue-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={draftFilters.whatsapp_enabled}
                  onChange={(e) => updateDraft({ whatsapp_enabled: e.target.checked })}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <MessageCircle
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    draftFilters.whatsapp_enabled ? 'text-emerald-600' : 'text-slate-400'
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium leading-tight">WhatsApp disponível</span>
              </label>

              <label
                className={cn(
                  'flex min-h-10 sm:min-h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                  draftFilters.financing_enabled
                    ? 'border-blue-200 bg-blue-50/60 text-blue-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={draftFilters.financing_enabled}
                  onChange={(e) => updateDraft({ financing_enabled: e.target.checked })}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <Landmark
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    draftFilters.financing_enabled ? 'text-blue-600' : 'text-slate-400'
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium leading-tight">Financiamento</span>
              </label>
            </div>
          </section>
        </div>

        {/* Subvisão interna de Categorias (restringida à largura do drawer) */}
        {isCategoryPickerOpen && (
          <div
            className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-l-2xl bg-white"
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
        <div className="flex shrink-0 flex-col gap-1.5 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onApply({ ...draftFilters, page: 1 });
            }}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            {loadingCount && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
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
            className="h-8 w-full rounded-lg text-center text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
}
