'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import CatalogItemCard, { CatalogItem } from './CatalogItemCard';

export interface CatalogTab {
  key: string;
  label: string;
  count: number;
}

export interface ShowcaseData {
  company_id: number;
  selected_tab: string;
  tabs: CatalogTab[];
  items: CatalogItem[];
  max_items: number;
  has_more: boolean;
  total_count: number;
}

interface CompanyCatalogShowcaseProps {
  companyId: number | string;
  companySlug?: string;
  onTabChange?: (tab: string) => void;
  initialItems?: CatalogItem[];
}

export default function CompanyCatalogShowcase({
  companyId,
  companySlug,
  onTabChange,
  initialItems,
}: CompanyCatalogShowcaseProps) {
  const [tabs, setTabs] = useState<CatalogTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [items, setItems] = useState<CatalogItem[]>(initialItems || []);
  const [loading, setLoading] = useState(!initialItems || initialItems.length === 0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const activeRequestId = useRef(0);

  useEffect(() => {
    let isCurrent = true;
    const reqId = ++activeRequestId.current;

    setLoading(true);

    fetchApi<{ data?: ShowcaseData }>(
      `/companies/${companyId}/catalog/showcase`,
      {
        params: { tab: activeTab, limit: 5 },
      },
    )
      .then((res) => {
        if (!isCurrent || reqId !== activeRequestId.current) return;

        const data = res?.data;
        if (data) {
          setTabs(data.tabs || []);
          setItems(data.items || []);
        }
      })
      .catch(() => {
        // Keeps previous or initial items gracefully
      })
      .finally(() => {
        if (isCurrent && reqId === activeRequestId.current) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [companyId, activeTab]);

  // Se já carregou e o total de itens for 0, não exibe o bloco vazio
  if (hasLoadedOnce && tabs.length === 0 && items.length === 0) {
    return null;
  }

  const handleTabClick = (tabKey: string) => {
    if (tabKey === activeTab) return;
    setActiveTab(tabKey);
  };

  const handleViewAll = () => {
    if (onTabChange) {
      onTabChange('products');
    } else if (companySlug) {
      window.location.href = `/companies/${companySlug}#products`;
    }
  };

  return (
    <section
      aria-labelledby="catalog-showcase-title"
      className="
        relative my-3 md:my-5 overflow-hidden rounded-[14px] md:rounded-[16px]
        border border-slate-200 bg-white p-3 sm:p-4 md:p-5
        shadow-[0_2px_10px_rgba(15,23,42,0.035)]
      "
    >
      {/* ------------------------------------------------------------------ */}
      {/* CABEÇALHO: Título SEM estrela + Ver todos                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3
          id="catalog-showcase-title"
          className="text-sm font-bold tracking-tight text-slate-900 sm:text-base md:text-lg"
        >
          Produtos e serviços
        </h3>

        <button
          type="button"
          onClick={handleViewAll}
          className="
            inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5
            text-xs font-semibold text-blue-600 transition-colors
            hover:text-blue-700 hover:underline
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          "
        >
          <span>Ver todos</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ABAS DINÂMICAS POR CATEGORIA (Pills com contadores reais)          */}
      {/* ------------------------------------------------------------------ */}
      {tabs.length > 0 && (
        <div
          role="tablist"
          aria-label="Categorias do catálogo"
          className="
            mb-3.5 flex flex-nowrap items-center gap-1.5 sm:gap-2
            overflow-x-auto scrollbar-none py-0.5
          "
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`
                  shrink-0 rounded-[9px] px-3 py-1.5 text-xs font-medium transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  ${
                    isActive
                      ? 'bg-[#081327] font-semibold text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-slate-200/80 hover:text-slate-900'
                  }
                `}
              >
                {tab.label}{' '}
                <span className={isActive ? 'text-slate-300' : 'text-slate-400'}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TRILHA DE 5 CARDS EM UMA ÚNICA LINHA SEM WRAP                       */}
      {/* Desktop: 5 colunas iguais | PWA: scroll horizontal acessível       */}
      {/* ------------------------------------------------------------------ */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="
          w-full
          grid grid-flow-col auto-cols-[clamp(134px,38vw,168px)] gap-2 sm:gap-2.5
          overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-thin pb-1
          md:grid-flow-row md:grid-cols-5 md:auto-cols-auto md:overflow-visible
        "
      >
        {loading && items.length === 0 ? (
          // Skeleton loader com 5 cards na mesma trilha
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="
                snap-start min-w-0 flex flex-col rounded-[12px] border border-slate-100 bg-slate-50/50 p-3
              "
            >
              <div className="aspect-square w-full animate-pulse rounded-lg bg-slate-200/80 mb-2.5" />
              <div className="h-4 w-14 animate-pulse rounded bg-slate-200/80 mb-2" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200/80 mb-1" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/80 mb-4" />
              <div className="mt-auto h-9 w-full animate-pulse rounded-lg bg-slate-200/80" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <div key={item.id} className="snap-start min-w-0 h-full">
              <CatalogItemCard item={item} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-6 text-center text-xs text-slate-400">
            Nenhum item disponível nesta categoria.
          </div>
        )}
      </div>
    </section>
  );
}
