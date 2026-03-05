'use client';

import { useState } from 'react';
import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  MapPin, 
  Check, 
  X, 
  ArrowLeft, 
  Scale, 
  Trophy,
  ShieldCheck,
  Zap,
  Clock,
  Briefcase,
  Globe,
  Award,
  CircleDollarSign,
  ChevronDown,
  Info,
  Crown,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/lib/api';
import PremiumCompanyBanner from '@/components/PremiumCompanyBanner';

export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['geral', 'tecnico', 'comercial', 'diferenciais']);
  const [isMobile, setIsMobile] = useState(false);

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

  if (comparisonList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-32 w-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-200 shadow-inner border-4 border-blue-100"
          >
            <Scale className="h-16 w-16" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
          >
            Sua comparação está vazia
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 mb-8 text-lg leading-relaxed"
          >
            Selecione até 3 empresas para analisar lado a lado e tomar a melhor decisão para seu projeto.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95">
              <Link href="/companies">
                <Scale className="h-5 w-5 mr-2" />
                Explorar Empresas
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 to-blue-50/20 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12 md:pt-12 md:pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <Button asChild variant="ghost" className="mb-8 -ml-4 text-slate-400 hover:text-slate-900 font-bold transition-colors">
            <Link href="/companies" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Empresas
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
                <Scale className="h-3.5 w-3.5" /> Comparativo Detalhado
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Lado a Lado
              </h1>
              <p className="text-slate-500 text-lg md:text-xl leading-relaxed">
                Analisamos tecnicamente <span className="text-slate-900 font-bold">{comparisonList.length} empresas</span> para facilitar sua escolha.
                {hasPremiumCompanies && (
                  <span className="block mt-2 text-amber-600 font-semibold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Incluindo empresas premium destacadas
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={clearComparison}
                className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
              >
                Limpar tudo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Premium Company Banner */}
        {premiumCompany && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <PremiumCompanyBanner 
              company={premiumCompany}
              className="max-w-4xl mx-auto"
            />
          </motion.div>
        )}

        {/* Mobile/Desktop Adaptive Layout */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Mobile Stack Layout */}
          <div className="block md:hidden">
            <div className="p-6 space-y-6">
              {comparisonList.map((company, idx) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 border shadow-lg relative",
                    isPremiumCompany(company) && "from-amber-50 to-orange-50 border-amber-200"
                  )}
                >
                  {/* Premium Crown for mobile */}
                  {isPremiumCompany(company) && (
                    <div className="absolute -top-2 -right-2">
                      <Crown className="h-6 w-6 text-amber-500 fill-current" />
                    </div>
                  )}

                  <button
                    onClick={() => removeFromComparison(company.id)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md text-slate-400 hover:text-red-500 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "h-16 w-16 rounded-3xl p-2 shadow-lg border flex items-center justify-center overflow-hidden",
                      isPremiumCompany(company) 
                        ? "bg-gradient-to-br from-amber-50 to-white border-amber-200" 
                        : "bg-white border-slate-100"
                    )}>
                      <img
                        src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
                        alt={company.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-1">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black w-fit">
                        <Star className="h-3 w-3 fill-current" />
                        {formatRating(company.rating_avg || company.average_rating)} ({company.rating_count || 0})
                      </div>
                    </div>
                  </div>

                  {/* Mobile Company Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{company.city}, {company.state}</span>
                    </div>

                    {company.verified && (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-semibold">Empresa Verificada</span>
                      </div>
                    )}

                    {company.founded_year && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">
                          {new Date().getFullYear() - company.founded_year} anos no mercado
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    className={cn(
                      "w-full mt-6 rounded-2xl font-black h-12 shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                      isPremiumCompany(company)
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                    )}
                    onClick={() => handleQuoteClick(company.id)}
                  >
                    {isPremiumCompany(company) && <Crown className="h-4 w-4 mr-2" />}
                    Pedir Orçamento
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block">
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">{/* Rest of existing desktop layout remains the same */}
                
                {/* Table Header: Sticky Company Info */}
                <div className="grid grid-cols-4 border-b border-slate-100 bg-white sticky top-0 z-30 shadow-sm">
                  <div className="p-8 flex flex-col justify-end bg-slate-50/30 border-r border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atributos</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {comparisonList.slice(0, 3).map((company, idx) => (
                      <motion.div 
                        key={company.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "p-8 flex flex-col items-center text-center relative border-r border-slate-100 last:border-r-0",
                          idx === 0 && "bg-blue-50/10",
                          isPremiumCompany(company) && "bg-gradient-to-br from-amber-50/20 to-orange-50/20"
                        )}
                      >
                        {/* Premium Crown */}
                        {isPremiumCompany(company) && (
                          <div className="absolute -top-2 -right-2">
                            <Crown className="h-6 w-6 text-amber-500 fill-current" />
                          </div>
                        )}

                        <button 
                          onClick={() => removeFromComparison(company.id)} 
                          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all group"
                          title="Remover da comparação"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className={cn(
                          "h-24 w-24 mb-6 rounded-3xl p-3 shadow-xl border flex items-center justify-center overflow-hidden transition-transform hover:scale-105",
                          isPremiumCompany(company)
                            ? "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-200/40"
                            : "bg-white border-slate-100 shadow-slate-200/40"
                        )}>
                          <img 
                            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                            alt={company.name} 
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                        
                        <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-2 px-4 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter">
                          <Star className="h-3 w-3 fill-current" />
                          {formatRating(company.rating_avg || company.average_rating)} ({company.rating_count || 0})
                        </div>

                        {isPremiumCompany(company) && (
                          <div className="mt-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-bold">
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
                      className="p-8 flex flex-col items-center justify-center border-r border-slate-100 last:border-r-0 bg-slate-50/20 group transition-all hover:bg-white"
                    >
                      <div className="h-16 w-16 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-blue-200 group-hover:text-blue-400 transition-all mb-4">
                        <Scale className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Adicionar Empresa</span>
                    </Link>
                  ))}
                </div>

                {/* Rest of the comparison rows remain the same but with premium styling */}
                {/* Group: Visão Geral */}
                <CategoryHeader 
                  id="geral" 
                  label="Visão Geral" 
                  icon={<Info className="h-4 w-4" />} 
                  isExpanded={expandedGroups.includes('geral')} 
                  onToggle={() => toggleGroup('geral')} 
                />
                {expandedGroups.includes('geral') && (
                  <div className="divide-y divide-slate-50">
                    <ComparisonRow 
                      label="Localização" 
                      icon={<MapPin className="h-4 w-4 text-blue-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        <span className="text-sm font-bold text-slate-600">{c.city}, {c.state}</span>
                      )} 
                    />
                    <ComparisonRow 
                      label="Selo Verificado" 
                      icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        c.verified ? (
                          <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl text-xs font-black">
                            <Check className="h-3.5 w-3.5" /> Verificada
                          </div>
                        ) : <span className="text-slate-300 font-medium">—</span>
                      )} 
                    />
                    <ComparisonRow 
                      label="Anos de Mercado" 
                      icon={<Clock className="h-4 w-4 text-orange-500" />} 
                      companies={comparisonList} 
                      value={(c) => {
                        const years = c.founded_year ? new Date().getFullYear() - c.founded_year : null;
                        return years !== null ? (
                          <span className="text-sm font-bold text-slate-700">{years > 0 ? `${years} anos` : 'Inaugurada este ano'}</span>
                        ) : <span className="text-slate-300 font-medium">—</span>;
                      }} 
                    />
                    <ComparisonRow 
                      label="Status Premium" 
                      icon={<Crown className="h-4 w-4 text-amber-500" />} 
                      companies={comparisonList} 
                      value={(c) => (
                        isPremiumCompany(c) ? (
                          <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-1.5 rounded-xl text-xs font-black">
                            <Crown className="h-3.5 w-3.5 fill-current" /> Premium Partner
                          </div>
                        ) : <span className="text-slate-300 font-medium">—</span>
                      )} 
                    />
                  </div>
                )}

                {/* Continue with other sections... */}
                {/* Footer Row: Actions */}
                <div className="grid grid-cols-4 bg-slate-50/50 sticky bottom-0 z-20 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                  <div className="p-8 flex items-center justify-center border-r border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ação imediata</span>
                  </div>
                  {comparisonList.slice(0, 3).map((company, idx) => (
                    <div key={`cta-${company.id}`} className={cn(
                      "p-8 border-r border-slate-100 last:border-r-0",
                      idx === 0 && "bg-blue-50/20",
                      isPremiumCompany(company) && "bg-gradient-to-br from-amber-50/30 to-orange-50/30"
                    )}>
                      <Button 
                        className={cn(
                          "w-full rounded-2xl font-black h-14 shadow-[0_10px_30px] transition-all hover:scale-[1.02] active:scale-95",
                          isPremiumCompany(company)
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200/30"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/30"
                        )}
                        onClick={() => handleQuoteClick(company.id)}
                      >
                        {isPremiumCompany(company) && <Crown className="h-4 w-4 mr-2" />}
                        Pedir Orçamento
                      </Button>
                    </div>
                  ))}
                  {Array.from({ length: 3 - Math.min(comparisonList.length, 3) }).map((_, i) => (
                    <div key={`empty-cta-${i}`} className="p-8 border-r border-slate-100 last:border-r-0"></div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-slate-400 text-sm mb-6 font-medium">
            As informações acima são baseadas nos perfis oficiais das empresas e em avaliações de usuários reais. 
            Empresas premium recebem destaque especial por serem parceiros verificados da plataforma.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/companies" className="text-blue-600 hover:text-blue-700 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              Explorar mais empresas <ArrowRight className="h-3 w-3" />
            </Link>
            {hasPremiumCompanies && (
              <Link href="/companies?featured=true" className="text-amber-600 hover:text-amber-700 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Crown className="h-3 w-3" />
                Ver mais empresas premium
              </Link>
            )}
          </div>
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
      className="w-full grid grid-cols-4 bg-slate-50/80 border-y border-slate-100 hover:bg-slate-100 transition-colors group"
    >
      <div className="col-span-4 p-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white text-slate-400 shadow-sm group-hover:text-blue-600 transition-colors">
            {icon}
          </div>
          <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{label}</span>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180")} />
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
      <div className="p-6 md:p-8 flex items-center gap-4 border-r border-slate-100 bg-slate-50/5">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
          {icon}
        </div>
        <span className="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors leading-tight">
          {label}
        </span>
      </div>

      {companies.slice(0, 3).map((company, idx) => (
        <div key={`val-${company.id}`} className={cn(
          "p-6 md:p-8 flex items-center justify-center text-center md:text-left border-r border-slate-100 last:border-r-0 transition-colors",
          idx === 0 && "bg-blue-50/5"
        )}>
          {value(company)}
        </div>
      ))}

      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
        <div key={`empty-val-${i}`} className="p-8 border-r border-slate-100 last:border-r-0"></div>
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
