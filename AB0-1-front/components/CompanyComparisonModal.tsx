'use client';

import { useMemo, useState } from 'react';
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
import { X, Building2, Plus, FileText } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { canUsePaidConversion, type FeatureAccessMap } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';
import { getCoverageLabel } from '@/lib/company/coverage-label';
import { COMPARISON_LIMITS } from '@/lib/comparison/config';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
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

function ComparisonBadge({
  text,
  variant,
  className,
}: {
  text: string;
  variant: BadgeVariant;
  className?: string;
}) {
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    orange: 'bg-amber-50 text-amber-800 border-amber-200/90',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/90',
    red: 'bg-rose-50 text-rose-700 border-rose-200/90',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold leading-tight text-center !min-h-[19px] !h-auto !min-w-0 max-w-full',
        styles[variant],
        className
      )}
    >
      {text}
    </span>
  );
}

function parseServices(company: ComparisonCompany): string[] {
  const raw =
    company.comparison_profile?.services_offered ||
    company.services_offered ||
    company.services;
  const list = Array.isArray(raw) ? raw : raw ? String(raw).split(',') : [];
  return list
    .map((item) => {
      const k = item.trim();
      const lower = k.toLowerCase();
      if (lower === 'project' || lower === 'projeto') return 'Projeto';
      if (lower === 'installation' || lower === 'instalacao' || lower === 'instalação') return 'instalação';
      if (lower === 'maintenance' || lower === 'manutencao' || lower === 'manutenção') return 'manutenção';
      if (lower === 'o&m' || lower === 'om') return 'O&M';
      if (lower === 'homologation' || lower === 'homologacao' || lower === 'homologação') return 'homologação';
      return k;
    })
    .filter(Boolean);
}

interface CriterionConfig {
  id: string;
  label: string;
  render: (
    company: ComparisonCompany,
    onQuote: (id: number) => void,
    onOpenServices: (company: ComparisonCompany) => void
  ) => React.ReactNode;
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
        return <span className="text-[10px] text-slate-400 font-medium">— Sem avaliações</span>;
      }
      return (
        <div className="flex items-center justify-center gap-1 text-center">
          <span className="text-[10.5px] font-bold text-slate-900 leading-none">
            {rating.toFixed(1).replace('.', ',')}
          </span>
          <span className="text-[9px] text-amber-500 tracking-tighter" aria-hidden="true">
            ★★★★★
          </span>
          <span className="text-[9px] text-slate-500 font-medium">({reviews})</span>
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
        return (
          <div className="flex justify-center">
            <CompanyVerifiedBadge />
          </div>
        );
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
      if (!cityState && (!coverage || coverage === 'Área de atendimento não informada')) {
        return <span className="text-[10px] text-slate-400 font-medium">Não informado</span>;
      }
      return (
        <div className="flex flex-col items-center justify-center text-center leading-tight">
          <span className="text-[10.5px] font-bold text-slate-900 truncate max-w-full">
            {cityState || 'Consultar'}
          </span>
          {coverage && coverage !== 'Área de atendimento não informada' ? (
            <span className="text-[9px] text-slate-500 mt-0.5 truncate max-w-full">{coverage}</span>
          ) : (
            <span className="text-[9px] text-slate-400 mt-0.5">Não informado</span>
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
        return <span className="text-[10px] text-slate-400 font-medium">Não informado</span>;
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
        <span className="text-[10px] font-medium text-slate-800 text-center leading-tight">
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

  // 13. Serviços oferecidos (RC-03: Preview compacto 1-2 itens + disclosure acessível)
  {
    id: 'services_offered',
    label: 'Serviços oferecidos',
    render: (company, _onQuote, onOpenServices) => {
      const labels = parseServices(company);
      if (labels.length === 0) {
        return <span className="text-[10px] text-slate-400 font-medium">Não informado</span>;
      }
      if (labels.length <= 2) {
        return (
          <span className="text-[10px] font-medium text-slate-800 text-center leading-tight">
            {labels.join(', ')}
          </span>
        );
      }

      const preview = labels.slice(0, 2).join(', ');
      const extraCount = labels.length - 2;

      return (
        <div className="flex flex-wrap items-center justify-center gap-1 text-center leading-tight">
          <span className="text-[10px] font-medium text-slate-800 leading-tight">
            {preview}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenServices(company);
            }}
            aria-label={`Ver todos os ${labels.length} serviços de ${company.name}`}
            className="inline-flex items-center rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/90 px-1 py-0.5 text-[9px] font-bold leading-none !min-h-0 !min-w-0 transition-colors cursor-pointer"
            title="Ver todos os serviços"
          >
            +{extraCount}
          </button>
        </div>
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
        return <ComparisonBadge text="Consultar" variant="blue" />;
      }
      return (
        <span className="text-[10.5px] font-bold text-slate-900 leading-tight">
          {years} {years === 1 ? 'ano' : 'anos'}
        </span>
      );
    },
  },

  // 15. Solicitar orçamento (Linha Final de CTA — RC-04 & RC-05)
  {
    id: 'quote_cta',
    label: 'Solicitar orçamento',
    render: (company, onQuote) => {
      const eligible = canUsePaidConversion(company, 'quote');
      if (!eligible) {
        return <span className="text-slate-400 font-bold text-center text-sm leading-none">—</span>;
      }
      return (
        <button
          type="button"
          onClick={() => onQuote(company.id)}
          aria-label={`Solicitar orçamento para ${company.name}`}
          className="w-full max-w-[124px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-colors py-1 px-1.5 flex items-center justify-center gap-1 text-[10px] font-bold leading-tight !min-h-[28px] !min-w-0"
        >
          <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-center justify-center leading-[1.05]">
            <span>Solicitar</span>
            <span>orçamento</span>
          </span>
        </button>
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
  const [servicesModalCompany, setServicesModalCompany] = useState<ComparisonCompany | null>(null);

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
    <>
      <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
        <DialogContent
          hideCloseButton={true}
          overlayClassName="bg-slate-950/40 backdrop-blur-xs"
          className="!bottom-auto !left-1/2 !top-1/2 grid !max-h-[min(94dvh,820px)] !w-[calc(100vw-12px)] !max-w-[440px] !-translate-x-1/2 !-translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[18px] border border-slate-200/80 bg-white p-0 shadow-2xl md:!max-h-[min(85vh,820px)] md:!w-[calc(100vw-64px)] md:!max-w-[1024px]"
        >
          {/* Cabeçalho do Modal: Azul Royal Degradê */}
          <DialogHeader className="space-y-0 border-b border-blue-900/10 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 px-3 py-1.5 text-white">
            {/* Drag handle sutil */}
            <div className="w-8 h-1 rounded-full bg-white/35 mx-auto mb-1" aria-hidden="true" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left min-w-0">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white font-bold text-xs"
                  aria-hidden="true"
                >
                  ⇄
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[13.5px] font-bold text-white leading-tight">
                    Comparar empresas
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-[10px] text-blue-100/90 leading-tight">
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

              {/* Ações no cabeçalho com alvos de toque acessíveis de 44px */}
              <div className="flex items-center gap-0.5 shrink-0">
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="hidden md:inline-flex h-7 rounded-lg bg-white/10 px-2 text-[11px] font-semibold text-blue-100 transition-all hover:bg-red-500/20 hover:text-red-200 items-center"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </button>
                )}

                {/* Botão Minimizar (−) */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Minimizar comparação"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                  title="Minimizar"
                >
                  <span className="h-6 w-6 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-sm font-bold leading-none">
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
                  <span className="h-6 w-6 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center">
                    <X className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* ═══════════════════════════════════════════════════════════════════════
              CORPO DO MODAL — MOBILE (Grid de 3 Colunas: 1 Rótulo + 2 Empresas)
              ═══════════════════════════════════════════════════════════════════════ */}
          <div
            data-testid="comparison-modal-content"
            className="block md:hidden min-h-0 overflow-y-auto px-1.5 py-1"
          >
            {/* Header Fixo das Empresas (Grid 3 colunas) */}
            <div className="grid grid-cols-[clamp(88px,29%,104px)_repeat(2,minmax(0,1fr))] gap-1 pb-1">
              {/* Coluna 1: Rótulo "Empresas" */}
              <div className="rounded-lg bg-slate-100/90 p-1 flex flex-col items-center justify-center min-h-[38px]">
                <span className="text-[9.5px] font-bold uppercase text-slate-500 tracking-wider leading-none">
                  Empresas
                </span>
                <span className="text-[8.5px] text-slate-400 mt-0.5 leading-none">
                  selecionadas
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
                      className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-1 flex items-center justify-center gap-1 min-h-[38px] hover:bg-slate-100 transition-colors"
                      title="Adicionar empresa para comparar"
                    >
                      <Plus className="h-3 w-3 text-slate-400" />
                      <span className="text-[9.5px] font-semibold text-slate-600">
                        + Adicionar
                      </span>
                    </button>
                  );
                }

                const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                return (
                  <div
                    key={`mobile-comp-header-${company.id}`}
                    className="relative rounded-lg border border-slate-200 bg-white p-1 flex items-center gap-1 min-h-[38px] shadow-xs overflow-hidden"
                  >
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded border border-slate-100 bg-white">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt=""
                          fill
                          sizes="24px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <Building2 className="m-auto h-3.5 w-3.5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-3">
                      <Link
                        href={`/companies/${company.slug || company.id}`}
                        className="block text-[10.5px] font-bold text-slate-900 leading-[1.15] hover:underline"
                        title={company.name}
                      >
                        <span className="line-clamp-2">{company.name}</span>
                      </Link>
                      <span className="block text-[9px] text-slate-500 leading-none truncate mt-0.5">
                        📍 {[company.city, company.state].filter(Boolean).join(', ') || 'Localização'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCompany(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tabela dos 14 Critérios + Linha Final de CTA */}
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-xs">
              {CRITERIA_ROWS.map((row) => (
                <div
                  key={`mobile-row-${row.id}`}
                  className={cn(
                    'grid grid-cols-[clamp(88px,29%,104px)_repeat(2,minmax(0,1fr))] divide-x divide-slate-100 items-stretch',
                    row.id === 'quote_cta' ? 'bg-slate-50/80 min-h-[32px]' : 'bg-white min-h-[24px]'
                  )}
                >
                  {/* Coluna de Rótulo (Texto puro, normal sentence case, sem ícones) */}
                  <div className="px-1.5 py-0.5 bg-slate-50/70 flex items-center justify-start text-[10px] font-semibold text-slate-700 leading-tight">
                    {row.label}
                  </div>

                  {/* Colunas Empresa 1 e Empresa 2 */}
                  {[0, 1].map((index) => {
                    const company = mobileCompanies[index];
                    if (!company) {
                      return (
                        <div
                          key={`mobile-empty-cell-${row.id}-${index}`}
                          className="px-1.5 py-0.5 flex items-center justify-center text-[10px] text-slate-300"
                        >
                          —
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`mobile-data-cell-${row.id}-${company.id}`}
                        className="px-1 py-0.5 flex items-center justify-center text-center text-[10px] leading-tight overflow-hidden"
                      >
                        {row.render(company, handleQuoteClick, (c) => setServicesModalCompany(c))}
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
          <div className="hidden md:block min-h-0 overflow-y-auto p-2.5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              {/* Header das Empresas Desktop */}
              <div className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 bg-slate-50/80 border-b border-slate-200">
                <div className="flex items-center px-3 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Critérios
                  </span>
                </div>
                {[0, 1, 2].map((index) => {
                  const company = desktopCompanies[index];
                  if (!company) {
                    return (
                      <div
                        key={`desktop-empty-header-${index}`}
                        className="px-2 py-1.5 flex items-center justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push('/search?tab=companies');
                          }}
                          className="flex h-7 items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar empresa
                        </button>
                      </div>
                    );
                  }

                  const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                  return (
                    <div
                      key={`desktop-comp-header-${company.id}`}
                      className="relative px-2.5 py-1.5 flex items-center justify-between gap-2 bg-white"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-contain"
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
                          <span className="block text-[9.5px] text-slate-500 truncate leading-tight">
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
                        <X className="h-3 w-3" />
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
                      'grid grid-cols-[150px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100 items-stretch',
                      row.id === 'quote_cta' ? 'bg-slate-50/80 min-h-[34px]' : 'bg-white min-h-[25px]'
                    )}
                  >
                    <div className="px-3 py-1 bg-slate-50/70 flex items-center text-[10.5px] font-semibold text-slate-700">
                      {row.label}
                    </div>
                    {[0, 1, 2].map((index) => {
                      const company = desktopCompanies[index];
                      if (!company) {
                        return (
                          <div
                            key={`desktop-empty-cell-${row.id}-${index}`}
                            className="px-2 py-1 flex items-center justify-center text-[10.5px] text-slate-300"
                          >
                            —
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`desktop-data-cell-${row.id}-${company.id}`}
                          className="px-2 py-1 flex items-center justify-center text-center text-[10.5px] leading-tight overflow-hidden"
                        >
                          {row.render(company, handleQuoteClick, (c) => setServicesModalCompany(c))}
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
          <div className="bg-white border-t border-slate-100 px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-1.5">
            {/* Botão Adicionar Empresa — Versão Mobile (limite = 2) */}
            <button
              type="button"
              disabled={companies.length >= COMPARISON_LIMITS.mobile}
              onClick={() => {
                onClose();
                router.push('/search?tab=companies');
              }}
              className="md:hidden !min-h-[38px] !min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 transition-colors flex items-center justify-center text-center cursor-pointer disabled:cursor-not-allowed"
            >
              {companies.length >= COMPARISON_LIMITS.mobile ? (
                <span className="leading-tight">Limite atingido ({COMPARISON_LIMITS.mobile}/{COMPARISON_LIMITS.mobile})</span>
              ) : (
                <span className="leading-tight">+ Adicionar empresa</span>
              )}
            </button>

            {/* Botão Adicionar Empresa — Versão Desktop (limite = 3) */}
            <button
              type="button"
              disabled={companies.length >= COMPARISON_LIMITS.desktop}
              onClick={() => {
                onClose();
                router.push('/search?tab=companies');
              }}
              className="hidden md:flex !min-h-[38px] !min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 transition-colors items-center justify-center text-center cursor-pointer disabled:cursor-not-allowed"
            >
              {companies.length >= COMPARISON_LIMITS.desktop ? (
                <span className="leading-tight">Limite atingido ({COMPARISON_LIMITS.desktop}/{COMPARISON_LIMITS.desktop})</span>
              ) : (
                <span className="leading-tight">+ Adicionar empresa</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                track('comparison_modal_compare_confirm', { companies_count: companies.length });
                onClose();
                router.push('/compare');
              }}
              className="!min-h-[38px] !min-w-0 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-[11px] font-bold text-white shadow-xs px-2 py-1 transition-colors flex items-center justify-center gap-1 text-center cursor-pointer"
            >
              <span className="leading-tight">Ver comparação completa</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              OVERLAY DE DISCLOSURE DE SERVIÇOS (Acesso progressivo sem scroll do modal)
              ═══════════════════════════════════════════════════════════════════════ */}
          {servicesModalCompany && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Serviços oferecidos por ${servicesModalCompany.name}`}
              className="absolute inset-0 z-50 flex flex-col bg-white p-3.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-left">
                  <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                    Serviços oferecidos
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {servicesModalCompany.name} ({parseServices(servicesModalCompany).length} serviços)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setServicesModalCompany(null)}
                  aria-label="Fechar lista de serviços"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex-1 overflow-y-auto flex flex-wrap content-start gap-1.5 py-1">
                {parseServices(servicesModalCompany).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10.5px] font-semibold text-slate-800"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setServicesModalCompany(null)}
                  className="h-7 px-3.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CompanyComparisonModal;
