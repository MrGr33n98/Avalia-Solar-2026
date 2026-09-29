'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Star, X, ShieldCheck, Building2, ExternalLink, Plus } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { hasPaidPlan } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { getCoverageLabel } from '@/lib/company/coverage-label';
import { COMPARISON_LIMITS } from '@/lib/comparison/config';

const getSpeedBadge = (time?: string) => {
  if (!time || time === 'Consultar' || time === 'Sob consulta') return null;
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
  verification_status?: string;
  logo_url?: string | null;
  rating?: number;
  rating_avg?: number;
  average_rating?: number;
  rating_count?: number;
  reviews_count?: number;
  total_reviews?: number;
  coverage_cities?: string | string[];
  coverage_states?: string | string[];
  service_areas?: Array<{
    coverage_type: 'city' | 'state' | 'national' | 'radius';
    state_code?: string | null;
    city_name?: string | null;
    radius_km?: number | null;
  }>;
  delivered_projects_count?: number;
  delivered_projects_score?: number;
  response_time_sla?: string;
  warranty_years?: number;
  installation_warranty_years?: number;
  has_paid_plan?: boolean | null;
  cta_whatsapp_enabled?: boolean | null;
  whatsapp?: string | null;
  whatsapp_url?: string | null;
  phone?: string | null;
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
  const visibleCompanies = companies.slice(0, COMPARISON_LIMITS.mobile);
  const mobileGridColumns = 'grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)]';

  const getVerificationText = (company: ComparisonCompany) => {
    if (company.verified) return 'Verificada';
    if (company.verification_status === 'pending') return 'Em análise';
    return 'Não verificada';
  };

  const rows = [
    {
      label: 'Reputação',
      detail: 'Avaliação geral',
      render: (company: ComparisonCompany) => {
        const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
        const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
        return (
          <>
            <span className="text-sm font-extrabold text-slate-950">{rating > 0 ? rating.toFixed(1) : '—'}</span>
            <span className="text-[11px] text-amber-500" aria-hidden="true">{rating > 0 ? '★★★★★' : ''}</span>
            <span className="text-[10px] text-slate-500">
              {reviews > 0 ? `${reviews} avaliação${reviews === 1 ? '' : 'ões'}` : 'Sem avaliações'}
            </span>
          </>
        );
      },
    },
    {
      label: 'Certificação',
      detail: 'Status auditado',
      render: (company: ComparisonCompany) => (
        <>
          <span className={cn('text-xs font-bold', company.verified ? 'text-emerald-700' : 'text-slate-600')}>
            {getVerificationText(company)}
          </span>
          <span className="text-[10px] text-slate-400">
            {company.verified ? 'Dados auditados' : 'Documentação em análise'}
          </span>
        </>
      ),
    },
    {
      label: 'SLA',
      detail: 'Tempo resposta',
      render: (company: ComparisonCompany) => {
        const speed = getSpeedBadge(company.response_time_sla);
        return (
          <>
            <span className="line-clamp-2 break-words text-xs font-bold leading-tight text-slate-950">
              {company.response_time_sla || 'Sob consulta'}
            </span>
            {speed && (
              <span className={cn('w-fit rounded border px-1 py-0.5 text-[10px] font-bold', speed.color)}>
                {speed.label}
              </span>
            )}
          </>
        );
      },
    },
    {
      label: 'Abrangência',
      detail: 'Área de atuação',
      render: (company: ComparisonCompany) => {
        return (
          <>
            <span className="line-clamp-2 break-words text-xs font-bold leading-tight text-slate-950">
              {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
            </span>
            <span className="text-[10px] text-slate-400">{getCoverageLabel(company)}</span>
          </>
        );
      },
    },
    {
      label: 'Volume',
      detail: 'Projetos',
      render: (company: ComparisonCompany) => {
        const count = company.delivered_projects_count ?? company.delivered_projects_score ?? 0;
        return (
          <span className="text-xs font-bold text-slate-950">
            {count > 0 ? `+${count} projetos` : 'Consultar'}
          </span>
        );
      },
    },
    {
      label: 'Garantia',
      detail: 'Pós-instalação',
      render: (company: ComparisonCompany) => {
        const years = company.warranty_years ?? company.installation_warranty_years ?? 0;
        return (
          <span className="text-xs font-bold text-slate-950">
            {years > 0 ? `${years} anos` : 'Consultar'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-1 pt-1 md:hidden">
      {/* Cards de cabeçalho das empresas no PWA */}
      <div className={cn('mb-1.5 grid min-w-0 gap-1.5', mobileGridColumns)}>
        <div className="min-w-0 rounded-lg bg-slate-100/80 p-2 flex items-center justify-center" aria-hidden="true">
          <span className="text-[10px] font-bold uppercase text-slate-500">Empresas</span>
        </div>
        {visibleCompanies.map((company) => {
          const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
          const isHighlighted = company.id === highestRatedCompanyId;
          return (
            <div
              key={company.id}
              className={cn(
                'relative min-w-0 rounded-lg border bg-white p-2 pr-6 shadow-xs min-h-[64px] flex flex-col justify-between',
                isHighlighted ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-slate-100 bg-white">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="" fill sizes="28px" className="object-contain p-0.5" />
                  ) : (
                    <Building2 className="m-auto h-4 w-4 text-slate-300" />
                  )}
                </div>
                <Link href={`/companies/${company.slug || company.id}`} className="min-w-0 flex-1">
                  <span className="line-clamp-1 break-normal text-xs font-bold leading-tight text-slate-900">
                    {company.name}
                  </span>
                  <span className="block truncate text-[10px] leading-tight text-slate-400">
                    {[company.city, company.state].filter(Boolean).join(', ') || 'Localização n/i'}
                  </span>
                </Link>
              </div>
              <button
                onClick={() => onRemoveCompany(company.id)}
                aria-label={`Remover ${company.name} da comparação`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {visibleCompanies.length < COMPARISON_LIMITS.mobile && (
          <button
            onClick={onAddCompany}
            className="flex min-h-[64px] min-w-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100/50"
          >
            <Plus className="h-4 w-4 mb-0.5" />
            Adicionar
          </button>
        )}
      </div>

      {/* Tabela de critérios no PWA */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-xs">
        {rows.map((row) => (
          <div key={row.label} className={cn('grid min-w-0', mobileGridColumns, 'border-b border-slate-100 last:border-b-0')}>
            <div className="min-w-0 bg-slate-50/80 px-2 py-2.5">
              <span className="block break-normal text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-800">
                {row.label}
              </span>
              <span className="block break-normal text-[10px] leading-tight text-slate-400">
                {row.detail}
              </span>
            </div>
            {visibleCompanies.map((company) => (
              <div
                key={`${row.label}-${company.id}`}
                className={cn(
                  'flex min-w-0 flex-col items-start justify-center gap-0.5 px-2 py-2.5 break-words whitespace-normal',
                  company.id === highestRatedCompanyId && 'bg-blue-50/20'
                )}
              >
                {row.render(company)}
              </div>
            ))}
          </div>
        ))}
        {/* Linha de Orçamento */}
        <div className={cn('grid min-w-0', mobileGridColumns, 'bg-slate-50/50')}>
          <div className="min-w-0 bg-slate-100/60 px-2 py-2.5">
            <span className="block text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-700">
              Orçamento
            </span>
          </div>
          {visibleCompanies.map((company) => {
            const showWhatsApp = hasPaidPlan(company) && Boolean(company.cta_whatsapp_enabled);
            const whatsappHref = company.whatsapp_url || company.whatsapp || company.phone || undefined;

            return (
              <div
                key={`mobile-cta-${company.id}`}
                className={cn('min-w-0 px-1.5 py-2 flex items-center justify-center', company.id === highestRatedCompanyId && 'bg-blue-50/20')}
              >
                {hasPaidPlan(company) ? (
                  showWhatsApp ? (
                    <WhatsappButton
                      href={whatsappHref}
                      companyId={company.id}
                      label="WhatsApp"
                      className="h-8 rounded-md px-2 text-xs font-bold leading-tight"
                    />
                  ) : (
                    <QuoteCTA context="comparison" shortLabel="Orçamento" onRequest={() => onQuote(company.id)} />
                  )
                ) : (
                  <span className="block px-1 py-1.5 text-center text-xs font-medium text-slate-400">Indisponível</span>
                )}
              </div>
            );
          })}
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
  const router = useRouter();

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

      companies.forEach((company) => {
        sendIntentSignal({
          company_id: company.id,
          signal_type: companies.length >= COMPARISON_LIMITS.desktop ? 'comparison_third_added' : 'comparison_view',
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

  const desktopVisibleCompanies = companies.slice(0, COMPARISON_LIMITS.desktop);

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName="bg-slate-950/40 backdrop-blur-xs"
        className="!bottom-auto !left-1/2 !top-1/2 grid !max-h-[90dvh] !w-[calc(100vw-20px)] !max-w-[440px] !-translate-x-1/2 !-translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl transition-all duration-300 md:!max-h-[85vh] md:!w-[calc(100vw-64px)] md:!max-w-[1024px] md:rounded-xl"
      >
        {/* Header Modal */}
        <DialogHeader className="sticky top-0 z-40 space-y-0 border-b border-blue-900/10 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-3 py-3 md:px-6 md:py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white" aria-hidden="true">
                ⇄
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-white md:text-lg">
                  Comparar empresas
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-blue-100">
                  <span className="md:hidden">
                    {Math.min(companies.length, COMPARISON_LIMITS.mobile)} de {COMPARISON_LIMITS.mobile} empresas no celular
                  </span>
                  <span className="hidden md:inline">
                    {Math.min(companies.length, COMPARISON_LIMITS.desktop)} de {COMPARISON_LIMITS.desktop} empresas selecionadas
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Ações Desktop do Header */}
            <div className="hidden items-center gap-2 md:flex">
              {desktopVisibleCompanies.map((comp) => {
                const logoUrl = comp.logo_url ? getFullImageUrl(comp.logo_url) : null;
                return (
                  <div
                    key={comp.id}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-2 text-xs font-semibold text-white backdrop-blur-xs"
                  >
                    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white">
                      {logoUrl ? (
                        <Image src={logoUrl} alt="" fill className="object-contain p-0.5" sizes="20px" />
                      ) : (
                        <Building2 className="m-auto h-3 w-3 text-slate-400" />
                      )}
                    </div>
                    <span className="max-w-[110px] truncate">{comp.name}</span>
                    <button
                      onClick={() => onRemoveCompany(comp.id)}
                      className="ml-0.5 rounded-full p-0.5 text-blue-200 transition-colors hover:bg-white/20 hover:text-white"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {companies.length < COMPARISON_LIMITS.desktop && (
                <button
                  onClick={() => {
                    onClose();
                    router.push('/search?tab=companies');
                  }}
                  className="flex h-8 items-center gap-1 rounded-full border border-dashed border-white/40 bg-white/10 px-3 text-xs font-medium text-white transition-all hover:bg-white/20"
                  title="Adicionar mais empresas"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              )}

              {companies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="h-8 rounded-lg bg-white/10 px-2.5 text-xs font-semibold text-blue-100 transition-all hover:bg-red-500/20 hover:text-red-200"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Minimizar comparação"
                className="h-8 w-8 rounded-lg border border-white/20 p-0 text-white hover:bg-white/15"
                title="Minimizar"
              >
                <span aria-hidden="true" className="text-base font-bold leading-none">−</span>
              </Button>
            </div>

            {/* Ações Mobile do Header */}
            <div className="flex items-center gap-1.5 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Minimizar comparação"
                className="h-8 w-8 rounded-lg border border-white/20 p-0 text-white hover:bg-white/15"
                title="Minimizar"
              >
                <span aria-hidden="true" className="text-base font-bold leading-none">−</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Fechar modal de comparação"
                className="h-8 w-8 rounded-lg border border-white/20 p-0 text-white hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Desktop View: Grid de 3 empresas */}
        <div className="hidden min-h-0 overflow-y-auto md:block p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex w-full flex-col divide-y divide-slate-100">
              {/* Header Row Desktop */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-slate-50/80">
                <div className="flex flex-col justify-end p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Critérios
                  </span>
                </div>

                {desktopVisibleCompanies.map((company) => {
                  const isHighlighted = company.id === highestRatedCompanyId;
                  const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                  const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);

                  return (
                    <div
                      key={company.id}
                      className={cn(
                        'relative flex flex-col justify-between bg-white p-4',
                        isHighlighted && 'bg-blue-50/20'
                      )}
                    >
                      {isHighlighted && (
                        <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                          Melhor avaliada
                        </div>
                      )}

                      <button
                        onClick={() => onRemoveCompany(company.id)}
                        aria-label={`Remover ${company.name} da comparação`}
                        className="absolute left-3 top-3 rounded-full bg-slate-100 p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Remover"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <div className="mt-6 flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                          {logoUrl ? (
                            <Image src={logoUrl} alt="" fill sizes="64px" className="object-contain p-1" />
                          ) : (
                            <Building2 className="m-auto h-6 w-6 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-600 block">
                            <h4 className="line-clamp-1 text-sm font-bold text-slate-900">
                              {company.name}
                            </h4>
                          </Link>
                          <span className="block truncate text-xs text-slate-500">
                            {[company.city, company.state].filter(Boolean).join(', ') || 'Localização não informada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Slots vazios Desktop */}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-desk-${i}`} className="flex flex-col items-center justify-center bg-slate-50/40 p-6 text-center">
                    <span className="text-xs font-semibold text-slate-400">Slot Livre</span>
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/search?tab=companies');
                      }}
                      className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar empresa
                    </button>
                  </div>
                ))}
              </div>

              {/* Linha 1: Reputação */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Reputação</span>
                  <span className="text-xs text-slate-400">Avaliação de clientes</span>
                </div>
                {desktopVisibleCompanies.map((company) => {
                  const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                  const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
                  return (
                    <div key={`rep-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-extrabold text-slate-950">{rating.toFixed(1)}</span>
                            <div className="flex text-amber-400" aria-hidden="true">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn('h-3.5 w-3.5', s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {reviews > 0 ? `${reviews} avaliações` : 'Sem avaliações'}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Sem avaliações</span>
                      )}
                    </div>
                  );
                })}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-rep-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 2: Certificações */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Certificação</span>
                  <span className="text-xs text-slate-400">Status de auditoria</span>
                </div>
                {desktopVisibleCompanies.map((company) => (
                  <div key={`ver-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-bold', company.verified ? 'text-emerald-700' : 'text-slate-600')}>
                        {company.verified ? 'Verificada' : company.verification_status === 'pending' ? 'Em análise' : 'Não verificada'}
                      </span>
                      {company.verified && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5">
                      {company.verified ? 'Dados auditados' : 'Documentação em análise'}
                    </span>
                  </div>
                ))}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-ver-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 3: SLA */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">SLA de Contato</span>
                  <span className="text-xs text-slate-400">Tempo de resposta</span>
                </div>
                {desktopVisibleCompanies.map((company) => {
                  const speed = getSpeedBadge(company.response_time_sla);
                  return (
                    <div key={`sla-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                      <span className="text-xs font-bold text-slate-900">{company.response_time_sla || 'Sob consulta'}</span>
                      {speed && (
                        <span className={cn('mt-1 w-fit rounded border px-1.5 py-0.5 text-xs font-bold', speed.color)}>
                          {speed.label}
                        </span>
                      )}
                    </div>
                  );
                })}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-sla-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 4: Abrangência */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Abrangência</span>
                  <span className="text-xs text-slate-400">Região de atendimento</span>
                </div>
                {desktopVisibleCompanies.map((company) => (
                  <div key={`cov-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-900">
                      {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">{getCoverageLabel(company)}</span>
                  </div>
                ))}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-cov-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 5: Volume de Projetos */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Volume</span>
                  <span className="text-xs text-slate-400">Projetos entregues</span>
                </div>
                {desktopVisibleCompanies.map((company) => {
                  const count = company.delivered_projects_count ?? company.delivered_projects_score ?? 0;
                  return (
                    <div key={`vol-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                      <span className="text-xs font-bold text-slate-900">{count > 0 ? `+${count} projetos` : 'Consultar'}</span>
                    </div>
                  );
                })}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-vol-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 6: Garantia */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-white">
                <div className="p-4 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Garantia</span>
                  <span className="text-xs text-slate-400">Pós-instalação</span>
                </div>
                {desktopVisibleCompanies.map((company) => {
                  const years = company.warranty_years ?? company.installation_warranty_years ?? 0;
                  return (
                    <div key={`gar-desk-${company.id}`} className="p-4 flex flex-col justify-center">
                      <span className="text-xs font-bold text-slate-900">{years > 0 ? `${years} anos` : 'Consultar'}</span>
                    </div>
                  );
                })}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-gar-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>

              {/* Linha 7: Orçamento CTA */}
              <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-slate-50/50">
                <div className="p-4 flex items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Orçamento</span>
                </div>
                {desktopVisibleCompanies.map((company) => (
                  <div key={`cta-desk-${company.id}`} className="p-4">
                    {hasPaidPlan(company) ? (
                      <Button
                        className="h-10 w-full rounded-lg bg-orange-600 text-xs font-bold text-white hover:bg-orange-700 shadow-xs"
                        onClick={() => handleQuoteClick(company.id)}
                      >
                        Solicitar Orçamento
                      </Button>
                    ) : (
                      <span className="block text-center text-xs font-medium text-slate-400 py-2">Indisponível</span>
                    )}
                  </div>
                ))}
                {Array.from({ length: COMPARISON_LIMITS.desktop - desktopVisibleCompanies.length }).map((_, i) => (
                  <div key={`empty-cta-${i}`} className="p-4 bg-slate-50/20" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <MobileComparisonContent
          companies={companies}
          highestRatedCompanyId={highestRatedCompanyId}
          onRemoveCompany={onRemoveCompany}
          onAddCompany={() => {
            onClose();
            router.push('/search?tab=companies');
          }}
          onQuote={handleQuoteClick}
        />

        {/* Footer Mobile */}
        <div className="sticky bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden">
          <Button
            variant="outline"
            disabled={companies.length >= COMPARISON_LIMITS.mobile}
            className="h-10 rounded-lg border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => {
              onClose();
              router.push('/search?tab=companies');
            }}
          >
            + Adicionar empresa
          </Button>
          <Button
            className="h-10 rounded-lg bg-blue-700 px-2 text-xs font-bold text-white hover:bg-blue-800"
            onClick={() => {
              track('comparison_modal_compare_confirm', { companies_count: companies.length });
              onClose();
              router.push('/compare');
            }}
          >
            Ver comparação completa →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

