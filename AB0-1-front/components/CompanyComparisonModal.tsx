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
      return { label: 'Rápido', color: 'bg-emerald-50 text-emerald-800 border-emerald-100' };
    }
  }
  return { label: 'Médio', color: 'bg-amber-50 text-amber-800 border-amber-100' };
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

  const handleQuoteClick = (companyId: number) => {
    track('comparison_modal_quote_click', { company_id: companyId });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-modal', type: 'quick' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1020px] max-h-[85vh] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl transition-all duration-300">
        
        {/* Swiss Design Header */}
        <DialogHeader className="space-y-0 border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Análise Comparativa
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-[10px] md:text-xs uppercase tracking-[0.2em] mt-1">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} selecionadas
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 md:w-auto"
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Limpar Análise
            </Button>
          </div>
        </DialogHeader>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 md:p-8 pb-16">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto w-full">
                  <div className="min-w-[760px] w-full flex flex-col divide-y divide-slate-100">
                    
                    {/* Header Row: Company Logos & Names */}
                    <div className="sticky top-0 z-30 grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="flex flex-col justify-end bg-slate-50/50 p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CRITÉRIOS</span>
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
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className={cn(
                                "group relative flex flex-col p-5 bg-white transition-colors",
                                isHighlighted && "bg-blue-50/10 ring-1 ring-blue-500 ring-inset z-10"
                              )}
                            >
                              {/* Swiss Label Destaque */}
                              {isHighlighted && (
                                <div className="absolute top-2 left-5 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm">
                                  Melhor avaliada
                                </div>
                              )}

                              <button 
                                onClick={() => onRemoveCompany(company.id)} 
                                aria-label={`Remover ${company.name} da comparação`}
                                className="absolute right-3 top-3 rounded bg-slate-50 hover:bg-red-50 p-1 text-slate-400 transition-colors hover:text-red-500 focus:outline-none"
                                title="Remover"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>

                              <div className="flex items-start justify-between gap-4 mt-2">
                                {/* Logo Container */}
                                <div className="relative flex h-10 w-16 items-center justify-center overflow-hidden rounded border border-slate-100 bg-white p-1">
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt={`Logo da ${company.name}`}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <Building2 className="h-4 w-4 text-slate-300" aria-hidden="true" />
                                  )}
                                </div>

                                {/* Status Badge */}
                                {company.verified ? (
                                  <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-800">
                                    Verificada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                    Em análise
                                  </span>
                                )}
                              </div>

                              <div className="mt-4">
                                <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-600 block">
                                  <h4 className="text-xs font-bold uppercase tracking-tight leading-snug line-clamp-1 text-slate-900">{company.name}</h4>
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
                                  <span className="text-[10px] font-bold text-slate-900">{rating > 0 ? rating.toFixed(1) : 'S/N'}</span>
                                  {reviews > 0 && (
                                    <span className="text-[9px] text-slate-400">({reviews})</span>
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
                          className="flex flex-col items-center justify-center bg-slate-50/20 p-5"
                        >
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Livre</span>
                        </div>
                      ))}
                    </div>

                    {/* 1. Reputação Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Reputação</h5>
                          <p className="text-[9px] text-slate-400">Avaliação geral de clientes</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                        const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
                        const isHighlighted = company.id === highestRatedCompanyId;

                        return (
                          <div key={`rep-${company.id}`} className={cn("p-4 flex flex-col justify-center gap-1", isHighlighted && "bg-blue-50/5")}>
                            {rating > 0 ? (
                              <>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-sm font-extrabold text-slate-950">{rating.toFixed(1)}</span>
                                  <span className="text-[9px] text-slate-400">/ 5.0</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className={cn("h-1 rounded-full", isHighlighted ? 'bg-blue-600' : 'bg-slate-800')}
                                    style={{ width: `${(rating / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[8px] text-slate-400">{reviews} depoimentos</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">Sem avaliações</span>
                            )}
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-rep-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* 2. Verificação Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Certificações</h5>
                          <p className="text-[9px] text-slate-400">Documentação e verificação</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`ver-${company.id}`} className={cn("p-4 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                              {company.verified ? (
                                <>
                                  <span className="text-emerald-700 text-[11px] font-bold">Verificada</span>
                                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                </>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-bold">Em análise</span>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-400 mt-0.5">
                              {company.verified ? 'Dados auditados' : 'Documentação pendente'}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-ver-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* 3. Tempo de Resposta Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">SLA de Contato</h5>
                          <p className="text-[9px] text-slate-400">Tempo médio de resposta</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const speed = getSpeedBadge(company.response_time_sla);
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`time-${company.id}`} className={cn("p-4 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{company.response_time_sla || 'Sob consulta'}</span>
                              {speed && (
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border ${speed.color}`}>
                                  {speed.label}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-400 mt-0.5">SLA de atendimento</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-time-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* 4. Cobertura Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Abrangência</h5>
                          <p className="text-[9px] text-slate-400">Região de atuação</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const coverageCount = getCoverageCount(company);
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`cov-${company.id}`} className={cn("p-4 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950 truncate">
                              {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                            </span>
                            <span className="text-[8px] text-slate-400 mt-0.5">
                              {coverageCount > 0 ? `+${coverageCount} regiões` : 'Sob consulta'}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-cov-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* 5. Projetos Realizados Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Volume</h5>
                          <p className="text-[9px] text-slate-400">Projetos entregues</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const projects = company.delivered_projects_score || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`proj-${company.id}`} className={cn("p-4 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950">{projects > 0 ? `+${projects} projetos` : 'Consultar'}</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">Histórico verificado</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-proj-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* 6. Garantia Oferecida Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-white divide-x divide-slate-100">
                      <div className="bg-slate-50/30 p-4 flex items-center">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Garantia</h5>
                          <p className="text-[9px] text-slate-400">Cobertura pós-instalação</p>
                        </div>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const warranty = company.warranty_years || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`gar-${company.id}`} className={cn("p-4 flex flex-col justify-center", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">Tempo médio</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-gar-${i}`} className="bg-slate-50/5 p-4"></div>
                      ))}
                    </div>

                    {/* Action Row */}
                    <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] bg-slate-50/30 divide-x divide-slate-100">
                      <div className="flex items-center p-4">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cotação</span>
                      </div>
                      {companies.slice(0, 3).map((company, idx) => {
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`cta-${company.id}`} className={cn("p-4", isHighlighted && "bg-blue-50/5")}>
                            <Button 
                              className={cn(
                                "w-full rounded-md font-bold text-[10px] uppercase tracking-widest h-11 transition-all text-white bg-slate-900 hover:bg-slate-800 shadow-sm border border-slate-950",
                                isPremiumCompany(company) && "bg-blue-600 hover:bg-blue-700 border-blue-700"
                              )}
                              onClick={() => handleQuoteClick(company.id)}
                              aria-label={`Solicitar orçamento da ${company.name}`}
                            >
                              Cotar
                            </Button>
                          </div>
                        );
                      })}
                      {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                        <div key={`empty-cta-${i}`} className="bg-slate-50/5 p-4"></div>
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
