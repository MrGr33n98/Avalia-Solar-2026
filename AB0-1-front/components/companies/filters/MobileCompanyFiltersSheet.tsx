'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, Loader2, Check, Star, MessageSquare } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useCategories } from '@/hooks/useCategories';
import { companiesApiSafe } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { CompanyFilters } from '@/components/filters/types';

interface MobileCompanyFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  filters: CompanyFilters;
  onApply: (nextFilters: CompanyFilters) => void;
}

export default function MobileCompanyFiltersSheet({
  open,
  onClose,
  filters,
  onApply,
}: MobileCompanyFiltersSheetProps) {
  const [draftFilters, setDraftFilters] = useState<CompanyFilters>(filters);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const { states, cities, fetchStates, fetchCities, loadingStates, loadingCities } = useLocationData();
  const { categories, loading: loadingCategories } = useCategories(true);

  // Sync draft filters when modal opens
  useEffect(() => {
    if (open) {
      setDraftFilters(filters);
      fetchStates();
    }
  }, [open, filters, fetchStates]);

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
    const timer = setTimeout(async () => {
      try {
        const count = await companiesApiSafe.getTotalCount({
          status: 'active' as const,
          q: draftFilters.search || undefined,
          state: draftFilters.state.length > 0 ? draftFilters.state : undefined,
          city: draftFilters.city.length > 0 ? draftFilters.city : undefined,
          category_ids: draftFilters.category_ids.length > 0 ? draftFilters.category_ids : undefined,
          min_rating: draftFilters.min_rating || undefined,
          verified: draftFilters.verified || undefined,
          featured: draftFilters.featured || undefined,
          financing_enabled: draftFilters.financing_enabled || undefined,
          whatsapp_enabled: draftFilters.whatsapp_enabled || undefined,
          latitude: draftFilters.lat || undefined,
          longitude: draftFilters.lng || undefined,
          radius_km: draftFilters.radius_km || undefined,
        });
        setTotalCount(count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCount(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [draftFilters, open]);

  if (!open) return null;

  const updateDraft = (updater: Partial<CompanyFilters>) => {
    setDraftFilters((prev) => ({ ...prev, ...updater }));
  };

  // GPS Location Trigger
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não suportada no seu navegador.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateDraft({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius_km: draftFilters.radius_km || 50,
          state: [],
          city: [], // Limpa busca manual para evitar conflitos
        });
        setDetectingGps(false);
      },
      (err) => {
        setGpsError('Não foi possível obter sua localização física.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const handleClear = () => {
    setDraftFilters({
      search: '',
      state: [],
      city: [],
      category_ids: [],
      min_rating: null,
      verified: false,
      featured: false,
      financing_enabled: false,
      whatsapp_enabled: false,
      sort: 'recommended',
      page: 1,
      lat: null,
      lng: null,
      radius_km: null,
    });
  };

  const isGpsActive = draftFilters.lat !== null && draftFilters.lng !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden max-h-[85vh] transition-transform duration-300 transform translate-y-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Filtrar empresas</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* 1. Localização */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Localização</h3>

            {/* GPS Button */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGPSLocation}
                className={cn(
                  'flex items-center justify-center gap-2 h-11 w-full rounded-xl text-xs font-bold transition-all border',
                  isGpsActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                {detectingGps ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-600" />
                )}
                {isGpsActive ? 'Localização GPS Ativa' : 'Usar minha localização atual'}
              </button>
              {gpsError && <p className="text-[10px] text-red-600 font-medium">{gpsError}</p>}
            </div>

            {/* Radius Selector if GPS Active */}
            {isGpsActive && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Distância (Raio máximo)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {([25, 50, 100, 200] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updateDraft({ radius_km: r })}
                      className={cn(
                        'h-9 rounded-lg text-xs font-semibold border transition-all',
                        draftFilters.radius_km === r
                          ? 'bg-blue-600 border-blue-600 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      )}
                    >
                      {r} km
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateDraft({ radius_km: 1000 })}
                    className={cn(
                      'h-9 rounded-lg text-xs font-semibold border transition-all col-span-1',
                      draftFilters.radius_km === 1000
                        ? 'bg-blue-600 border-blue-600 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    )}
                  >
                    Brasil
                  </button>
                </div>
              </div>
            )}

            {/* Manual Selection (State & City) */}
            {!isGpsActive && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                  <select
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
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Selecione...</option>
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cidade</label>
                  <select
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
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
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
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">O que você procura?</h3>
            {loadingCategories ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Carregando categorias...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.slice(0, 10).map((cat) => {
                  const isSelected = draftFilters.category_ids.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const nextIds = isSelected
                          ? draftFilters.category_ids.filter((id) => id !== cat.id)
                          : [...draftFilters.category_ids, cat.id];
                        updateDraft({ category_ids: nextIds });
                      }}
                      className={cn(
                        'flex h-11 items-center justify-between px-3 rounded-xl border text-[11px] font-bold text-left transition-all',
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span className="truncate pr-1">{cat.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Confiança */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Confiança</h3>
            <label className="flex items-center gap-3 h-12 w-full bg-slate-50 rounded-xl px-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draftFilters.verified}
                onChange={(e) => updateDraft({ verified: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-700">Somente empresas verificadas</span>
            </label>
          </div>

          {/* 4. Avaliação */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Avaliação</h3>
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Qualquer', value: null },
                { label: '4.0+', value: 4.0 },
                { label: '4.5+', value: 4.5 },
                { label: 'Excelente (5.0)', value: 5.0 },
              ] as const).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => updateDraft({ min_rating: opt.value })}
                  className={cn(
                    'flex flex-col items-center justify-center h-12 rounded-xl border text-[10px] font-bold transition-all px-1.5 text-center',
                    draftFilters.min_rating === opt.value
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
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendimento e Recursos</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2.5 h-11 border border-slate-200 rounded-xl px-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.whatsapp_enabled}
                  onChange={(e) => updateDraft({ whatsapp_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-xs font-bold text-slate-600">WhatsApp disponível</span>
              </label>

              <label className="flex items-center gap-2.5 h-11 border border-slate-200 rounded-xl px-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.financing_enabled}
                  onChange={(e) => updateDraft({ financing_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-xs font-bold text-slate-600">Financiamento</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors h-11 px-4"
          >
            Limpar filtros
          </button>

          <button
            type="button"
            onClick={() => onApply(draftFilters)}
            disabled={loadingCount}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-11 flex items-center justify-center gap-1.5 transition-colors disabled:bg-blue-400"
          >
            {loadingCount && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {loadingCount
                ? 'Contando...'
                : totalCount !== null
                ? `Ver ${totalCount} ${totalCount === 1 ? 'empresa' : 'empresas'}`
                : 'Aplicar filtros'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
