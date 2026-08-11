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
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Star, X, ShieldCheck, Building2, Minimize2 } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';

const getCoverageCount = (company: ComparisonCompany) => {
  const cities = Array.isArray(company.coverage_cities)
    ? company.coverage_cities
    : String(company.coverage_cities || '')
        .split(',')
        .filter(Boolean);
  const states = Array.isArray(company.coverage_states)
    ? company.coverage_states
    : String(company.coverage_states || '')
        .split(',')
        .filter(Boolean);
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

interface ComparisonCompany {
  id: number;
  slug: string;
  name: string;
  city: string;
  state: string;
  verified: boolean;
  logo_url?: string | null;
  rating?: number;
  rating_avg?: number;
  average_rating?: number;
  rating_count?: number;
  reviews_count?: number;
  total_reviews?: number;
  coverage_cities?: string | string[];
  coverage_states?: string | string[];
  delivered_projects_score?: number;
  response_time_sla?: string;
  warranty_years?: number;
}

interface CompanyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: ComparisonCompany[];
  onRemoveCompany: (id: number) => void;
  onClearAll: () => void;
}

interface MobileComparisonContentProps {
  companies: ComparisonCompany[];
  highestRatedCompanyId?: number;
  onRemoveCompany: (id: number) => void;
  onAddCompany: () => void;
  onQuote: (companyId: number) => void;
}

function MobileComparisonContent({
  companies,
  highestRatedCompanyId,
  onRemoveCompany,
  onAddCompany,
  onQuote,
}: MobileComparisonContentProps) {
  const visibleCompanies = companies.slice(0, 3);

  const rows = visibleCompanies.length
    ? [
        {
          label: 'Reputação',
          detail: 'Avaliação',
          render: (company: ComparisonCompany) => {
            const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
            const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
            return (
              <>
                <span className="text-sm font-extrabold text-slate-950">{rating > 0 ? rating.toFixed(1) : 'S/N'}</span>
                <span className="text-[10px] text-amber-500">{rating > 0 ? '★★★★★' : 'Sem avaliações'}</span>
                {reviews > 0 && <span className="text-[10px] text-slate-400">{reviews} avaliação{reviews === 1 ? '' : 'ões'}</span>}
              </>
            );
          },
        },
        {
          label: 'Certificações',
          detail: 'Documentação',
          render: (company: ComparisonCompany) => (
            <>
              <span className={cn('text-xs font-bold', company.verified ? 'text-emerald-700' : 'text-slate-500')}>
                {company.verified ? 'Verificada' : 'Em análise'}
              </span>
              <span className="text-[10px] text-slate-400">
                {company.verified ? 'Dados auditados' : 'Pendente'}
              </span>
            </>
          ),
        },
        {
          label: 'SLA',
          detail: 'Resposta',
          render: (company: ComparisonCompany) => {
            const speed = getSpeedBadge(company.response_time_sla);
            return (
              <>
                <span className="text-xs font-bold text-slate-950">{company.response_time_sla || 'Consultar'}</span>
                {speed && <span className={cn('w-fit rounded border px-1 py-0.5 text-[9px] font-bold', speed.color)}>{speed.label}</span>}
              </>
            );
          },
        },
        {
          label: 'Abrangência',
          detail: 'Atuação',
          render: (company: ComparisonCompany) => (
            <>
              <span className="truncate text-xs font-bold text-slate-950">{[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}</span>
              <span className="text-[10px] text-slate-400">
                {getCoverageCount(company) > 0 ? `+${getCoverageCount(company)} regiões` : 'Sob consulta'}
              </span>
            </>
          ),
        },
        {
          label: 'Volume',
          detail: 'Projetos',
          render: (company: ComparisonCompany) => (
            <>
              <span className="text-xs font-bold text-slate-950">{company.delivered_projects_score ? `+${company.delivered_projects_score}` : 'Consultar'}</span>
              <span className="text-[10px] text-slate-400">Projetos entregues</span>
            </>
          ),
        },
        {
          label: 'Garantia',
          detail: 'Pós-instalação',
          render: (company: ComparisonCompany) => (
            <>
              <span className="text-xs font-bold text-slate-950">{company.warranty_years ? `${company.warranty_years} anos` : 'Consultar'}</span>
              <span className="text-[10px] text-slate-400">Cobertura</span>
            </>
          ),
        },
      ]
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-1">
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {visibleCompanies.map((company) => {
          const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
          const isHighlighted = company.id === highestRatedCompanyId;
          return (
            <div key={company.id} className={cn('relative min-w-0 rounded-lg border bg-white p-1.5 shadow-sm', isHighlighted ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200')}>
              <button onClick={() => onRemoveCompany(company.id)} aria-label={`Remover ${company.name} da comparação`} className="absolute right-0.5 top-0.5 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
              <div className="relative mx-auto mb-1 h-7 w-9 overflow-hidden rounded border border-slate-100 bg-white">
                {logoUrl ? <Image src={logoUrl} alt="" fill sizes="36px" className="object-contain p-0.5" /> : <Building2 className="m-auto h-3.5 w-3.5 text-slate-300" />}
              </div>
              <Link href={`/companies/${company.slug || company.id}`} className="block min-w-0">
                <span className="block truncate text-[10px] font-bold text-slate-900">{company.name}</span>
              </Link>
              <span className="block truncate text-[9px] text-slate-400">{[company.city, company.state].filter(Boolean).join(', ') || 'Localização não informada'}</span>
            </div>
          );
        })}
        {visibleCompanies.length < 3 && <button onClick={onAddCompany} className="flex min-h-[70px] items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-xs font-bold text-blue-700">+ Adicionar</button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[76px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0">
            <div className="bg-slate-50/70 px-2 py-2">
              <span className="block text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-800">{row.label}</span>
              <span className="block text-[9px] leading-tight text-slate-400">{row.detail}</span>
            </div>
            <div className="grid min-w-0 grid-cols-3 divide-x divide-slate-100">
              {visibleCompanies.map((company) => (
                <div key={`${row.label}-${company.id}`} className={cn('flex min-w-0 flex-col justify-center gap-0.5 px-1.5 py-2', company.id === highestRatedCompanyId && 'bg-blue-50/40')}>
                  {row.render(company)}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[76px_minmax(0,1fr)] bg-slate-50/50">
          <span className="px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cotação</span>
          <div className="grid min-w-0 grid-cols-3 divide-x divide-slate-100">
            {visibleCompanies.map((company) => (
              <div key={`mobile-cta-${company.id}`} className="px-1.5 py-2">
                <Button onClick={() => onQuote(company.id)} className="h-8 w-full rounded-md border border-[#FDBA74] bg-[#FFF7ED] px-1 text-[9px] font-bold text-[#C2410C] hover:bg-[#FFEED5]">Cotar</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MobileComparisonContentProps {
  companies: ComparisonCompany[];
  highestRatedCompanyId?: number;
  onRemoveCompany: (id: number) => void;
  onAddCompany: () => void;
  onQuote: (companyId: number) => void;
}

function MobileComparisonContent({
  companies,
  highestRatedCompanyId,
  onRemoveCompany,
  onAddCompany,
  onQuote,
}: MobileComparisonContentProps) {
  const visibleCompanies = companies.slice(0, 3);

  const rows = [
    {
      label: 'Reputação',
      detail: 'Avaliação',
      render: (company: ComparisonCompany) => {
        const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
        const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
        return (
          <>
            <span className="text-sm font-extrabold text-slate-950">{rating > 0 ? rating.toFixed(1) : 'S/N'}</span>
            <span className="text-[10px] text-amber-500">{rating > 0 ? '★★★★★' : 'Sem avaliações'}</span>
            {reviews > 0 && <span className="text-[10px] text-slate-400">{reviews} avaliação{reviews === 1 ? '' : 'ões'}</span>}
          </>
        );
      },
    },
    {
      label: 'Certificações',
      detail: 'Documentação',
      render: (company: ComparisonCompany) => (
        <>
          <span className={cn('text-xs font-bold', company.verified ? 'text-emerald-700' : 'text-slate-500')}>
            {company.verified ? 'Verificada' : 'Em análise'}
          </span>
          <span className="text-[10px] text-slate-400">{company.verified ? 'Dados auditados' : 'Pendente'}</span>
        </>
      ),
    },
    {
      label: 'SLA',
      detail: 'Resposta',
      render: (company: ComparisonCompany) => {
        const speed = getSpeedBadge(company.response_time_sla);
        return (
          <>
            <span className="truncate text-xs font-bold text-slate-950">{company.response_time_sla || 'Consultar'}</span>
            {speed && <span className={cn('w-fit rounded border px-1 py-0.5 text-[9px] font-bold', speed.color)}>{speed.label}</span>}
          </>
        );
      },
    },
    {
      label: 'Abrangência',
      detail: 'Atuação',
      render: (company: ComparisonCompany) => {
        const coverageCount = getCoverageCount(company);
        return (
          <>
            <span className="truncate text-xs font-bold text-slate-950">{[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}</span>
            <span className="text-[10px] text-slate-400">{coverageCount > 0 ? `+${coverageCount} regiões` : 'Sob consulta'}</span>
          </>
        );
      },
    },
    {
      label: 'Volume',
      detail: 'Projetos',
      render: (company: ComparisonCompany) => (
        <>
          <span className="text-xs font-bold text-slate-950">{company.delivered_projects_score ? `+${company.delivered_projects_score}` : 'Consultar'}</span>
          <span className="text-[10px] text-slate-400">Projetos entregues</span>
        </>
      ),
    },
    {
      label: 'Garantia',
      detail: 'Pós-instalação',
      render: (company: ComparisonCompany) => (
        <>
          <span className="text-xs font-bold text-slate-950">{company.warranty_years ? `${company.warranty_years} anos` : 'Consultar'}</span>
          <span className="text-[10px] text-slate-400">Cobertura</span>
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-1 md:hidden">
      <div className="mb-2 grid min-w-0 grid-cols-3 gap-1.5">
        {visibleCompanies.map((company) => {
          const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
          const isHighlighted = company.id === highestRatedCompanyId;
          return (
            <div key={company.id} className={cn('relative min-w-0 rounded-lg border bg-white p-1.5 shadow-sm', isHighlighted ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200')}>
              <button onClick={() => onRemoveCompany(company.id)} aria-label={`Remover ${company.name} da comparação`} className="absolute right-0.5 top-0.5 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
              <div className="relative mx-auto mb-1 h-7 w-9 overflow-hidden rounded border border-slate-100 bg-white">
                {logoUrl ? <Image src={logoUrl} alt="" fill sizes="36px" className="object-contain p-0.5" /> : <Building2 className="m-auto h-3.5 w-3.5 text-slate-300" />}
              </div>
              <Link href={`/companies/${company.slug || company.id}`} className="block min-w-0">
                <span className="block truncate text-[10px] font-bold text-slate-900">{company.name}</span>
              </Link>
              <span className="block truncate text-[9px] text-slate-400">{[company.city, company.state].filter(Boolean).join(', ') || 'Localização não informada'}</span>
            </div>
          );
        })}
        {visibleCompanies.length < 3 && <button onClick={onAddCompany} className="flex min-h-[70px] min-w-0 items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-xs font-bold text-blue-700">+ Adicionar</button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white">
        {rows.map((row) => (
          <div key={row.label} className="grid min-w-0 grid-cols-[68px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0">
            <div className="bg-slate-50/70 px-1.5 py-2">
              <span className="block text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-800">{row.label}</span>
              <span className="block text-[9px] leading-tight text-slate-400">{row.detail}</span>
            </div>
            <div className="grid min-w-0 grid-cols-3 divide-x divide-slate-100">
              {visibleCompanies.map((company) => <div key={`${row.label}-${company.id}`} className={cn('flex min-w-0 flex-col justify-center gap-0.5 px-1.5 py-2', company.id === highestRatedCompanyId && 'bg-blue-50/40')}>{row.render(company)}</div>)}
            </div>
          </div>
        ))}
        <div className="grid min-w-0 grid-cols-[68px_minmax(0,1fr)] bg-slate-50/50">
          <span className="px-1.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cotação</span>
          <div className="grid min-w-0 grid-cols-3 divide-x divide-slate-100">
            {visibleCompanies.map((company) => <div key={`mobile-cta-${company.id}`} className="min-w-0 px-1.5 py-2"><Button onClick={() => onQuote(company.id)} className="h-8 w-full rounded-md border border-[#FDBA74] bg-[#FFF7ED] px-1 text-[9px] font-bold text-[#C2410C] hover:bg-[#FFEED5]">Cotar</Button></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyComparisonModal({
  isOpen,
  onClose,
  companies,
  onRemoveCompany,
  onClearAll,
}: CompanyComparisonModalProps) {
  const highestRatedCompanyId = companies.reduce((prev, current) => {
    const prevRating = Number(prev.average_rating ?? prev.rating_avg ?? 0);
    const currRating = Number(current.average_rating ?? current.rating_avg ?? 0);
    return currRating > prevRating ? current : prev;
  }, companies[0])?.id;

  useEffect(() => {
    if (isOpen && companies.length > 0) {
      track('comparison_modal_opened', {
        companies_count: companies.length,
        company_ids: companies.map((c) => c.id),
        company_names: companies.map((c) => c.name),
      });

      // Dispara sinal de intenção de compra (Buyer Intent) para cada empresa comparada
      companies.forEach((company) => {
        sendIntentSignal({
          company_id: company.id,
          signal_type: companies.length >= 3 ? 'comparison_third_added' : 'comparison_view',
          signal_category: 'research_intent',
          element_type: 'comparison_modal',
          metadata: {
            compared_with_ids: companies.filter((c) => c.id !== company.id).map((c) => c.id),
            total_compared: companies.length,
          },
        });
      });
    }
  }, [isOpen, companies]);

  const handleQuoteClick = (companyId: number) => {
    track('comparison_modal_quote_click', { company_id: companyId });
    sendIntentSignal({
      company_id: companyId,
      signal_type: 'contact_info_reveal',
      signal_category: 'contact_intent',
      element_type: 'comparison_quote_button',
      metadata: { source: 'comparison-modal' },
    });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-modal', type: 'quick' });
  };

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName="pointer-events-none bg-black/35"
        className="!bottom-auto !left-1/2 !top-1/2 grid !max-h-[78dvh] !w-[calc(100vw-24px)] !max-w-[480px] !-translate-x-1/2 !-translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-0 shadow-lg transition-all duration-300 md:!max-h-[85vh] md:!w-[calc(100vw-64px)] md:!max-w-[1020px] md:rounded-lg md:border md:shadow-xl"
      >
        {/* Swiss Design Header */}
        <DialogHeader className="sticky top-0 z-40 space-y-0 border-b border-blue-500/30 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-700 px-3 py-3 pr-12 md:px-8 md:py-4 md:pr-14">
          <div className="mb-1 flex items-center justify-between md:hidden">
            <div className="flex min-w-0 items-center gap-2 text-left">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15 text-white" aria-hidden="true">
                ⇄
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm font-semibold text-white">
                  Comparar empresas
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[10px] text-blue-100">
                  {Math.min(companies.length, 3)} de 3 exibidas
                </DialogDescription>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 rounded-md border border-blue-200 bg-blue-50 px-2 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                title="Minimizar modal para o balão flutuante"
              >
                <Minimize2 className="mr-1 h-3 w-3 stroke-[2.5]" />
                Minimizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Fechar comparação"
                className="h-7 w-7 rounded-md border border-white/30 p-0 text-white hover:bg-white/15"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <DialogTitle className="sr-only">Comparar empresas</DialogTitle>
              <DialogDescription className="sr-only">
                Selecione até 4 empresas para comparar
              </DialogDescription>

              <span className="text-sm font-bold text-white">
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

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 rounded-lg border border-blue-200 bg-blue-50/80 px-3.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 hover:text-blue-800 shadow-xs"
                title="Minimizar para o balão flutuante"
              >
                <Minimize2 className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                Minimizar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar Análise
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Comparison Grid */}
        <div className="hidden min-h-0 overflow-y-auto md:block">
          <div className="p-2 md:p-8 md:pb-16">
            <p className="mb-2 flex items-center justify-end gap-1 text-[11px] font-medium text-blue-700 md:hidden">
              {companies.length > 2 ? (
                <>
                  Deslize para ver mais empresas <span aria-hidden="true">→</span>
                </>
              ) : (
                'Empresas lado a lado'
              )}
            </p>
            <div className="relative overflow-hidden rounded-none border border-slate-200 bg-white shadow-none max-w-full">
              <div className="w-full touch-auto overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-none max-w-full">
                <div className="mobile-comparison-table flex w-full min-w-[530px] flex-col divide-y divide-slate-100 md:min-w-[960px] max-w-full">
                  {/* Header Row: Company Logos & Names */}
                  <div className="sticky top-0 z-30 grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex flex-col justify-end bg-slate-50/50 p-2 md:p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        CRITÉRIOS
                      </span>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {companies.slice(0, 4).map((company) => {
                        const isHighlighted = company.id === highestRatedCompanyId;
                        const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                        const rating = Number(
                          company.average_rating ?? company.rating_avg ?? company.rating ?? 0
                        );
                        const reviews = Number(
                          company.rating_count ??
                            company.reviews_count ??
                            company.total_reviews ??
                            0
                        );

                        return (
                          <motion.div
                            key={company.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={cn(
                              'group relative flex flex-col bg-white p-2 pt-10 transition-colors md:p-5 md:pt-10',
                              isHighlighted && 'bg-blue-50/10 ring-1 ring-blue-500 ring-inset z-10'
                            )}
                          >
                            {/* Swiss Label Destaque */}
                            {isHighlighted && (
                              <div className="absolute inset-x-1.5 top-2 z-20 inline-flex items-center justify-center whitespace-nowrap rounded bg-blue-600 px-1 py-1 text-[9px] font-bold leading-none tracking-tight text-white shadow-sm md:left-5 md:right-auto md:px-2.5 md:py-0.5 md:text-[10px] md:uppercase md:tracking-widest">
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
                                  <Building2
                                    className="h-4 w-4 text-slate-300"
                                    aria-hidden="true"
                                  />
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
                              <Link
                                href={`/companies/${company.slug || company.id}`}
                                className="hover:text-blue-600 block"
                              >
                                <h4 className="text-xs font-bold uppercase tracking-tight leading-snug line-clamp-1 text-slate-900">
                                  {company.name}
                                </h4>
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
                                <span className="text-[10px] font-bold text-slate-900">
                                  {rating > 0 ? rating.toFixed(1) : 'S/N'}
                                </span>
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Livre
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 1. Reputação Row */}
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Reputação
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Avaliação geral de clientes
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const rating = Number(
                        company.average_rating ?? company.rating_avg ?? company.rating ?? 0
                      );
                      const reviews = Number(
                        company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0
                      );
                      const isHighlighted = company.id === highestRatedCompanyId;

                      return (
                        <div
                          key={`rep-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center gap-1 p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          {rating > 0 ? (
                            <>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-sm font-extrabold text-slate-950">
                                  {rating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-slate-400">/ 5.0</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={cn(
                                    'h-1 rounded-full',
                                    isHighlighted ? 'bg-blue-600' : 'bg-slate-800'
                                  )}
                                  style={{ width: `${(rating / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {reviews} depoimentos
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Sem avaliações
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                      <div key={`empty-rep-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                    ))}
                  </div>

                  {/* 2. Verificação Row */}
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Certificações
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Documentação e verificação
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`ver-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                            {company.verified ? (
                              <>
                                <span className="text-emerald-700 text-[11px] font-bold">
                                  Verificada
                                </span>
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              </>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-bold">
                                Em análise
                              </span>
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
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          SLA de Contato
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Tempo médio de resposta
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const speed = getSpeedBadge(company.response_time_sla);
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`time-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {company.response_time_sla || 'Sob consulta'}
                            </span>
                            {speed && (
                              <span
                                className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold ${speed.color}`}
                              >
                                {speed.label}
                              </span>
                            )}
                          </div>
                          <span className="mt-0.5 text-[10px] text-slate-400">
                            SLA de atendimento
                          </span>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                      <div key={`empty-time-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                    ))}
                  </div>

                  {/* 4. Cobertura Row */}
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Abrangência
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Região de atuação
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const coverageCount = getCoverageCount(company);
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`cov-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          <span className="text-xs font-bold text-slate-950 truncate">
                            {[company.city, company.state].filter(Boolean).join(', ') ||
                              'Consultar'}
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
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Volume
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Projetos entregues
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const projects = company.delivered_projects_score || 0;
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`proj-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          <span className="text-xs font-bold text-slate-950">
                            {projects > 0 ? `+${projects} projetos` : 'Consultar'}
                          </span>
                          <span className="mt-0.5 text-[10px] text-slate-400">
                            Histórico verificado
                          </span>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                      <div key={`empty-proj-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                    ))}
                  </div>

                  {/* 6. Garantia Oferecida Row */}
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-white md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center bg-slate-50/30 p-2 md:p-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Garantia
                        </h5>
                        <p className="text-[10px] leading-tight text-slate-400">
                          Cobertura pós-instalação
                        </p>
                      </div>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const warranty = company.warranty_years || 0;
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`gar-${company.id}`}
                          className={cn(
                            'flex flex-col justify-center p-2 md:p-4',
                            isHighlighted && 'bg-blue-50/5'
                          )}
                        >
                          <span className="text-xs font-bold text-slate-950">
                            {warranty > 0 ? `${warranty} anos` : 'Consultar'}
                          </span>
                          <span className="mt-0.5 text-[10px] text-slate-400">Tempo médio</span>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - Math.min(companies.length, 4) }).map((_, i) => (
                      <div key={`empty-gar-${i}`} className="bg-slate-50/5 p-2 md:p-4"></div>
                    ))}
                  </div>

                  {/* Action Row */}
                  <div className="grid grid-cols-[82px_repeat(4,112px)] divide-x divide-slate-100 bg-slate-50/30 md:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
                    <div className="flex items-center p-2 md:p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Cotação
                      </span>
                    </div>
                    {companies.slice(0, 4).map((company) => {
                      const isHighlighted = company.id === highestRatedCompanyId;
                      return (
                        <div
                          key={`cta-${company.id}`}
                          className={cn('p-2 md:p-4', isHighlighted && 'bg-blue-50/5')}
                        >
                          <Button
                            className={cn(
                              'h-9 w-full rounded-md border text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all md:h-11',
                              'bg-[#FFF7ED] hover:bg-[#FFEED5] border-[#FDBA74] text-[#C2410C]',
                              'dark:bg-orange-950/20 dark:hover:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400'
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
              {companies.length > 2 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 flex w-7 items-center justify-end bg-gradient-to-l from-white via-white/70 to-transparent pr-1 text-sm font-bold text-blue-600 md:hidden"
                >
                  →
                </div>
              )}
            </div>
          </div>
        </div>
        <MobileComparisonContent
          companies={companies}
          highestRatedCompanyId={highestRatedCompanyId}
          onRemoveCompany={onRemoveCompany}
          onAddCompany={onClose}
          onQuote={handleQuoteClick}
        />
        <div className="sticky bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-blue-500/30 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-700 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden">
          <Button variant="outline" className="h-9 rounded-md border-white/70 bg-white px-2 text-[11px] font-bold text-blue-800 hover:bg-blue-50" onClick={onClose}>
            Adicionar empresa
          </Button>
          <Button
            className="h-9 rounded-md bg-white px-2 text-[11px] font-bold text-blue-800 hover:bg-blue-50"
            onClick={() => {
              track('comparison_modal_compare_confirm', { companies_count: companies.length });
              onClose();
            }}
          >
            Comparar {Math.min(companies.length, 3)} {Math.min(companies.length, 3) === 1 ? 'empresa' : 'empresas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
