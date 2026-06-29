'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MapPin, 
  X, 
  Scale, 
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
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

interface CompanyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onRemoveCompany: (id: number) => void;
  onClearAll: () => void;
}

export default function CompanyComparisonModal({
  isOpen,
  onClose,
  companies,
  onRemoveCompany,
  onClearAll
}: CompanyComparisonModalProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const highestRatedCompanyId = companies.reduce((prev, current) => {
    const prevRating = Number(prev.average_rating ?? prev.rating_avg ?? 0);
    const currRating = Number(current.average_rating ?? current.rating_avg ?? 0);
    return currRating > prevRating ? current : prev;
  }, companies[0])?.id;

  useEffect(() => {
    if (isOpen) {
      track('comparison_modal_opened', { companies_count: companies.length });
    }
  }, [isOpen, companies.length]);

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const handleQuoteClick = (companyId: number) => {
    track('comparison_modal_quote_click', { company_id: companyId });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-modal', type: 'quick' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1080px] max-h-[82vh] gap-0 overflow-hidden rounded-[2rem] border-0 bg-white/95 p-0 shadow-[0_34px_76px_-26px_rgba(15,23,42,0.38)] backdrop-blur-xl transition-all duration-500">
        <DialogHeader className="space-y-0 border-b border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.92))] p-5 pb-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 shrink-0">
                <Scale className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                  Análise Comparativa
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest mt-1">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} selecionadas
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="h-10 w-full rounded-xl px-6 text-slate-400 font-black transition-all hover:bg-red-50 hover:text-red-600 md:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Comparação
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-5 md:p-6 pb-16">
              <div className="overflow-hidden rounded-[2rem] border border-slate-150 bg-white shadow-[0_30px_64px_-36px_rgba(15,23,42,0.45)]">
                <div className="overflow-x-auto w-full">
                  <div className="min-w-[760px] w-full flex flex-col">
                    
                    {/* Header Row: Company Info */}
                    <div className="sticky top-0 z-30 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-b border-slate-200 bg-white shadow-sm divide-x divide-slate-200">
                      <div className="flex flex-col justify-end bg-slate-50/50 p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dimensões</span>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {companies.slice(0, 3).map((company, idx) => {
                          const isHighlighted = company.id === highestRatedCompanyId;
                          const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                          const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                          const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);

                          return (
                            <motion.div 
                              key={company.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
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
                                onClick={() => onRemoveCompany(company.id)} 
                                aria-label={`Remover ${company.name} da comparação`}
                                className="absolute right-3 top-3 rounded-full bg-slate-50 p-1.5 text-slate-400 transition-all hover:bg-red-100 hover:text-red-500 focus:outline-none"
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div 
                          key={`empty-${i}`}
                          className="flex flex-col items-center justify-center bg-slate-50/20 p-5 border border-dashed border-slate-200"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Slot vazio</span>
                        </div>
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
                      {companies.slice(0, 3).map((company, idx) => {
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
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
                      {companies.slice(0, 3).map((company, idx) => {
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
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
                      {companies.slice(0, 3).map((company, idx) => {
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
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
                      {companies.slice(0, 3).map((company, idx) => {
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
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
                      {companies.slice(0, 3).map((company, idx) => {
                        const projects = company.delivered_projects_score || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`proj-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-sm font-bold text-slate-900">{projects > 0 ? `+${projects}` : 'Consultar'}</span>
                            <span className="text-[10px] text-slate-500 mt-1">Projetos concluídos</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
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
                      {companies.slice(0, 3).map((company, idx) => {
                        const warranty = company.warranty_years || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`gar-${company.id}`} className={cn("p-5 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-sm font-bold text-slate-900">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                            <span className="text-[10px] text-slate-500 mt-1">Garantia média</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-gar-${i}`} className="bg-slate-50/5 p-5"></div>
                      ))}
                    </div>

                    {/* Action Footer Row */}
                    <div className="sticky bottom-0 z-20 grid grid-cols-[170px_repeat(3,minmax(0,1fr))] border-t border-slate-200 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] divide-x divide-slate-200">
                      <div className="flex items-center justify-center bg-slate-50/50 p-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Match de Decisão</span>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
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
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-cta-${i}`} className="bg-slate-50/5 p-5"></div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
