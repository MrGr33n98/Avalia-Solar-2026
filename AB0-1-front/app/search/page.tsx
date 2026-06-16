'use client';

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchApi } from '@/lib/api';
import type { SearchAllResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search, X, SlidersHorizontal, Building2, Package, Tag, FileText,
  BadgeCheck, Star, TrendingUp, Zap, MessageCircle, ChevronRight,
  ArrowUpDown, Sparkles, RotateCcw, Diamond, Map as MapIcon,
} from 'lucide-react';
import CompanyCard from '@/components/CompanyCard';
import ProductCard from '@/components/ProductCard';
import BannerByLocation from '@/components/BannerByLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { buildCategoryPath } from '@/lib/slug';
import { track, page as trackPage } from '@/lib/analytics/lazy';
import { trackEvent } from '@/lib/analytics/events';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from '@/components/BannerContainer';
import { cn } from '@/lib/utils';
// === GEO ===
import SearchRadiusFilter from '@/components/search/SearchRadiusFilter';
import dynamic from 'next/dynamic';
const SearchMapPanel = dynamic(() => import('@/components/search/SearchMapPanel'), { ssr: false });
import { SearchExploreView } from '@/components/search/SearchExploreView';

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recomendados', icon: Sparkles },
  { value: 'rating',      label: 'Melhor avaliados', icon: Star },
  { value: 'reviews',     label: 'Mais avaliações', icon: TrendingUp },
  { value: 'verified',    label: 'Premium primeiro', icon: Sparkles },
  { value: 'name',        label: 'A–Z', icon: ArrowUpDown },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNumericField(obj: any, ...keys: string[]): number {
  for (const k of keys) {
    const v = parseFloat(obj?.[k]);
    if (!isNaN(v)) return v;
  }
  return 0;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function CompanyCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/95 shadow-sm">
      <Skeleton className="h-[80px] w-full" />
      <div className="px-3.5 pt-5 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-9 w-full rounded-xl mt-2" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-lg mt-3" />
      </div>
    </div>
  );
}

// ─── SearchSidebar (desktop) ──────────────────────────────────────────────────
const MAP_ENABLED = true; // Forçado para melhoria da experiência de busca

interface SidebarProps {
  sort: SortValue;
  onSortChange: (v: SortValue) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
  whatsappOnly: boolean;
  onWhatsappChange: (v: boolean) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  // GEO
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  cityName?: string;
  showMap?: boolean;
  onToggleMap?: () => void;
}


function SearchSidebar({
  sort, onSortChange,
  verifiedOnly, onVerifiedChange,
  whatsappOnly, onWhatsappChange,
  onReset, hasActiveFilters,
  radiusKm, onRadiusChange, onCoordsChange, cityName,
  showMap, onToggleMap,
}: SidebarProps) {
  return (
    <aside className="w-[264px] flex-shrink-0 sticky top-[calc(88px+var(--safe-area-inset-top))] h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 hidden lg:block">
      <div className="clay-panel bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Filtros</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Ordenar</p>
          <div className="space-y-0.5">
            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onSortChange(value)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 text-sm',
                  sort === value
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', sort === value ? 'text-blue-500' : 'text-slate-400')} />
                {label}
                {sort === value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

        {/* Quick filters */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Refinamentos</p>
          <div className="space-y-2">
            <ToggleRow
              icon={Diamond}
              iconClass="text-blue-500"
              label="Somente Premium"
              checked={verifiedOnly}
              onChange={onVerifiedChange}
            />
            <ToggleRow
              icon={MessageCircle}
              iconClass="text-emerald-500"
              label="Com WhatsApp"
              checked={whatsappOnly}
              onChange={onWhatsappChange}
            />
          </div>
        </div>

        {/* GEO: Filtro de raio */}
        {MAP_ENABLED && (
          <>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />
            <SearchRadiusFilter
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onCoordsChange={onCoordsChange}
              cityName={cityName}
            />
            {/* Toggle mapa */}
            <button
              id="sidebar-toggle-map-btn"
              onClick={onToggleMap}
              className={cn(
                'mt-3 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border',
                showMap
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600'
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
              {showMap ? 'Ocultar mapa' : 'Ver no mapa'}
            </button>
          </>
        )}

        {/* Status indicator */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {hasActiveFilters ? 'Filtros aplicados' : 'Sem restrições'}
            </span>
            <span className={cn(
              'w-2 h-2 rounded-full',
              hasActiveFilters
                ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                : 'bg-slate-200 dark:bg-slate-700'
            )} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function ToggleRow({
  icon: Icon, iconClass, label, checked, onChange,
}: {
  icon: React.ElementType;
  iconClass?: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150',
        checked
          ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200/60 dark:ring-blue-800/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', checked ? iconClass : 'text-slate-400')} />
      <span className={cn(
        'text-sm flex-1',
        checked ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-600 dark:text-slate-400 font-medium'
      )}>
        {label}
      </span>
      <span className={cn(
        'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
        checked
          ? 'bg-blue-600 border-blue-600'
          : 'border-slate-300 dark:border-slate-600'
      )}>
        {checked && <span className="block w-2 h-1 border-b-2 border-l-2 border-white transform -rotate-45 -mt-0.5" />}
      </span>
    </button>
  );
}

// ─── Mobile filters sheet ─────────────────────────────────────────────────────
function MobileFilterSheet({
  sort, onSortChange,
  verifiedOnly, onVerifiedChange,
  whatsappOnly, onWhatsappChange,
  onReset, hasActiveFilters,
  radiusKm, onRadiusChange, onCoordsChange, cityName,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB trigger */}
      <div className="lg:hidden fixed bottom-[max(1.5rem,var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="clay-btn-primary rounded-full shadow-2xl px-7 h-13 gap-2.5 border-none text-sm font-bold">
              <SlidersHorizontal className="w-4 h-4" />
              Ordenar & Filtrar
              {hasActiveFilters && (
                <span className="ml-1 bg-white/20 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-white/30">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[88vh] rounded-t-[28px] border-none p-0 shadow-2xl overflow-hidden"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-black tracking-tight">Ordenar & Filtrar</SheetTitle>
                {hasActiveFilters && (
                  <button
                    onClick={() => { onReset(); setOpen(false); }}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpar tudo
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="overflow-y-auto px-6 py-5 pb-40 h-full">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Ordenar por</p>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => onSortChange(value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all duration-150 text-sm font-medium',
                        sort === value
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-slate-300'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {MAP_ENABLED && (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />
                  <div className="mb-6">
                    <SearchRadiusFilter
                      radiusKm={radiusKm}
                      onRadiusChange={onRadiusChange}
                      onCoordsChange={onCoordsChange}
                      cityName={cityName}
                    />
                  </div>
                </>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Refinamentos</p>
                <div className="space-y-2.5">
                  <MobileToggleRow
                    icon={Diamond}
                    iconClass="text-blue-500"
                    label="Somente Premium"
                    sublabel="Empresas com selo Diamond de confiança"
                    checked={verifiedOnly}
                    onChange={onVerifiedChange}
                  />
                  <MobileToggleRow
                    icon={MessageCircle}
                    iconClass="text-emerald-500"
                    label="Com WhatsApp"
                    sublabel="Contato direto disponível"
                    checked={whatsappOnly}
                    onChange={onWhatsappChange}
                  />
                </div>
              </div>

            </div>

            {/* Sticky footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent px-6 pt-8 pb-[max(1.5rem,var(--safe-area-inset-bottom))]">
              <Button
                className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl"
                onClick={() => setOpen(false)}
              >
                Ver resultados
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function MobileToggleRow({
  icon: Icon, iconClass, label, sublabel, checked, onChange,
}: {
  icon: React.ElementType;
  iconClass?: string;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150',
        checked
          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', checked ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-700')}>
        <Icon className={cn('w-4.5 h-4.5', checked ? iconClass : 'text-slate-400')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', checked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200')}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
        checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
      )}>
        {checked && <span className="block w-2 h-1 border-b-2 border-l-2 border-white transform -rotate-45 -mt-0.5" />}
      </div>
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, label, count, colorClass,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{label}</h2>
      <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tabular-nums">({count})</span>
    </div>
  );
}

// ─── Sort bar inline (mobile / above results) ─────────────────────────────────
function SortChips({
  sort, onSortChange,
}: {
  sort: SortValue;
  onSortChange: (v: SortValue) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1"
    >
      {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onSortChange(value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-150 flex-shrink-0',
            sort === value
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Active filter chips ──────────────────────────────────────────────────────
function ActiveFilterChips({
  verifiedOnly, whatsappOnly,
  onVerifiedChange, onWhatsappChange,
}: {
  verifiedOnly: boolean;
  whatsappOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
  onWhatsappChange: (v: boolean) => void;
}) {
  if (!verifiedOnly && !whatsappOnly) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {verifiedOnly && (
        <button
          onClick={() => onVerifiedChange(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
        >
          Premium
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}
      {whatsappOnly && (
        <button
          onClick={() => onWhatsappChange(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          Com WhatsApp
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const SEARCH_SUGGESTIONS = [
  'Inversores solares', 'Painel fotovoltaico', 'Energia solar residencial',
  'Instalação solar', 'Financiamento solar', 'WEG', 'Fronius', 'SMA',
];

function EmptyState({ query, onSearch }: { query: string; onSearch: (term: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-5 shadow-sm">
        <Search className="w-7 h-7 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
        {query ? (
          <>Nenhum resultado para <span className="text-blue-600 dark:text-blue-400">&ldquo;{query}&rdquo;</span></>
        ) : (
          <>Nenhuma empresa ou produto encontrado</>
        )}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Tente um termo diferente, ajuste seus filtros ou explore sugestões abaixo.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {SEARCH_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSearch(s)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Mid-results banner ───────────────────────────────────────────────────────
function MidBanner({ banners }: { banners: any[] }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!banners?.length) return null;
  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">Patrocinado</span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      </div>
      <BannerContainer banners={banners} position="search_mid" />
    </div>
  );
}

// ─── Category pill ────────────────────────────────────────────────────────────
function CategoryPill({ category, onClick }: { category: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-150 text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
        <Tag className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{category.name}</p>
        {(category.short_description || category.description) && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {category.short_description || category.description}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
    </button>
  );
}

// ─── Article row ──────────────────────────────────────────────────────────────
function ArticleRow({ article, onClick }: { article: any; onClick: () => void }) {
  const content = article.content
    ? article.content.toString().replace(/<[^>]+>/g, '').slice(0, 120)
    : '';
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-150 text-left group w-full"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {article.title}
        </p>
        {content && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{content}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
    </button>
  );
}

// ─── Main search content ──────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  // Read initial filter state from URL params
  const initialSort = (searchParams.get('sort') as SortValue) || 'recommended';
  const initialVerified = searchParams.get('verified') === 'true';
  const initialWhatsapp = searchParams.get('whatsapp') === 'true';
  const initialTab = searchParams.get('tab') || 'companies';
  const initialRadius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : null;
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const initialLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const initialCoords = (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : null;

  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState<Pick<SearchAllResponse, 'companies' | 'products' | 'categories' | 'articles'>>({
    companies: [], products: [], categories: [], articles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sidebar / filter state — initialised from URL
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified);
  const [whatsappOnly, setWhatsappOnly] = useState(initialWhatsapp);

  // === GEO state ===
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [radiusKm, setRadiusKm] = useState<number | null>(initialRadius);
  const [showMap, setShowMap] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>();

  const handleSearchInArea = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    // Para o map bounds: por ora salva como estado e re-busca
    // Implementação futura: passa map_bounds para a API GraphQL
    track('map_area_searched', { bounds });
  }, []);

  const handleMapCompanySelect = useCallback((company: { id: string }) => {
    setSelectedCompanyId(company.id);
    track('map_pin_clicked', { company_id: company.id });
  }, []);

  // Helper: push filter changes to URL without losing ?q=
  const pushFilterParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'false' || value === 'recommended') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Banner queries
  const { data: topBanners = [] }  = useBannersQuery({ position: 'search_top', limit: 3, enabled: true });
  const { data: midBanners = [] }  = useBannersQuery({ position: 'search_mid', limit: 2, enabled: true });
  // Fallback to home_top banners if no search-specific ones
  const { data: fallbackBanners = [] } = useBannersQuery({
    position: 'home_top',
    limit: 2,
    enabled: topBanners.length === 0,
  });
  const effectiveTopBanners = topBanners.length > 0 ? topBanners : fallbackBanners;

  const hasActiveFilters = sort !== 'recommended' || verifiedOnly || whatsappOnly || radiusKm !== null || geoCoords !== null;

  // Track page view on mount
  useEffect(() => {
    trackPage('search', { search_term: query || undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = useCallback(() => {
    track('search_filters_cleared', { search_term: query });
    setSort('recommended');
    setVerifiedOnly(false);
    setWhatsappOnly(false);
    setRadiusKm(null);
    setGeoCoords(null);
    pushFilterParams({
      sort: undefined,
      verified: undefined,
      whatsapp: undefined,
      radius: undefined,
      lat: undefined,
      lng: undefined,
    });
  }, [query, pushFilterParams]);

  // Typed sort change handler with tracking + URL sync
  const handleSortChange = useCallback((value: SortValue) => {
    setSort(value);
    pushFilterParams({ sort: value });
    trackEvent('sort_change', {
      sort_by: value as any,
      category: `search:${query}`,
    });
    track('search_sort_changed', {
      search_term: query,
      sort_value: value,
    });
  }, [query, pushFilterParams]);

  // Filter toggle handlers with tracking + URL sync
  const handleVerifiedChange = useCallback((value: boolean) => {
    setVerifiedOnly(value);
    pushFilterParams({ verified: value ? 'true' : undefined });
    track('search_filter_applied', {
      search_term: query,
      filter_key: 'verified_only',
      filter_value: value,
    });
  }, [query, pushFilterParams]);

  const handleWhatsappChange = useCallback((value: boolean) => {
    setWhatsappOnly(value);
    pushFilterParams({ whatsapp: value ? 'true' : undefined });
    track('search_filter_applied', {
      search_term: query,
      filter_key: 'whatsapp_only',
      filter_value: value,
    });
  }, [query, pushFilterParams]);

  const handleRadiusChange = useCallback((value: number | null) => {
    setRadiusKm(value);
    pushFilterParams({ radius: value ? value.toString() : undefined });
    track('search_filter_applied', {
      search_term: query,
      filter_key: 'radius_km',
      filter_value: value,
    });
  }, [query, pushFilterParams]);

  const handleCoordsChange = useCallback((coords: { lat: number; lng: number } | null) => {
    setGeoCoords(coords);
    pushFilterParams({
      lat: coords ? coords.lat.toString() : undefined,
      lng: coords ? coords.lng.toString() : undefined,
    });
    track('search_filter_applied', {
      search_term: query,
      filter_key: 'coords',
      filter_value: coords ? `${coords.lat},${coords.lng}` : null,
    });
  }, [query, pushFilterParams]);

  // Perform search
  const performSearch = useCallback(async (term: string) => {
    const searchStartedAt = Date.now();
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (geoCoords?.lat && geoCoords?.lng && radiusKm) {
        filters.latitude = geoCoords.lat;
        filters.longitude = geoCoords.lng;
        filters.radius_km = radiusKm;
      }
      
      const res = await searchApi.all(term, filters);
      const final = {
        companies:  res.companies  ?? [],
        products:   res.products   ?? [],
        categories: res.categories ?? [],
        articles:   res.articles   ?? [],
      };
      setResults(final);

      const total = Object.values(final).reduce((acc, arr) => acc + arr.length, 0);
      const latencyMs = Date.now() - searchStartedAt;

      if (total === 0) {
        // Typed event for search_no_results
        trackEvent('search_no_results', { search_term: term, search_category: 'all' });
      } else {
        track('search_results_loaded', {
          search_term: term,
          total_results: total,
          companies_count:  final.companies.length,
          products_count:   final.products.length,
          categories_count: final.categories.length,
          articles_count:   final.articles.length,
          latency_ms: latencyMs,
        });
      }
    } catch (err: any) {
      track('search_error', {
        search_term: term,
        error_message: err?.message || 'unknown',
      });
      setError(err?.message || 'Erro ao realizar a busca');
    } finally {
      setLoading(false);
    }
  }, [geoCoords, radiusKm]);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      track('search_submitted', {
        search_term: searchTerm,
        source: 'search_bar',
      });
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionSearch = (term: string) => {
    track('search_suggestion_clicked', {
      suggestion: term,
      origin_query: query || '',
    });
    setSearchTerm(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearSearch = () => {
    track('search_cleared', { previous_term: query });
    setSearchTerm('');
    router.push('/search');
    setResults({ companies: [], products: [], categories: [], articles: [] });
  };

  // Processed companies (sorted + filtered)
  const processedCompanies = useMemo(() => {
    let list = [...results.companies];
    if (verifiedOnly)  list = list.filter((c: any) => c.verified);
    if (whatsappOnly)  list = list.filter((c: any) => c.whatsapp_enabled || c.whatsapp_url || c.whatsapp);

    switch (sort) {
      case 'rating':
        list.sort((a, b) =>
          getNumericField(b, 'average_rating', 'rating_avg', 'rating') -
          getNumericField(a, 'average_rating', 'rating_avg', 'rating')
        );
        break;
      case 'reviews':
        list.sort((a, b) =>
          getNumericField(b, 'rating_count', 'total_reviews', 'reviews_count') -
          getNumericField(a, 'rating_count', 'total_reviews', 'reviews_count')
        );
        break;
      case 'verified':
        list.sort((a: any, b: any) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        break;
    }
    return list;
  }, [results.companies, sort, verifiedOnly, whatsappOnly]);

  // Tab counts
  const counts = {
    companies:  processedCompanies.length,
    products:   results.products.length,
    categories: results.categories.length,
    articles:   results.articles.length,
  };
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasResults = totalCount > 0;

  // Tab change with tracking + URL sync
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    pushFilterParams({ tab: tab === 'companies' ? undefined : tab });
    track('search_tab_changed', {
      search_term: query,
      tab,
      counts,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pushFilterParams]);

  // Auto-select tab with results
  useEffect(() => {
    if (!loading && hasResults) {
      if (counts.companies > 0)  { setActiveTab('companies');  return; }
      if (counts.products > 0)   { setActiveTab('products');   return; }
      if (counts.categories > 0) { setActiveTab('categories'); return; }
      if (counts.articles > 0)   { setActiveTab('articles');   return; }
    }
  }, [loading, hasResults, counts.companies, counts.products, counts.categories, counts.articles]);

  // Companies split for mid-banner
  const companiesAboveFold = processedCompanies.slice(0, 6);
  const companiesBelowFold = processedCompanies.slice(6);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">

      {/* ── Search Hero Header ──────────────────────────────────────────── */}
      <div 
        className="text-white relative overflow-hidden shadow-md z-40 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/banner-landing-page-avalia-solar.jpg')" }}
      >
        <div className="absolute inset-0 bg-blue-900/80 dark:bg-slate-900/90 mix-blend-multiply pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-4 py-12 sm:py-16 relative z-10 flex flex-col items-center text-center">
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight text-white drop-shadow-sm">
            Encontre a energia certa para você
          </h1>
          <p className="text-blue-100/90 mb-8 max-w-2xl text-sm sm:text-base md:text-lg font-medium">
            Busque instaladores, produtos ou avaliações na maior plataforma solar do Brasil.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="w-full max-w-3xl flex gap-3 mb-6 relative">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={22} />
              <label htmlFor="search-input" className="sr-only">Buscar empresas, produtos ou serviços</label>
              <Input
                id="search-input"
                name="q"
                type="text"
                placeholder="Ex: Inversores, WEG, ou instaladores em SP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-12 h-14 sm:h-16 text-base sm:text-lg bg-white text-slate-900 border-0 focus-visible:ring-4 focus-visible:ring-blue-500/30 rounded-2xl shadow-xl transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base sm:text-lg shadow-xl shrink-0 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Procurar
            </Button>
          </form>

          {/* Result context */}
          {query && !loading && (
            <div className="flex items-center gap-2 flex-wrap justify-center bg-white/10 backdrop-blur-md py-2 px-4 rounded-full border border-white/20 shadow-inner">
              {hasResults ? (
                <>
                  <span className="text-sm font-medium text-white">
                    <span className="font-bold tabular-nums">{totalCount}</span>
                    {' '}resultado{totalCount !== 1 ? 's' : ''} para{' '}
                    <span className="font-bold text-amber-300">&ldquo;{query}&rdquo;</span>
                  </span>
                  {counts.companies > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-white/30 px-2.5 py-0.5 h-6 font-bold shadow-sm">
                      {counts.companies} empresa{counts.companies !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </>
              ) : !error ? (
                <span className="text-sm font-medium text-white">
                  Nenhum resultado para <span className="font-bold text-amber-300">&ldquo;{query}&rdquo;</span>
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ── Top banner ──────────────────────────────────────────────── */}
      {effectiveTopBanners.length > 0 && (
        <div className="border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/80">
          <div className="container mx-auto px-4 py-3">
            <BannerContainer banners={effectiveTopBanners as any[]} position="search_top" />
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        </div>
      )}

      {/* ── Loading skeletons ────────────────────────────────────────── */}
      {loading && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar skeleton */}
            <div className="w-[264px] flex-shrink-0 hidden lg:block">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            </div>
            {/* Results skeleton */}
            <div className="flex-1 min-w-0">
              <Skeleton className="h-10 w-full rounded-xl mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <CompanyCardSkeleton key={i} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!loading && !error && (
          <motion.div
            key={query || 'all'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="container mx-auto px-4 py-6 pb-24 lg:pb-6"
          >
            {!hasResults ? (
              !query && !hasActiveFilters ? (
                <SearchExploreView onSuggestionClick={handleSuggestionSearch} />
              ) : (
                <EmptyState query={query} onSearch={handleSuggestionSearch} />
              )
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange}>

                {/* Tab bar */}
                <div className="mb-5 overflow-x-auto scrollbar-none -mx-1 px-1">
                  <TabsList className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-1 gap-0.5 h-auto shadow-sm w-auto inline-flex">
                    {counts.companies > 0 && (
                      <TabsTrigger value="companies" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 transition-all duration-150">
                        <Building2 className="w-3.5 h-3.5" />
                        Empresas
                        <span className="ml-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full px-1.5 py-0 text-[10px] font-bold tabular-nums">
                          {counts.companies}
                        </span>
                      </TabsTrigger>
                    )}
                    {counts.products > 0 && (
                      <TabsTrigger value="products" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 transition-all duration-150">
                        <Package className="w-3.5 h-3.5" />
                        Produtos
                        <span className="ml-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                          {counts.products}
                        </span>
                      </TabsTrigger>
                    )}
                    {counts.categories > 0 && (
                      <TabsTrigger value="categories" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 transition-all duration-150">
                        <Tag className="w-3.5 h-3.5" />
                        Categorias
                        <span className="ml-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                          {counts.categories}
                        </span>
                      </TabsTrigger>
                    )}
                    {counts.articles > 0 && (
                      <TabsTrigger value="articles" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 transition-all duration-150">
                        <FileText className="w-3.5 h-3.5" />
                        Artigos
                        <span className="ml-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                          {counts.articles}
                        </span>
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                {/* ── Companies tab ────────────────────────────────── */}
                {counts.companies > 0 && (
                  <TabsContent value="companies" className="mt-0">
                    <div className="flex flex-col lg:flex-row gap-6 w-full mx-auto">
                      
                      {/* Left Column (Results 60%) */}
                      <div className="flex-1 lg:w-[60%] flex flex-col min-w-0 pb-12">
                        
                        {/* Horizontal Filter Bar (Desktop) */}
                        <div className="hidden lg:flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Filtros:</span>
                          </div>
                          
                          <SearchRadiusFilter
                            radiusKm={radiusKm}
                            onRadiusChange={handleRadiusChange}
                            onCoordsChange={handleCoordsChange}
                            cityName={searchParams.get('city') || undefined}
                          />

                          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                          <SortChips sort={sort} onSortChange={handleSortChange} />
                          
                          <div className="ml-auto flex items-center gap-2">
                            <ActiveFilterChips
                              verifiedOnly={verifiedOnly}
                              whatsappOnly={whatsappOnly}
                              onVerifiedChange={handleVerifiedChange}
                              onWhatsappChange={handleWhatsappChange}
                            />
                            {hasActiveFilters && (
                              <button
                                onClick={resetFilters}
                                className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors ml-2"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile sort chips (hidden on desktop) */}
                        <div className="lg:hidden mb-4">
                          <SortChips sort={sort} onSortChange={handleSortChange} />
                        </div>

                        {/* GEO: Botão "Ver no mapa" mobile */}
                        {MAP_ENABLED && (
                          <div className="lg:hidden flex justify-end mb-3">
                            <button
                              id="mobile-show-map-btn"
                              onClick={() => { setShowMap(!showMap); track('map_opened', { source: 'mobile_btn' }); }}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                                showMap
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              )}
                            >
                              <MapIcon className="w-3 h-3" />
                              {showMap ? 'Ocultar mapa' : 'Ver no mapa'}
                            </button>
                          </div>
                        )}

                        {/* Active filter chips */}
                        <ActiveFilterChips
                          verifiedOnly={verifiedOnly}
                          whatsappOnly={whatsappOnly}
                          onVerifiedChange={handleVerifiedChange}
                          onWhatsappChange={handleWhatsappChange}
                        />

                        {/* GEO: Mapa mobile (fullscreen quando ativo) */}
                        {MAP_ENABLED && showMap && (
                          <div className="lg:hidden w-full h-[55vh] mb-4 rounded-2xl overflow-hidden">
                            <SearchMapPanel
                              companies={(processedCompanies as any[]).map((c: any) => ({
                                id: c.id, name: c.name, slug: c.slug,
                                latitude: c.latitude, longitude: c.longitude,
                                ratingAvg: c.ratingAvg ?? c.rating_avg,
                                isSponsored: c.isSponsored ?? c.sponsored,
                                logo_url: c.logo_url,
                                city: c.city, state: c.state,
                              }))}
                              center={geoCoords ?? undefined}
                              radiusKm={radiusKm ?? undefined}
                              selectedCompanyId={selectedCompanyId}
                              onCompanySelect={handleMapCompanySelect}
                              onSearchInArea={handleSearchInArea}
                              onClose={() => setShowMap(false)}
                            />
                          </div>
                        )}

                        {/* Result count bar */}
                        <div className={cn(
                          'flex items-center justify-between mb-4',
                          (verifiedOnly || whatsappOnly) ? 'mt-3' : ''
                        )}>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{processedCompanies.length}</span>
                            {' '}empresa{processedCompanies.length !== 1 ? 's' : ''}
                            {hasActiveFilters && (
                              <span className="text-slate-400"> (filtradas)</span>
                            )}
                          </p>
                          {/* Desktop sort label */}
                          <span className="hidden lg:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <ArrowUpDown className="w-3 h-3" />
                            {SORT_OPTIONS.find(o => o.value === sort)?.label}
                          </span>
                        </div>

                        {processedCompanies.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Nenhuma empresa encontrada com os filtros aplicados.{' '}
                              <button onClick={resetFilters} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                Limpar filtros
                              </button>
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Above-fold results */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                              {companiesAboveFold.map((company, i) => (
                                <motion.div
                                  key={company.id}
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.04, duration: 0.2, ease: 'easeOut' }}
                                >
                                  <CompanyCard
                                    company={company}
                                    rank={i + 1 <= 3 ? i + 1 : undefined}
                                    index={i}
                                  />
                                </motion.div>
                              ))}
                            </div>

                            {/* Mid-banner after 6th result */}
                            {companiesBelowFold.length > 0 && (
                              <MidBanner banners={midBanners} />
                            )}

                            {/* Below-fold results */}
                            {companiesBelowFold.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                                {companiesBelowFold.map((company, i) => (
                                  <motion.div
                                    key={company.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i + 6) * 0.03, duration: 0.2, ease: 'easeOut' }}
                                  >
                                    <CompanyCard company={company} index={i + 6} />
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right Column (Map 40%) */}
                      {MAP_ENABLED && showMap ? (
                        <aside className="hidden lg:flex flex-col gap-4 lg:w-[40%] shrink-0 sticky top-4 h-[calc(100vh-2rem)]">
                          <BannerByLocation location="sidebar" />
                          <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 relative">
                            <SearchMapPanel
                              companies={(processedCompanies as any[]).map((c: any) => ({
                                id: c.id, name: c.name, slug: c.slug,
                                latitude: c.latitude, longitude: c.longitude,
                                ratingAvg: c.ratingAvg ?? c.rating_avg,
                                isSponsored: c.isSponsored ?? c.sponsored,
                                logo_url: c.logo_url,
                                city: c.city, state: c.state,
                              }))}
                              center={geoCoords ?? undefined}
                              radiusKm={radiusKm ?? undefined}
                              selectedCompanyId={selectedCompanyId}
                              onCompanySelect={handleMapCompanySelect}
                              onSearchInArea={handleSearchInArea}
                              onClose={() => setShowMap(false)}
                              className="absolute inset-0 w-full h-full"
                            />
                          </div>
                        </aside>
                      ) : (
                        <aside className="hidden xl:flex flex-col gap-4 w-[300px] shrink-0 sticky top-4">
                          <BannerByLocation location="sidebar" />
                        </aside>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* ── Products tab ─────────────────────────────────── */}
                {counts.products > 0 && (
                  <TabsContent value="products" className="mt-0">
                    <SectionHeader
                      icon={Package}
                      label="Produtos"
                      count={counts.products}
                      colorClass="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {results.products.map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* ── Categories tab ───────────────────────────────── */}
                {counts.categories > 0 && (
                  <TabsContent value="categories" className="mt-0">
                    <SectionHeader
                      icon={Tag}
                      label="Categorias"
                      count={counts.categories}
                      colorClass="bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {results.categories.map((cat, i) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                        >
                          <CategoryPill
                            category={cat}
                            onClick={() => {
                              track('search_category_clicked', {
                                search_term: query,
                                category_id: cat.id,
                                category_name: cat.name,
                                position: i,
                              });
                              router.push(buildCategoryPath(cat.seo_url, cat.id));
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* ── Articles tab ─────────────────────────────────── */}
                {counts.articles > 0 && (
                  <TabsContent value="articles" className="mt-0">
                    <SectionHeader
                      icon={FileText}
                      label="Artigos"
                      count={counts.articles}
                      colorClass="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {results.articles.map((article, i) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                        >
                          <ArticleRow
                            article={article}
                            onClick={() => {
                              track('search_article_clicked', {
                                search_term: query,
                                article_id: article.id,
                                article_title: article.title,
                                position: i,
                              });
                              router.push(`/articles/${article.id}`);
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile filter FAB ────────────────────────────────────────── */}
      {hasResults && activeTab === 'companies' && (
        <MobileFilterSheet
          sort={sort}
          onSortChange={handleSortChange}
          verifiedOnly={verifiedOnly}
          onVerifiedChange={handleVerifiedChange}
          whatsappOnly={whatsappOnly}
          onWhatsappChange={handleWhatsappChange}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          radiusKm={radiusKm}
          onRadiusChange={handleRadiusChange}
          onCoordsChange={handleCoordsChange}
          cityName={searchParams.get('city') || undefined}
        />
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[hsl(var(--background))]">
          <div className="bg-white dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 px-4 py-5">
            <Skeleton className="h-11 w-full rounded-xl mb-3" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-6">
              <Skeleton className="hidden lg:block w-[264px] h-80 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <CompanyCardSkeleton key={i} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
