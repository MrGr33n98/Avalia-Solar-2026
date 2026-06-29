'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  MapPin, 
  Check,
  X, 
  Scale, 
  Trophy,
  ShieldCheck,
  Zap,
  Clock,
  Briefcase,
  Award,
  CircleDollarSign,
  ChevronDown,
  Plus,
  Building2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/lib/api';

// New modular components
import ComparePageHeader from '@/components/compare/ComparePageHeader';
import ComparisonSummary from '@/components/compare/ComparisonSummary';
import PremiumBannerSection from '@/components/compare/PremiumBannerSection';
import CompanyComparisonCard from '@/components/compare/CompanyComparisonCard';
import ComparisonFooterCTA from '@/components/compare/ComparisonFooterCTA';
import TrustScoreDial from '@/components/compare/TrustScoreDial';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { useScrollDepthMilestone, useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import {
  formatCompanyYears,
  formatCurrencyBRL,
  getCompanyTrustScore,
  isPremiumCompany,
} from '@/components/compare/compare-company-utils';

const getCoverageCount = (company: Company) => {
  const cities = Array.isArray(company.coverage_cities)
    ? company.coverage_cities
    : String(company.coverage_cities || '').split(',').filter(Boolean);
  const states = Array.isArray(company.coverage_states)
    ? company.coverage_states
    : String(company.coverage_states || '').split(',').filter(Boolean);
  return cities.length || states.length * 10 || 0;
};

const getSpeedBadge = (time?: string) => {
  if (!time || time === 'Consultar') return null;
  const lower = time.toLowerCase();
  if (lower.includes('h')) {
    const hours = parseInt(lower) || 0;
    if (hours <= 2) {
      return { label: 'Rápido', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  }
  return { label: 'Médio', color: 'bg-amber-50 text-amber-700 border-amber-200' };
};


export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['geral', 'tecnico', 'comercial', 'diferenciais']);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const trackedComparisonSnapshotRef = useRef<string>('');

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (comparisonList.length === 0) return;

    const snapshot = comparisonList.slice(0, 3).map((company) => company.id).join(',');
    if (snapshot === trackedComparisonSnapshotRef.current) return;
    trackedComparisonSnapshotRef.current = snapshot;

    comparisonList.slice(0, 3).forEach((company, index) => {
      sendIntentSignal({
        company_id: company.id,
        signal_type: 'comparison_view',
        signal_category: 'research_intent',
        element_type: 'comparison_page',
        element_selector: 'compare-page',
        metadata: {
          action: 'view',
          comparison_count: comparisonList.length,
          company_position: index + 1,
        },
      });
    });
  }, [comparisonList]);

  // Track scroll depth for the first company in comparison
  useScrollDepthMilestone(comparisonList[0]?.id, {
    metadata: { context: 'comparison_bottom' }
  });

  // Check if any company is premium
  const hasPremiumCompanies = comparisonList.some(company => 
    company.featured || company.plan_status === 'active' || company.has_paid_plan
  );

  const premiumCompany = comparisonList.find(company => 
    company.featured || company.plan_status === 'active' || company.has_paid_plan
  );

  const highestRatedCompanyId = comparisonList.reduce((prev, current) => {
    const prevRating = Number(prev.average_rating ?? prev.rating_avg ?? 0);
    const currRating = Number(current.average_rating ?? current.rating_avg ?? 0);
    return currRating > prevRating ? current : prev;
  }, comparisonList[0])?.id;

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const toggleGroup = (groupId: string) => {
    const isExpanding = !expandedGroups.includes(groupId);
    
    // Analytics
    track('comparison_category_toggle', { 
      category_id: groupId, 
      action: isExpanding ? 'expand' : 'collapse' 
    });

    if (isExpanding && comparisonList[0]) {
      sendIntentSignal({
        company_id: comparisonList[0].id,
        signal_type: 'comparison_usage',
        signal_category: 'research_intent',
        element_type: 'category_header',
        metadata: {
          category: groupId,
          action: 'expand_details'
        }
      });
    }

    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleQuoteClick = (companyId: number) => {
    track('comparison_quote_click', { 
      company_id: companyId,
      cta_location: 'comparison_table'
    });
    sendIntentSignal({
      company_id: companyId,
      signal_type: 'comparison_usage',
      signal_category: 'research_intent',
      element_type: 'comparison_quote_button',
      element_selector: 'compare-quote-cta',
      metadata: {
        action: 'quote_click',
        comparison_count: comparisonList.length,
      },
    });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-page', type: 'quick' });
  };

  // Empty State
  if (comparisonList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div 
            initial={{ scale: shouldReduceMotion ? 1 : 0.8, opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            className="h-32 w-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-200 shadow-inner border-4 border-blue-100"
          >
            <Scale className="h-16 w-16" aria-hidden="true" />
          </motion.div>
          <motion.h1 
            initial={{ y: shouldReduceMotion ? 0 : 20, opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
            className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
          >
            Sua comparação está vazia
          </motion.h1>
          <motion.p 
            initial={{ y: shouldReduceMotion ? 0 : 20, opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
            className="text-slate-500 mb-8 text-lg leading-relaxed"
          >
            Selecione até 3 empresas para analisar lado a lado e tomar a melhor decisão para seu projeto.
          </motion.p>
          <motion.div
            initial={{ y: shouldReduceMotion ? 0 : 20, opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Link href="/companies">
                <Scale className="h-5 w-5 mr-2" aria-hidden="true" />
                Explorar Empresas
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 to-blue-50/20 pb-20">
      <div className="mx-auto max-w-[1180px] px-4 pt-4">
        <BannerSlot placement="compare_page_top" />
      </div>

      {/* Header */}
      <ComparePageHeader
        companiesCount={comparisonList.length}
        hasPremiumCompanies={hasPremiumCompanies}
        onClearAll={clearComparison}
      />

      <main className="relative z-10 mx-auto -mt-4 max-w-[1180px] px-4" id="main-content">
        {/* Summary Section */}
        <ComparisonSummary
          companies={comparisonList}
          maxCompanies={3}
          onRemove={removeFromComparison}
          className="mb-8"
        />

        {/* Premium Banner */}
        {premiumCompany && (
          <PremiumBannerSection
            company={premiumCompany}
            className="max-w-4xl mx-auto mb-8"
          />
        )}

        <div className="mb-8">
          <BannerSlot placement="compare_page_inline" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 w-full min-w-0">
            {/* Mobile: Card Layout */}
        <div className="block md:hidden space-y-6 mb-8">
          {comparisonList.map((company, idx) => (
            <CompanyComparisonCard
              key={company.id}
              company={company}
              onRemove={removeFromComparison}
              onQuote={handleQuoteClick}
            />
          ))}
        </div>

        {/* Desktop & Tablet: Table Layout */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-[2rem] border border-slate-150 bg-white shadow-[0_30px_64px_-36px_rgba(15,23,42,0.45)]">
            <ScrollArea className="w-full">
              <div className="min-w-[760px]">
                
                {/* Table Header: Sticky Company Info */}
                <div className="sticky top-0 z-30 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-200 bg-white shadow-sm divide-x divide-slate-200">
                  <div className="flex flex-col justify-end bg-slate-50/50 p-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dimensões</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {comparisonList.slice(0, 3).map((company, idx) => {
                      const isHighlighted = company.id === highestRatedCompanyId;
                      const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                      const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                      const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);

                      return (
                        <motion.div 
                          key={company.id}
                          layout
                          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 }}
                          className={cn(
                            "group relative flex flex-col p-5 bg-white transition-all",
                            isHighlighted && "bg-blue-50/10 ring-2 ring-blue-600 ring-inset z-10"
                          )}
                        >
                          {/* Ribbon Destaque */}
                          {isHighlighted && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5 fill-amber-300 text-amber-300" /> Melhor avaliada
                            </div>
                          )}

                          <button 
                            onClick={() => removeFromComparison(company.id)} 
                            aria-label={`Remover ${company.name} da comparação`}
                            className="absolute right-3 top-3 rounded-full bg-slate-50 p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 focus:outline-none"
                            title="Remover da comparação"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <div className="flex items-start justify-between gap-4">
                            {/* Logo Container */}
                            <div className="relative flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt={`Logo da ${company.name}`}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 text-slate-300" aria-hidden="true" />
                              )}
                            </div>

                            {/* Status Badges */}
                            {company.verified ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">
                                Verificada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-700">
                                Em análise
                              </span>
                            )}
                          </div>

                          <div className="mt-4">
                            <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-700 block">
                              <h4 className="text-sm font-black tracking-tight leading-snug line-clamp-1 text-slate-900">{company.name}</h4>
                            </Link>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((i) => {
                                  const filled = i <= Math.round(rating);
                                  return (
                                    <Star 
                                      key={i} 
                                      className={`h-3 w-3 ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">{rating > 0 ? rating.toFixed(1) : 'Sem nota'}</span>
                              {reviews > 0 && (
                                <span className="text-[10px] text-slate-500">({reviews})</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty Slots */}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <Link 
                      key={`empty-${i}`}
                      href="/companies"
                      className="group flex flex-col items-center justify-center bg-slate-50/20 p-5 transition-all hover:bg-white focus:outline-none"
                      aria-label="Adicionar mais uma empresa à comparação"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1rem] border-2 border-dashed border-slate-200 bg-white text-sm font-bold text-slate-300 transition-all group-hover:border-blue-200 group-hover:text-blue-400">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors group-hover:text-blue-600">Adicionar</span>
                    </Link>
                  ))}
                </div>

                {/* 1. Reputação Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Reputação</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Média de avaliações de clientes</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                    const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
                    const isHighlighted = company.id === highestRatedCompanyId;

                    return (
                      <div key={`rep-${company.id}`} className={cn("p-5 flex flex-col justify-center gap-1.5", isHighlighted && "bg-blue-50/5")}>
                        {rating > 0 ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black text-slate-900">{rating.toFixed(1)}</span>
                              <span className="text-xs text-slate-500">de 5</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={cn("h-1.5 rounded-full", isHighlighted ? 'bg-blue-600' : 'bg-slate-700')}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">Baseada em {reviews} avaliações</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">Ainda sem avaliações</span>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-rep-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* 2. Verificação Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Verificação</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Documentos e dados conferidos</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`ver-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                          {company.verified ? (
                            <>
                              <span className="text-emerald-600">Verificada</span>
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            </>
                          ) : (
                            <span className="text-amber-600">Em análise</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          {company.verified ? 'Documentos verificados' : 'Documentos em verificação'}
                        </span>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-ver-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* 3. Tempo de Resposta Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Tempo de resposta</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Média para primeiro contato</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const speed = getSpeedBadge(company.response_time_sla);
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`time-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{company.response_time_sla || 'Consultar'}</span>
                          {speed && (
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${speed.color}`}>
                              {speed.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">Média para 1º contato</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-time-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* 4. Cobertura Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Cobertura</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Onde a empresa atua</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const coverageCount = getCoverageCount(company);
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`cov-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">
                          {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">
                          {coverageCount > 0 ? `+${coverageCount} cidades atendidas` : 'Sob consulta'}
                        </span>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-cov-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* 5. Projetos Realizados Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Projetos realizados</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Projetos concluídos</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const projects = company.delivered_projects_score || 0;
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`proj-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                        <span className="text-sm font-bold text-slate-900">{projects > 0 ? `+${projects}` : 'Consultar'}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Projetos concluídos</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-proj-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* 6. Garantia Oferecida Row */}
                <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 divide-x divide-slate-100">
                  <div className="bg-slate-50/30 p-5 flex items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Garantia oferecida</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tempo de garantia médio</p>
                    </div>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const warranty = company.warranty_years || 0;
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`gar-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                        <span className="text-sm font-bold text-slate-900">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Garantia média</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-gar-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

                {/* Action Footer Row */}
                <div className="sticky bottom-0 z-20 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-t border-slate-200 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] divide-x divide-slate-200">
                  <div className="flex items-center justify-center bg-slate-50/50 p-5">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Match de Decisão</span>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => {
                    const isHighlighted = company.id === highestRatedCompanyId;
                    return (
                      <div key={`cta-${company.id}`} className={cn("p-5", isHighlighted && "bg-blue-50/5")}>
                        <Button 
                          className={cn(
                            "w-full rounded-xl font-black h-12 transition-all hover:scale-[1.02] active:scale-95 shadow-md text-white bg-blue-600 hover:bg-blue-700 shadow-blue-200/50",
                            isPremiumCompany(company) && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50"
                          )}
                          onClick={() => handleQuoteClick(company.id)}
                          aria-label={`Solicitar orçamento da ${company.name}`}
                        >
                          Cotar com {company.name.split(' ')[0]}
                        </Button>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-cta-${i}`} className="bg-slate-50/5 p-5"></div>
                  ))}
                </div>

              </div>
            </ScrollArea>
          </div>
        </div>
          </div>

          {/* Sidebar Area (Banner) */}
          <div className="hidden lg:block w-[300px] shrink-0">
            <div className="sticky top-24">
              <BannerSlot placement="compare_page_sidebar" />
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <ComparisonFooterCTA 
          hasPremiumCompanies={hasPremiumCompanies}
          className="mt-12"
        />

        <div className="mt-12">
          <BannerSlot placement="compare_page_bottom" />
        </div>
      </main>
    </div>
  );
}

function CategoryHeader({ 
  id, 
  label, 
  icon, 
  isExpanded, 
  onToggle 
}: { 
  id: string; 
  label: string; 
  icon: React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void 
}) {
  return (
    <button 
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`category-${id}`}
      className={cn(
        "group grid w-full grid-cols-[170px_repeat(3,minmax(0,1fr))] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
        isExpanded 
          ? "bg-white border-y border-slate-100 shadow-sm z-10" 
          : "bg-slate-50/50 border-y border-transparent hover:bg-white"
      )}
    >
      <div className="col-span-4 flex items-center justify-between p-4 px-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-2.5 rounded-2xl transition-all duration-300",
            isExpanded 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
              : "bg-white text-slate-400 shadow-sm group-hover:text-blue-600"
          )}>
            {icon}
          </div>
          <div className="flex flex-col items-start">
            <span className={cn(
              "text-base font-black uppercase tracking-widest transition-colors",
              isExpanded ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"
            )}>
              {label}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Clique para {isExpanded ? 'recolher' : 'expandir'} detalhes
            </span>
          </div>
        </div>
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
          isExpanded ? "bg-slate-100 text-slate-900" : "bg-white text-slate-300 group-hover:text-blue-500 shadow-sm"
        )}>
          <ChevronDown 
            className={cn("h-5 w-5 transition-transform duration-500", isExpanded && "rotate-180")} 
            aria-hidden="true" 
          />
        </div>
      </div>
    </button>
  );
}

function ComparisonRow({ 
  label, 
  icon, 
  companies, 
  value 
}: { 
  label: string; 
  icon: React.ReactNode; 
  companies: Company[]; 
  value: (c: Company) => React.ReactNode 
}) {
  const mainCompanyId = companies[0]?.id;
  
  // Track dwell/hover on the entire row as generalized intent for the primary company
  const { onMouseEnter, onMouseLeave } = useHoverIntent(
    mainCompanyId,
    'comparison_row',
    1000, // 1s dwell
    { 
      elementSelector: `row-${label.toLowerCase().replace(/\s+/g, '-')}`,
      metadata: { criterion: label }
    }
  );

  return (
    <div 
      className="group grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-50/50 transition-colors hover:bg-blue-50/5 last:border-b-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-3 border-r border-slate-100 bg-slate-50/10 p-4">
        <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md flex-shrink-0">
          {icon}
        </div>
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide group-hover:text-slate-900 transition-colors leading-tight">
          {label}
        </span>
      </div>

      {companies.slice(0, 3).map((company, idx) => (
        <div key={`val-${company.id}`} className={cn(
          "flex items-center justify-center border-r border-slate-100 p-4 text-center transition-colors last:border-r-0",
          idx === 0 && "bg-blue-50/5"
        )}>
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
            {value(company)}
          </div>
        </div>
      ))}

      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
        <div key={`empty-val-${i}`} className="border-r border-slate-100 bg-slate-50/5 p-4 last:border-r-0"></div>
      ))}
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
