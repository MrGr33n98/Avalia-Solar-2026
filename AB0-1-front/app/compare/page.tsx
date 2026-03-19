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
import { useScrollDepthMilestone, useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import {
  formatCompanyYears,
  formatCurrencyBRL,
  getCompanyTrustScore,
  isPremiumCompany,
} from '@/components/compare/compare-company-utils';

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
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,255,0.94))] shadow-[0_30px_64px_-36px_rgba(15,23,42,0.45)] clay-surface clay-convex">
            <ScrollArea className="w-full">
              <div className="min-w-[760px]">
                
                {/* Table Header: Sticky Company Info */}
                <div className="sticky top-0 z-30 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-100 bg-white shadow-sm">
                  <div className="flex flex-col justify-end border-r border-slate-100 bg-slate-50/35 p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Dimensões TaaS</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {comparisonList.slice(0, 3).map((company, idx) => {
                      const trustScore = getCompanyTrustScore(company);

                      return (
                        <motion.div 
                          key={company.id}
                          layout
                          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 }}
                          className={cn(
                            "group relative flex flex-col items-center border-r border-slate-100 p-4 text-center last:border-r-0",
                            idx === 0 && "bg-blue-50/10",
                            isPremiumCompany(company) && "bg-gradient-to-br from-blue-50/20 to-indigo-50/20"
                          )}
                        >
                          <button 
                            onClick={() => removeFromComparison(company.id)} 
                            aria-label={`Remover ${company.name} da comparação`}
                            className="absolute right-3 top-3 rounded-full bg-slate-50 p-1.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="Remover da comparação"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <div className="flex flex-col items-center gap-3">
                            <div className={cn(
                              "flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.15rem] border bg-white p-1 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.35)] transition-transform clay-surface clay-convex",
                              isPremiumCompany(company) ? "border-blue-200" : "border-slate-100"
                            )}>
                              <Image 
                                src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                                alt={`Logo da ${company.name}`}
                                width={42}
                                height={42}
                                className="h-full w-full scale-[1.14] object-contain" 
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <h4 className="line-clamp-2 px-2 text-sm font-black text-slate-900">
                                {company.name}
                              </h4>
                              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-blue-600">
                                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                                {formatRating(company.rating_avg || company.average_rating)}
                              </div>
                            </div>
                          </div>

                          {isPremiumCompany(company) && (
                            <div className="mt-3 rounded-full bg-blue-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-200">
                              Parceiro Premium
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty Slots */}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <Link 
                      key={`empty-${i}`}
                      href="/companies"
                      className="group flex flex-col items-center justify-center border-r border-slate-100 bg-slate-50/20 p-4 transition-all hover:bg-white last:border-r-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Adicionar mais uma empresa à comparação"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1rem] border-2 border-dashed border-slate-200 bg-white text-sm font-bold text-slate-300 transition-all group-hover:border-blue-200 group-hover:text-blue-400">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors group-hover:text-blue-600">Adicionar</span>
                    </Link>
                  ))}
                </div>

                {/* Group: Pilares de Confiança (TaaS) */}
                <CategoryHeader 
                  id="taas" 
                  label="Pilares de Confiança (TaaS)" 
                  icon={<Trophy className="h-4 w-4" />} 
                  isExpanded={expandedGroups.includes('taas')} 
                  onToggle={() => toggleGroup('taas')} 
                />
                {expandedGroups.includes('taas') && (
                  <div className="divide-y divide-slate-50">
                    <ComparisonRow 
                      label="Trust Score" 
                      icon={<ShieldCheck className="h-4 w-4 text-primary" />} 
                      companies={comparisonList} 
                      value={(c) => {
                        const trustScore = getCompanyTrustScore(c);

                        return trustScore !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-slate-900">{trustScore}%</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-emerald-500">Score atual</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-slate-300">—</span>
                        );
                      }} 
                    />
                    <ComparisonRow 
                      label="SLA de Resposta" 
                      icon={<Clock className="h-4 w-4 text-amber-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[11px] font-black uppercase",
                          c.response_time_sla === 'Imediato' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {c.response_time_sla || '—'}
                        </div>
                      )} 
                    />
                    <ComparisonRow 
                      label="Certificações" 
                      icon={<Award className="h-4 w-4 text-indigo-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <div className="flex -space-x-2">
                          {(c.badges || []).slice(0, 3).map((badge, bidx) => (
                            <div key={bidx} className="h-8 w-8 rounded-full bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center p-1.5" title={badge.name}>
                              {badge.image_url ? (
                                <Image src={badge.image_url} alt="" width={24} height={24} className="object-contain" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-blue-400" />
                              )}
                            </div>
                          ))}
                          {((c.badges || []).length > 3) && (
                            <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                              +{(c.badges || []).length - 3}
                            </div>
                          )}
                        </div>
                      )} 
                    />
                  </div>
                )}

                {/* Group: Performance & Qualidade */}
                <CategoryHeader 
                  id="tecnico" 
                  label="Performance & Qualidade" 
                  icon={<Zap className="h-4 w-4" />} 
                  isExpanded={expandedGroups.includes('tecnico')} 
                  onToggle={() => toggleGroup('tecnico')} 
                />
                {expandedGroups.includes('tecnico') && (
                  <div className="divide-y divide-slate-50">
                    <ComparisonRow 
                      label="Tempo de Mercado" 
                      icon={<Briefcase className="h-4 w-4 text-orange-500" />} 
                      companies={comparisonList} 
                      value={(c) => {
                        const yearsLabel = formatCompanyYears(c);
                        return (
                          <span className="text-sm font-bold text-slate-700">
                            {yearsLabel || '—'}
                          </span>
                        );
                      }} 
                    />
                    <ComparisonRow 
                      label="Ticket Mínimo" 
                      icon={<CircleDollarSign className="h-4 w-4 text-emerald-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrencyBRL(c.minimum_ticket) || '—'}
                        </span>
                      )} 
                    />
                    <ComparisonRow 
                      label="Financiamento" 
                      icon={<Zap className="h-4 w-4 text-blue-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        c.financing_enabled ? (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                            Disponível
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-300">—</span>
                        )
                      )} 
                    />
                  </div>
                )}

                {/* Group: Localização e Atendimento */}
                <CategoryHeader 
                  id="geral" 
                  label="Localização e Atendimento" 
                  icon={<MapPin className="h-4 w-4" />} 
                  isExpanded={expandedGroups.includes('geral')} 
                  onToggle={() => toggleGroup('geral')} 
                />
                {expandedGroups.includes('geral') && (
                  <div className="divide-y divide-slate-50">
                    <ComparisonRow 
                      label="Sede Principal" 
                      icon={<MapPin className="h-4 w-4 text-blue-500" aria-hidden="true" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <span className="text-sm font-bold text-slate-600">{c.city}, {c.state}</span>
                      )} 
                    />
                    <ComparisonRow 
                      label="WhatsApp" 
                      icon={<Check className="h-4 w-4 text-emerald-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        c.whatsapp ? (
                          <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl text-[10px] font-black">
                            Disponível
                          </div>
                        ) : <X className="h-4 w-4 text-slate-200" />
                      )} 
                    />
                  </div>
                )}

                {/* Footer Row: Actions */}
                <div className="sticky bottom-0 z-20 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-t border-slate-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-center border-r border-slate-100 bg-slate-50/20 p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Match de Decisão</span>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => (
                    <div key={`cta-${company.id}`} className={cn(
                      "border-r border-slate-100 p-4 last:border-r-0",
                      idx === 0 && "bg-blue-50/20",
                      isPremiumCompany(company) && "bg-gradient-to-br from-blue-50/30 to-indigo-50/30"
                    )}>
                      <Button 
                        className={cn(
                          "w-full rounded-[1.25rem] font-black h-12 transition-all hover:scale-[1.02] active:scale-95 shadow-lg",
                          "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50",
                          isPremiumCompany(company) && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50"
                        )}
                        onClick={() => handleQuoteClick(company.id)}
                        aria-label={`Solicitar orçamento da ${company.name}`}
                      >
                        Cotar com {company.name.split(' ')[0]}
                      </Button>
                    </div>
                  ))}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-cta-${i}`} className="border-r border-slate-100 p-4 last:border-r-0"></div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer CTA */}
        <ComparisonFooterCTA 
          hasPremiumCompanies={hasPremiumCompanies}
          className="mt-12"
        />
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
