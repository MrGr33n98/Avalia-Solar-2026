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
import { Button } from '@/components/ui/button';
import { 
  Star, 
  X, 
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

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
    <Dialog modal={false} open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName="pointer-events-none bg-black/35"
        className="!bottom-auto !left-1/2 !top-1/2 grid !max-h-[60dvh] !w-[min(480px,calc(100vw-64px))] !max-w-[480px] !-translate-x-1/2 !-translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl transition-all duration-300 sm:!max-h-[85vh] sm:!w-[calc(100vw-64px)] sm:!max-w-[1020px] sm:rounded-lg"
      >
        
        {/* Swiss Design Header */}
        <DialogHeader className="sticky top-0 z-40 space-y-0 border-b border-slate-200 bg-white px-3 py-3 pr-12 md:px-8 md:py-4 md:pr-14">
          <div className="text-left md:mb-3 md:hidden">
            <DialogTitle className="text-sm font-semibold text-slate-950">Comparar empresas</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">{companies.length} de 4 empresas selecionadas</DialogDescription>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <DialogTitle className="sr-only">Comparar empresas</DialogTitle>
              <DialogDescription className="sr-only">Selecione até 4 empresas para comparar</DialogDescription>
              
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Sua comparação:
              </span>
              
              {companies.map((comp) => {
                const logoUrl = comp.logo_url ? getFullImageUrl(comp.logo_url) : null;
                return (
                  <div 
                    key={comp.id}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-1 pr-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-100 bg-white flex items-center justify-center shrink-0">
                      {logoUrl ? (
                        <Image 
                          src={logoUrl} 
                          alt="" 
                          fill 
                          className="object-contain p-0.5" 
                          sizes="20px"
                        />
                      ) : (
                        <Building2 className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </div>
                    <span className="truncate max-w-[120px]">{comp.name}</span>
                    <button 
                      onClick={() => onRemoveCompany(comp.id)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {companies.length < 3 && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                  title="Adicionar mais empresas"
                >
                  <span className="text-base font-semibold leading-none">+</span>
                </button>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="hidden h-9 w-full rounded-none border border-slate-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 md:inline-flex md:w-auto"
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Limpar Análise
            </Button>
          </div>
        </DialogHeader>

        {/* Comparison Grid */}
        <div className="min-h-0 overflow-y-auto overscroll-contain">
            <div className="p-2 md:p-8 md:pb-16">
              <p className="mb-2 flex items-center justify-end gap-1 text-[11px] font-medium text-blue-700 md:hidden">
                Arraste para o lado para ver mais empresas <span aria-hidden="true">→</span>
              </p>
              <div className="relative overflow-hidden rounded-none border border-slate-200 bg-white shadow-none">
                <div className="w-full touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth">
                  <div className="mobile-comparison-table flex w-full min-w-[554px] flex-col divide-y divide-slate-100 md:min-w-[960px]">
                    
                    {/* Header Row: Company Logos & Names */}
                    <div className="sticky top-0 z-30 grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex flex-col justify-end bg-slate-50/50 p-2 md:p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CRITÉRIOS</span>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {companies.slice(0, 4).map((company) => {
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
                                "group relative flex flex-col bg-white p-2 pt-10 transition-colors md:p-5",
                                isHighlighted && "bg-blue-50/10 ring-1 ring-blue-500 ring-inset z-10"
                              )}
                            >
                              {/* Swiss Label Destaque */}
                              {isHighlighted && (
                                <div className="absolute inset-x-2 top-2 inline-flex items-center justify-center whitespace-nowrap rounded bg-blue-600 px-1 py-1 text-[10px] font-bold leading-none tracking-tight text-white shadow-sm md:left-5 md:right-auto md:px-2.5 md:py-0.5 md:uppercase md:tracking-widest">
                                  Melhor avaliada
                                </div>
                              )}

                              <button 
                                onClick={() => onRemoveCompany(company.id)} 
                                aria-label={`Remover ${company.name} da comparação`}
                                className="absolute right-1 top-9 rounded bg-slate-50 p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none md:right-3 md:top-3"
                                title="Remover"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>

                              <div className="flex flex-col items-start gap-1 md:mt-2 md:flex-row md:justify-between md:gap-4">
                                {/* Logo Container */}
                                <div className="relative flex h-9 w-11 items-center justify-center overflow-hidden rounded border border-slate-100 bg-white p-1 md:h-10 md:w-16">
                                  {logoUrl ? (
                                    <Image
                                      src={logoUrl}
                                      alt={`Logo da ${company.name}`}
                                      fill
                                      sizes="64px"
                                      className="object-contain"
                                    />
                                  ) : (
                                    <Building2 className="h-4 w-4 text-slate-300" aria-hidden="true" />
                                  )}
                                </div>

                                {/* Status Badge */}
                                {company.verified ? (
                                  <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[10px] font-bold uppercase tracking-tight text-emerald-800 md:px-1.5 md:tracking-wider">
                                    Verificada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-bold uppercase tracking-tight text-slate-500 md:px-1.5 md:tracking-wider">
                                    Em análise
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 md:mt-4">
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
                                          className={`h-2.5 w-2.5 md:h-3 md:w-3 ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                        />
                                      );
                                    })}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-900">{rating > 0 ? rating.toFixed(1) : 'S/N'}</span>
                                  {reviews > 0 && (
                                    <span className="text-[10px] text-slate-400">({reviews})</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Empty Slots */}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div 
                          key={`empty-${i}`}
                          className="flex flex-col items-center justify-center bg-slate-50/20 p-2 md:p-5"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Livre</span>
                        </div>
                      ))}
                    </div>

                    {/* 1. Reputação Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Reputação</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Avaliação geral de clientes</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                        const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
                        const isHighlighted = company.id === highestRatedCompanyId;

                        return (
                          <div key={`rep-${company.id}`} className={cn("flex flex-col justify-center gap-1 p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            {rating > 0 ? (
                              <>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-sm font-extrabold text-slate-950">{rating.toFixed(1)}</span>
                                  <span className="text-[10px] text-slate-400">/ 5.0</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className={cn("h-1 rounded-full", isHighlighted ? 'bg-blue-600' : 'bg-slate-800')}
                                    style={{ width: `${(rating / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400">{reviews} depoimentos</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">Sem avaliações</span>
                            )}
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-rep-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* 2. Verificação Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Certificações</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Documentação e verificação</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`ver-${company.id}`} className={cn("flex flex-col justify-center p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
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
                            <span className="mt-0.5 text-[10px] text-slate-400">
                              {company.verified ? 'Dados auditados' : 'Documentação pendente'}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-ver-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* 3. Tempo de Resposta Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">SLA de Contato</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Tempo médio de resposta</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const speed = getSpeedBadge(company.response_time_sla);
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`time-${company.id}`} className={cn("flex flex-col justify-center p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{company.response_time_sla || 'Sob consulta'}</span>
                              {speed && (
                                <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold ${speed.color}`}>
                                  {speed.label}
                                </span>
                              )}
                            </div>
                            <span className="mt-0.5 text-[10px] text-slate-400">SLA de atendimento</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-time-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* 4. Cobertura Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Abrangência</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Região de atuação</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const coverageCount = getCoverageCount(company);
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`cov-${company.id}`} className={cn("flex flex-col justify-center p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950 truncate">
                              {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                            </span>
                            <span className="mt-0.5 text-[10px] text-slate-400">
                              {coverageCount > 0 ? `+${coverageCount} regiões` : 'Sob consulta'}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-cov-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* 5. Projetos Realizados Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Volume</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Projetos entregues</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const projects = company.delivered_projects_score || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`proj-${company.id}`} className={cn("flex flex-col justify-center p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950">{projects > 0 ? `+${projects} projetos` : 'Consultar'}</span>
                            <span className="mt-0.5 text-[10px] text-slate-400">Histórico verificado</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-proj-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* 6. Garantia Oferecida Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Garantia</h5>
                          <p className="text-[10px] leading-tight text-slate-400">Cobertura pós-instalação</p>
                        </div>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const warranty = company.warranty_years || 0;
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`gar-${company.id}`} className={cn("flex flex-col justify-center p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            <span className="text-xs font-bold text-slate-950">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                            <span className="mt-0.5 text-[10px] text-slate-400">Tempo médio</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-gar-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                    {/* Action Row */}
                    <div className="grid grid-cols-[82px_repeat(4,118px)] divide-x divide-slate-100 bg-slate-50/30 md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                      <div className="flex items-center p-2 md:p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cotação</span>
                      </div>
                      {companies.slice(0, 4).map((company) => {
                        const isHighlighted = company.id === highestRatedCompanyId;
                        return (
                          <div key={`cta-${company.id}`} className={cn("p-2 md:p-4", isHighlighted && "bg-blue-50/5")}>
                            <Button 
                              className={cn(
                                "h-9 w-full rounded-md border text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all md:h-11",
                                "bg-[#FFF7ED] hover:bg-[#FFEED5] border-[#FDBA74] text-[#C2410C]",
                                "dark:bg-orange-950/20 dark:hover:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400"
                              )}
                              onClick={() => handleQuoteClick(company.id)}
                              aria-label={`Solicitar orçamento da ${company.name}`}
                            >
                              Cotar
                            </Button>
                          </div>
                        );
                      })}
                      {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                        <div key={`empty-cta-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                      ))}
                    </div>

                  </div>
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/65 to-transparent md:hidden"
                />
              </div>
            </div>
        </div>
        <div className="sticky bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
          <Button variant="outline" className="h-11 rounded-none" onClick={onClose}>
            Adicionar empresa
          </Button>
          <Button
            className="h-11 rounded-none bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              track('comparison_modal_compare_confirm', { companies_count: companies.length });
              onClose();
            }}
          >
            Comparar {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
