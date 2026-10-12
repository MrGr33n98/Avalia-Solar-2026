'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, X, Building2, Plus } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { canUsePaidConversion, type FeatureAccessMap } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';
import { getCoverageLabel } from '@/lib/company/coverage-label';
import { COMPARISON_LIMITS } from '@/lib/comparison/config';
import type { CompanyComparisonProfile } from '@/lib/api';

export interface ComparisonCompany {
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
  feature_access?: FeatureAccessMap;
  cta_whatsapp_enabled?: boolean | null;
  whatsapp?: string | null;
  whatsapp_url?: string | null;
  phone?: string | null;
  comparison_profile?: CompanyComparisonProfile;
  quote_turnaround?: string | null;
  technical_visit?: string | null;
  financing_availability?: string | null;
  financing_enabled?: boolean;
  installation_terms?: string | null;
  maintenance_availability?: string | null;
  after_sales_support?: string | null;
  post_sales_support?: boolean | null;
  installation_team?: string | null;
  system_monitoring?: string | null;
  services_offered?: string[] | string | null;
  services?: string[];
  warranty_confirmed?: boolean | null;
  payment_methods?: string[] | string | null;
}

interface CompanyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: ComparisonCompany[];
  onRemoveCompany: (id: number) => void;
  onClearAll: () => void;
}

type BadgeVariant = 'green' | 'orange' | 'blue' | 'red' | 'gray';

function ComparisonBadge({ text, variant }: { text: string; variant: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange: 'bg-amber-50 text-amber-800 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-tight min-h-[22px] max-w-full text-center',
        styles[variant]
      )}
    >
      {text}
    </span>
  );
}

interface CriterionConfig {
  id: string;
  label: string;
  render: (company: ComparisonCompany, onQuote: (id: number) => void) => React.ReactNode;
}

const CRITERIA_ROWS: CriterionConfig[] = [
  // 1. Avaliações
  {
    id: 'ratings',
    label: 'Avaliações',
    render: (company) => {
      const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
      const reviews = Number(
        company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0
      );
      if (rating <= 0 && reviews <= 0) {
        return <span className="text-[11px] text-slate-400 font-medium">— Sem avaliações</span>;
      }
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-900">
              {rating.toFixed(1).replace('.', ',')}
            </span>
            <span className="text-[10px] text-amber-500 tracking-tighter" aria-hidden="true">
              ★★★★★
            </span>
            <span className="text-[10px] text-slate-500 font-medium">({reviews})</span>
          </div>
        </div>
      );
    },
  },

  // 2. Verificação
  {
    id: 'verification',
    label: 'Verificação',
    render: (company) => {
      if (company.verified) {
        return <ComparisonBadge text="✓ Verificada" variant="green" />;
      }
      if (company.verification_status === 'pending') {
        return <ComparisonBadge text="Em análise" variant="orange" />;
      }
      return <ComparisonBadge text="Não verificada" variant="gray" />;
    },
  },

  // 3. Região atendida
  {
    id: 'region',
    label: 'Região atendida',
    render: (company) => {
      const cityState = [company.city, company.state].filter(Boolean).join(', ');
      const coverage = getCoverageLabel(company);
      if (!cityState && coverage === 'Área de atendimento não informada') {
        return <span className="text-[11px] text-slate-400 font-medium">Não informado</span>;
      }
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold text-slate-900 leading-tight">
            {cityState || 'Consultar'}
          </span>
          {coverage && coverage !== 'Área de atendimento não informada' && (
            <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{coverage}</span>
          )}
        </div>
      );
    },
  },

  // 4. Prazo do orçamento
  {
    id: 'quote_turnaround',
    label: 'Prazo do orçamento',
    render: (company) => {
      const val =
        company.comparison_profile?.quote_turnaround ||
        company.quote_turnaround ||
        company.response_time_sla;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'within_24h' || lower.includes('24h') || lower.includes('24 h')) {
        return <ComparisonBadge text="Até 24h" variant="green" />;
      }
      if (lower === 'within_3_days' || lower.includes('3 dias') || lower.includes('72h')) {
        return <ComparisonBadge text="Até 3 dias" variant="orange" />;
      }
      if (lower === 'consult' || lower.includes('consult')) {
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      return <ComparisonBadge text={val} variant="orange" />;
    },
  },

  // 5. Visita técnica
  {
    id: 'technical_visit',
    label: 'Visita técnica',
    render: (company) => {
      const val = company.comparison_profile?.technical_visit || company.technical_visit;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'free' || lower.includes('gratuita') || lower.includes('gratis')) {
        return <ComparisonBadge text="Gratuita" variant="green" />;
      }
      if (lower === 'paid' || lower.includes('paga')) {
        return <ComparisonBadge text="Paga" variant="orange" />;
      }
      if (lower === 'consult' || lower.includes('consult')) {
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      if (lower === 'not_offered' || lower.includes('não oferece')) {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 6. Formas de pagamento
  {
    id: 'payment_methods',
    label: 'Formas de pagamento',
    render: (company) => {
      const raw = company.comparison_profile?.payment_methods || company.payment_methods;
      const list = Array.isArray(raw) ? raw : raw ? String(raw).split(',') : [];
      if (list.length === 0) {
        return <span className="text-[11px] text-slate-400 font-medium">Não informado</span>;
      }
      const labels = list.map((item) => {
        const k = item.trim().toLowerCase();
        if (k === 'pix') return 'Pix';
        if (k === 'credit_card' || k === 'cartao' || k.includes('cart')) return 'cartão';
        if (k === 'bank_slip' || k === 'boleto') return 'boleto';
        if (k === 'debit_card' || k === 'debito') return 'débito';
        return k;
      });
      return (
        <span className="text-[11px] font-medium text-slate-800 text-center leading-snug">
          {labels.join(', ')}
        </span>
      );
    },
  },

  // 7. Financiamento
  {
    id: 'financing',
    label: 'Financiamento',
    render: (company) => {
      const val =
        company.comparison_profile?.financing_availability ||
        company.financing_availability ||
        (company.financing_enabled ? 'available' : null);
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'available' || lower === 'true' || lower.includes('dispon')) {
        return <ComparisonBadge text="Disponível" variant="green" />;
      }
      if (lower === 'consult' || lower.includes('consult')) {
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      if (lower === 'not_offered' || lower === 'false' || lower.includes('não oferece')) {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 8. Instalação
  {
    id: 'installation',
    label: 'Instalação',
    render: (company) => {
      const val = company.comparison_profile?.installation_terms || company.installation_terms;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'included' || lower.includes('inclusa')) {
        return <ComparisonBadge text="Inclusa" variant="green" />;
      }
      if (lower === 'separately_contracted' || lower.includes('parte')) {
        return <ComparisonBadge text="Contratada à parte" variant="orange" />;
      }
      if (lower === 'not_offered' || lower.includes('não oferece')) {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 9. Manutenção
  {
    id: 'maintenance',
    label: 'Manutenção',
    render: (company) => {
      const val =
        company.comparison_profile?.maintenance_availability || company.maintenance_availability;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'offered' || lower.includes('oferece')) {
        return <ComparisonBadge text="Oferece" variant="green" />;
      }
      if (lower === 'consult' || lower.includes('consult')) {
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      if (lower === 'not_offered' || lower.includes('não oferece')) {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 10. Pós-venda
  {
    id: 'after_sales',
    label: 'Pós-venda',
    render: (company) => {
      const val =
        company.comparison_profile?.after_sales_support ||
        company.after_sales_support ||
        (company.post_sales_support ? 'offered' : null);
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'offered' || lower.includes('oferece') || lower === 'true') {
        return <ComparisonBadge text="Oferece suporte" variant="green" />;
      }
      if (lower === 'consult' || lower.includes('consult')) {
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      if (lower === 'not_offered' || lower.includes('não oferece') || lower === 'false') {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 11. Equipe de instalação
  {
    id: 'installation_team',
    label: 'Equipe de instalação',
    render: (company) => {
      const val = company.comparison_profile?.installation_team || company.installation_team;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'in_house' || lower.includes('própria') || lower.includes('propria')) {
        return <ComparisonBadge text="Própria" variant="green" />;
      }
      if (lower === 'outsourced' || lower.includes('terceir')) {
        return <ComparisonBadge text="Terceirizada" variant="orange" />;
      }
      if (lower === 'mixed' || lower.includes('mista')) {
        return <ComparisonBadge text="Mista" variant="blue" />;
      }
      if (lower === 'not_applicable') {
        return <ComparisonBadge text="Não se aplica" variant="gray" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 12. Acompanhamento do sistema
  {
    id: 'system_monitoring',
    label: 'Acompanhamento do sistema',
    render: (company) => {
      const val = company.comparison_profile?.system_monitoring || company.system_monitoring;
      if (!val) return <ComparisonBadge text="Não informado" variant="gray" />;
      const lower = val.toLowerCase();
      if (lower === 'app' || lower.includes('aplicativo')) {
        return <ComparisonBadge text="Pelo aplicativo" variant="green" />;
      }
      if (lower === 'web_portal' || lower.includes('portal') || lower.includes('web')) {
        return <ComparisonBadge text="Portal web" variant="blue" />;
      }
      if (lower === 'manual' || lower.includes('manual')) {
        return <ComparisonBadge text="Manual" variant="orange" />;
      }
      if (lower === 'not_offered' || lower.includes('não oferece')) {
        return <ComparisonBadge text="Não oferece" variant="red" />;
      }
      return <ComparisonBadge text={val} variant="blue" />;
    },
  },

  // 13. Serviços oferecidos
  {
    id: 'services_offered',
    label: 'Serviços oferecidos',
    render: (company) => {
      const raw =
        company.comparison_profile?.services_offered ||
        company.services_offered ||
        company.services;
      const list = Array.isArray(raw) ? raw : raw ? String(raw).split(',') : [];
      if (list.length === 0) {
        return <span className="text-[11px] text-slate-400 font-medium">Não informado</span>;
      }
      const labels = list.map((item) => {
        const k = item.trim().toLowerCase();
        if (k === 'project' || k === 'projeto') return 'Projeto';
        if (k === 'installation' || k === 'instalacao') return 'instalação';
        if (k === 'maintenance' || k === 'manutencao') return 'manutenção';
        if (k === 'o&m' || k === 'om') return 'O&M';
        if (k === 'homologation' || k === 'homologacao') return 'homologação';
        return k;
      });
      return (
        <span className="text-[11px] font-medium text-slate-800 text-center leading-snug">
          {labels.join(', ')}
        </span>
      );
    },
  },

  // 14. Garantia
  {
    id: 'warranty',
    label: 'Garantia',
    render: (company) => {
      const profile = company.comparison_profile;
      const confirmed =
        profile?.warranty_confirmed === true || company.warranty_confirmed === true;
      const years =
        profile?.warranty_years ??
        company.warranty_years ??
        (confirmed ? company.installation_warranty_years : null);
      if (!years || years <= 0) {
        return <span className="text-[11px] text-slate-400 font-medium">Consultar</span>;
      }
      return (
        <span className="text-[11px] font-bold text-slate-900">
          {years} {years === 1 ? 'ano' : 'anos'}
        </span>
      );
    },
  },

  // 15. Solicitar orçamento (Linha Final de CTA)
  {
    id: 'quote_cta',
    label: 'Solicitar orçamento',
    render: (company, onQuote) => {
      const eligible = canUsePaidConversion(company, 'quote');
      if (!eligible) {
        return <span className="text-slate-400 font-bold text-center">—</span>;
      }
      return (
        <Button
          size="sm"
          onClick={() => onQuote(company.id)}
          className="h-8 w-full max-w-[120px] rounded-lg bg-blue-600 px-2 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700"
        >
          Solicitar
        </Button>
      );
    },
  },
];

export function CompanyComparisonModal({
  isOpen,
  onClose,
  companies,
  onRemoveCompany,
  onClearAll,
}: CompanyComparisonModalProps) {
  const router = useRouter();

  const handleQuoteClick = (companyId: number) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company || !canUsePaidConversion(company, 'quote')) return;

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

  const mobileCompanies = useMemo(
    () => companies.slice(0, COMPARISON_LIMITS.mobile),
    [companies]
  );
  const desktopCompanies = useMemo(
    () => companies.slice(0, COMPARISON_LIMITS.desktop),
    [companies]
  );

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseButton={true}
        overlayClassName="bg-slate-950/40 backdrop-blur-xs"
        className="!bottom-auto !left-1/2 !top-1/2 grid !max-h-[min(90dvh,820px)] !w-[calc(100vw-16px)] !max-w-[440px] !-translate-x-1/2 !-translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white p-0 shadow-2xl transition-all duration-300 md:!max-h-[min(85vh,820px)] md:!w-[calc(100vw-64px)] md:!max-w-[1024px]"
      >
        {/* Cabeçalho do Modal: Azul Royal Degradê */}
        <DialogHeader className="sticky top-0 z-30 space-y-0 border-b border-blue-900/10 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 px-3.5 py-2.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-left min-w-0">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white font-bold"
                aria-hidden="true"
              >
                ⇄
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-white leading-tight">
                  Comparar empresas
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[11px] text-blue-100/90 leading-tight">
                  <span className="md:hidden">
                    {Math.min(companies.length, COMPARISON_LIMITS.mobile)} de{' '}
                    {COMPARISON_LIMITS.mobile} empresas no celular
                  </span>
                  <span className="hidden md:inline">
                    {Math.min(companies.length, COMPARISON_LIMITS.desktop)} de{' '}
                    {COMPARISON_LIMITS.desktop} empresas selecionadas
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Ações no cabeçalho com alvo de toque acessível (min 44px) */}
            <div className="flex items-center gap-1 shrink-0">
              {companies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="hidden md:inline-flex h-8 rounded-lg bg-white/10 px-2.5 text-xs font-semibold text-blue-100 transition-all hover:bg-red-500/20 hover:text-red-200"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}

              {/* Botão Minimizar (−) */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Minimizar comparação"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                title="Minimizar"
              >
                <span className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-base font-bold leading-none">
                  −
                </span>
              </button>

              {/* Botão Fechar (✕) */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal de comparação"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                title="Fechar"
              >
                <span className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* ═══════════════════════════════════════════════════════════════════════
            CORPO DO MODAL — MOBILE (Grid de 3 Colunas: 1 Rótulo + 2 Empresas)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="block md:hidden min-h-0 overflow-y-auto px-2 py-1.5">
          {/* Header Fixo das Empresas (Grid 3 colunas) */}
          <div className="sticky top-0 z-20 bg-white pb-1.5">
            <div className="grid grid-cols-[minmax(96px,31%)_repeat(2,minmax(0,1fr))] gap-1.5">
              {/* Coluna 1: Rótulo "Empresas" */}
              <div className="rounded-lg bg-slate-100/90 p-1.5 flex items-center justify-center min-h-[52px]">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Empresas
                </span>
              </div>

              {/* Coluna 2 e 3: Cartões das Empresas */}
              {[0, 1].map((index) => {
                const company = mobileCompanies[index];
                if (!company) {
                  return (
                    <button
                      key={`empty-mobile-slot-${index}`}
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/search?tab=companies');
                      }}
                      className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-1.5 flex flex-col items-center justify-center gap-1 min-h-[52px] hover:bg-slate-100 transition-colors"
                      title="Adicionar empresa para comparar"
                    >
                      <Plus className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        + Adicionar
                      </span>
                    </button>
                  );
                }

                const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                return (
                  <div
                    key={`mobile-comp-header-${company.id}`}
                    className="relative rounded-lg border border-slate-200 bg-white p-1.5 flex items-center gap-1.5 min-h-[52px] shadow-xs"
                  >
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-slate-100 bg-white">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <Building2 className="m-auto h-4 w-4 text-slate-300" />
                      )}
                    </div>
                    <Link
                      href={`/companies/${company.slug || company.id}`}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <span className="block text-[11px] font-bold text-slate-900 truncate leading-tight">
                        {company.name}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemoveCompany(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="shrink-0 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela dos 14 Critérios + Linha Final de CTA */}
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            {CRITERIA_ROWS.map((row) => (
              <div
                key={`mobile-row-${row.id}`}
                className={cn(
                  'grid grid-cols-[minmax(96px,31%)_repeat(2,minmax(0,1fr))] divide-x divide-slate-100 items-stretch',
                  row.id === 'quote_cta' ? 'bg-slate-50/80' : 'bg-white'
                )}
              >
                {/* Coluna de Rótulo (Texto puro, normal sentence case, sem ícones) */}
                <div className="p-1.5 bg-slate-50/70 flex items-center justify-start text-[11px] font-semibold text-slate-700 leading-tight">
                  {row.label}
                </div>

                {/* Coluna Empresa 1 e Empresa 2 */}
                {[0, 1].map((index) => {
                  const company = mobileCompanies[index];
                  if (!company) {
                    return (
                      <div
                        key={`mobile-empty-cell-${row.id}-${index}`}
                        className="p-1.5 flex items-center justify-center text-[11px] text-slate-300"
                      >
                        —
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`mobile-data-cell-${row.id}-${company.id}`}
                      className="p-1.5 flex items-center justify-center text-center text-[11px] leading-snug"
                    >
                      {row.render(company, handleQuoteClick)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            CORPO DO MODAL — DESKTOP (Grid de 4 Colunas: 1 Rótulo + 3 Empresas)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block min-h-0 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            {/* Header das Empresas Desktop */}
            <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-slate-50/80 border-b border-slate-200">
              <div className="flex items-center p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Critérios
                </span>
              </div>
              {[0, 1, 2].map((index) => {
                const company = desktopCompanies[index];
                if (!company) {
                  return (
                    <div
                      key={`desktop-empty-header-${index}`}
                      className="p-3 flex items-center justify-center"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push('/search?tab=companies');
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar empresa
                      </button>
                    </div>
                  );
                }

                const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                return (
                  <div
                    key={`desktop-comp-header-${company.id}`}
                    className="relative p-3 flex items-center justify-between gap-2 bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-contain"
                          />
                        ) : (
                          <Building2 className="m-auto h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <Link
                        href={`/companies/${company.slug || company.id}`}
                        className="min-w-0 flex-1 hover:underline"
                      >
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {company.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate">
                          {[company.city, company.state].filter(Boolean).join(', ')}
                        </span>
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveCompany(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="shrink-0 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tabela Desktop: Mesmos 14 Critérios + Linha Final de CTA */}
            <div className="divide-y divide-slate-100">
              {CRITERIA_ROWS.map((row) => (
                <div
                  key={`desktop-row-${row.id}`}
                  className={cn(
                    'grid grid-cols-[160px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 items-stretch',
                    row.id === 'quote_cta' ? 'bg-slate-50/80' : 'bg-white'
                  )}
                >
                  <div className="p-3 bg-slate-50/70 flex items-center text-xs font-semibold text-slate-700">
                    {row.label}
                  </div>
                  {[0, 1, 2].map((index) => {
                    const company = desktopCompanies[index];
                    if (!company) {
                      return (
                        <div
                          key={`desktop-empty-cell-${row.id}-${index}`}
                          className="p-3 flex items-center justify-center text-xs text-slate-300"
                        >
                          —
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`desktop-data-cell-${row.id}-${company.id}`}
                        className="p-3 flex items-center justify-center text-center text-xs"
                      >
                        {row.render(company, handleQuoteClick)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RODAPÉ DO MODAL (Mobile e Desktop)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="sticky bottom-0 z-30 bg-white border-t border-slate-100 p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={companies.length >= COMPARISON_LIMITS.desktop}
            className="min-h-[44px] flex-1 rounded-xl border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => {
              onClose();
              router.push('/search?tab=companies');
            }}
          >
            + Adicionar empresa
          </Button>

          <Button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs"
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

export default CompanyComparisonModal;
