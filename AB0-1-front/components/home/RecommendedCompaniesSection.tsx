'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import RecommendedCompanyCard from '@/components/company/RecommendedCompanyCard';
import { publicCompaniesApi } from '@/lib/api-public';
import type { RecommendationItem, RecommendationMeta } from '@/lib/api-public';

type TabOption = {
  id: string;
  label: string;
  segment?: string;
};

const TABS: TabOption[] = [
  { id: 'all', label: 'Todas' },
  { id: 'installer', label: 'Instaladores', segment: 'installer' },
  { id: 'supplier', label: 'Equipamentos', segment: 'supplier' },
  { id: 'finance', label: 'Financiamento', segment: 'finance' },
  { id: 'integrator', label: 'Mobilidade', segment: 'integrator' },
];

type RecommendedCompaniesSectionProps = {
  initialCompanies?: any[];
};

export default function RecommendedCompaniesSection({ initialCompanies }: RecommendedCompaniesSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [meta, setMeta] = useState<RecommendationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchRecommendations = useCallback(async (tabSegment?: string) => {
    setLoading(true);
    setError(false);
    try {
      const response = await publicCompaniesApi.getRecommendations({
        segment: tabSegment,
        limit: 8,
      });

      if (response && Array.isArray(response.data) && response.data.length > 0) {
        setItems(response.data);
        setMeta(response.meta || null);
      } else {
        setItems([]);
        setMeta(response?.meta || null);
      }
    } catch (err) {
      console.error('[RecommendedCompaniesSection] Error fetching recommendations:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentTab = TABS.find((t) => t.id === activeTab);
    fetchRecommendations(currentTab?.segment);
  }, [activeTab, fetchRecommendations]);

  const resolvedLocation = meta?.location?.city && meta?.location?.state
    ? `${meta.location.city}, ${meta.location.state}`
    : meta?.location?.state
    ? meta.location.state
    : 'sua região';

  return (
    <section className="py-12 bg-slate-50/50 border-y border-slate-100" aria-labelledby="recommended-companies-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-blue-800 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>Seleção Contextual</span>
            </div>
            <h2 id="recommended-companies-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Empresas recomendadas para você
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
              <span>
                Perfis em destaque com sinais de reputação e cobertura para{' '}
                <strong className="font-bold text-slate-900">{resolvedLocation}</strong>
              </span>
            </p>
          </div>

          <Link
            href="/empresas"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800 transition group self-start md:self-auto"
          >
            <span>Ver todas as empresas</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="mb-8 border-b border-slate-200 overflow-x-auto pb-1" role="tablist" aria-label="Filtro por segmento">
          <div className="flex gap-2 min-w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-2 border-t pt-4">
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-2">
                    <div className="h-10 bg-slate-200 rounded-xl" />
                    <div className="h-10 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" aria-hidden="true" />
              <h3 className="text-base font-bold text-red-950">Não foi possível carregar as recomendações</h3>
              <p className="mt-1 text-xs text-red-700">Ocorreu uma falha ao conectar com o serviço contextual.</p>
              <button
                onClick={() => fetchRecommendations(TABS.find((t) => t.id === activeTab)?.segment)}
                className="mt-4 inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white border border-red-300 text-xs font-bold text-red-800 rounded-xl hover:bg-red-100 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-slate-400 mb-2" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900">Nenhuma empresa encontrada neste segmento</h3>
              <p className="mt-1 text-xs text-slate-500">Tente alternar a aba de filtro para visualizar outras categorias disponíveis.</p>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {items.map((company, idx) => (
                <RecommendedCompanyCard key={company.id} company={company} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
