'use client';

import { useState, useEffect } from 'react';
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
  Info,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/lib/api';

// New modular components
import ComparePageHeader from '@/components/compare/ComparePageHeader';
import ComparisonSummary from '@/components/compare/ComparisonSummary';
import PremiumBannerSection from '@/components/compare/PremiumBannerSection';
import CompanyComparisonCard from '@/components/compare/CompanyComparisonCard';
import ComparisonFooterCTA from '@/components/compare/ComparisonFooterCTA';
import ComparisonTableSkeleton from '@/components/compare/ComparisonTableSkeleton';

export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['geral', 'tecnico', 'comercial', 'diferenciais']);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleQuoteClick = (companyId: number) => {
    track('comparison_quote_click', { company_id: companyId });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-page', type: 'quick' });
  };

  const isPremiumCompany = (company: Company) => {
    return company.featured || company.plan_status === 'active' || company.has_paid_plan;
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

      <main className="container mx-auto px-4 -mt-8 relative z-10" id="main-content">
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">
                
                {/* Table Header: Sticky Company Info */}
                <div className="grid grid-cols-4 border-b border-slate-100 bg-white sticky top-0 z-30 shadow-sm">
                  <div className="p-6 flex flex-col justify-end bg-slate-50/30 border-r border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atributos</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {comparisonList.slice(0, 3).map((company, idx) => (
                      <motion.div 
                        key={company.id}
                        layout
                        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 }}
                        className={cn(
                          "p-6 flex flex-col items-center text-center relative border-r border-slate-100 last:border-r-0",
                          idx === 0 && "bg-blue-50/10",
                          isPremiumCompany(company) && "bg-gradient-to-br from-orange-50/20 to-yellow-50/20"
                        )}
                      >
                        <button 
                          onClick={() => removeFromComparison(company.id)} 
                          aria-label={`Remover ${company.name} da comparação`}
                          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="Remover da comparação"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className={cn(
                          "h-20 w-20 mb-4 rounded-3xl p-3 shadow-lg border flex items-center justify-center overflow-hidden transition-transform hover:scale-105",
                          isPremiumCompany(company)
                            ? "bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-orange-200/40"
                            : "bg-white border-slate-100 shadow-slate-200/40"
                        )}>
                          <img 
                            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                            alt={`Logo da ${company.name}`}
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                        
                        <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-2 px-4 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h4>
                        
                        <div 
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter"
                          role="img"
                          aria-label={`Avaliação ${formatRating(company.rating_avg || company.average_rating)} de 5, ${company.rating_count || 0} avaliações`}
                        >
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          {formatRating(company.rating_avg || company.average_rating)} ({company.rating_count || 0})
                        </div>

                        {isPremiumCompany(company) && (
                          <div className="mt-2 px-2 py-1 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 text-xs font-bold">
                            Premium
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Empty Slots */}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <Link 
                      key={`empty-${i}`}
                      href="/companies"
                      className="p-6 flex flex-col items-center justify-center border-r border-slate-100 last:border-r-0 bg-slate-50/20 group transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Adicionar mais uma empresa à comparação"
                    >
                      <div className="h-16 w-16 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-blue-200 group-hover:text-blue-400 transition-all mb-4">
                        <Plus className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Adicionar Empresa</span>
                    </Link>
                  ))}
                </div>

                {/* Group: Visão Geral */}
                <CategoryHeader 
                  id="geral" 
                  label="Visão Geral" 
                  icon={<Info className="h-4 w-4" aria-hidden="true" />} 
                  isExpanded={expandedGroups.includes('geral')} 
                  onToggle={() => toggleGroup('geral')} 
                />
                {expandedGroups.includes('geral') && (
                  <div className="divide-y divide-slate-50">
                    <ComparisonRow 
                      label="Localização" 
                      icon={<MapPin className="h-4 w-4 text-blue-500" aria-hidden="true" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <span className="text-sm font-bold text-slate-600">{c.city}, {c.state}</span>
                      )} 
                    />
                    <ComparisonRow 
                      label="Selo Verificado" 
                      icon={<ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        c.verified ? (
                          <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl text-xs font-black">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Verificada
                          </div>
                        ) : <span className="text-slate-300 font-medium">—</span>
                      )} 
                    />
                    <ComparisonRow 
                      label="Anos de Mercado" 
                      icon={<Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />} 
                      companies={comparisonList} 
                      value={(c) => {
                        const years = c.founded_year ? new Date().getFullYear() - c.founded_year : null;
                        return years !== null ? (
                          <span className="text-sm font-bold text-slate-700">{years > 0 ? `${years} anos` : 'Inaugurada este ano'}</span>
                        ) : <span className="text-slate-300 font-medium">—</span>;
                      }} 
                    />
                  </div>
                )}

                {/* Footer Row: Actions */}
                <div className="grid grid-cols-4 bg-slate-50/50 sticky bottom-0 z-20 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                  <div className="p-6 flex items-center justify-center border-r border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ação imediata</span>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => (
                    <div key={`cta-${company.id}`} className={cn(
                      "p-6 border-r border-slate-100 last:border-r-0",
                      idx === 0 && "bg-blue-50/20",
                      isPremiumCompany(company) && "bg-gradient-to-br from-orange-50/30 to-yellow-50/30"
                    )}>
                      <Button 
                        className="w-full rounded-2xl font-black h-12 shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/30 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => handleQuoteClick(company.id)}
                        aria-label={`Solicitar orçamento da ${company.name}`}
                      >
                        Solicitar Orçamento
                      </Button>
                    </div>
                  ))}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-cta-${i}`} className="p-6 border-r border-slate-100 last:border-r-0"></div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer CTA */}
        <ComparisonFooterCTA 
          hasPremiumCompanies={hasPremiumCompanies}
          className="mt-16"
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
      className="w-full grid grid-cols-4 bg-slate-50/80 border-y border-slate-100 hover:bg-slate-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
    >
      <div className="col-span-4 p-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white text-slate-400 shadow-sm group-hover:text-blue-600 transition-colors">
            {icon}
          </div>
          <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{label}</span>
        </div>
        <ChevronDown 
          className={cn("h-5 w-5 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180")} 
          aria-hidden="true"
        />
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
  return (
    <div className="grid grid-cols-4 group hover:bg-blue-50/10 transition-colors">
      <div className="p-6 flex items-center gap-4 border-r border-slate-100 bg-slate-50/5">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
          {icon}
        </div>
        <span className="text-xs font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors leading-tight">
          {label}
        </span>
      </div>

      {companies.slice(0, 3).map((company, idx) => (
        <div key={`val-${company.id}`} className={cn(
          "p-6 flex items-center justify-center text-center border-r border-slate-100 last:border-r-0 transition-colors",
          idx === 0 && "bg-blue-50/5"
        )}>
          {value(company)}
        </div>
      ))}

      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
        <div key={`empty-val-${i}`} className="p-6 border-r border-slate-100 last:border-r-0"></div>
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
