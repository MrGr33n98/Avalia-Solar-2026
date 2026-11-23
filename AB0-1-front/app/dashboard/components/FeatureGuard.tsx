'use client';

import type { ReactNode } from 'react';
import {
  Lock,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Target,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeatureAccessEntry } from '@/lib/api';
import { isFeatureEnabledEntry, isFeatureHiddenEntry } from '@/lib/feature-access';
import { cn } from '@/lib/utils';

export interface FeatureBenefit {
  title: string;
  description: string;
  icon?: 'trending' | 'shield' | 'sparkles' | 'target' | 'users' | 'zap';
}

export interface FeatureGuardProps {
  entry?: FeatureAccessEntry | null;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  featureId?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  // Propriedades inspiradas na engenharia reversa do G2 (High-Conversion Gated Screen)
  targetPlanName?: string;
  targetPlanSlug?: 'free' | 'essential' | 'pro' | 'enterprise';
  benefits?: FeatureBenefit[];
  currentPlanTier?: string;
  onUpgrade?: () => void;
}

const DEFAULT_BENEFITS: Record<string, FeatureBenefit[]> = {
  analytics: [
    {
      title: 'Métricas em Tempo Real',
      description: 'Acompanhe visualizações de perfil, taxas de clique e conversões da sua página.',
      icon: 'trending',
    },
    {
      title: 'Inteligência de Tráfego',
      description: 'Descubra a origem geográfica e perfil dos compradores que pesquisam sua marca.',
      icon: 'target',
    },
    {
      title: 'Relatórios Executivos',
      description: 'Exporte relatórios consolidados para reuniões de diretoria e estratégias de vendas.',
      icon: 'sparkles',
    },
  ],
  leads: [
    {
      title: 'Distribuição Prioritária',
      description: 'Receba solicitações diretas de orçamentos residenciais e comerciais no seu raio.',
      icon: 'users',
    },
    {
      title: 'Notificações Instantâneas',
      description: 'Alertas imediatos via WhatsApp e e-mail no instante em que o cliente solicita.',
      icon: 'zap',
    },
    {
      title: 'Exclusividade Regional',
      description: 'Prioridade no marketplace da sua região sem concorrência direta de leilão.',
      icon: 'shield',
    },
  ],
  integrations: [
    {
      title: 'Webhooks em Tempo Real',
      description: 'Envie leads instantaneamente para o seu CRM (HubSpot, RD Station, Pipedrive).',
      icon: 'zap',
    },
    {
      title: 'Tokens de API Rest/GraphQL',
      description: 'Conecte seus sistemas internos e automações com chaves de acesso seguras.',
      icon: 'shield',
    },
    {
      title: 'Automação sem Código',
      description: 'Integre com n8n, Zapier e fluxos automatizados de pós-venda e qualificação.',
      icon: 'sparkles',
    },
  ],
  'product-banner': [
    {
      title: 'Destaque no Topo da Busca',
      description: 'Posicione sua marca em destaque acima de concorrentes na sua região de atendimento.',
      icon: 'trending',
    },
    {
      title: 'Maior Visibilidade Regional',
      description: 'Destaque visual verificado nas categorias solares pesquisadas por compradores.',
      icon: 'target',
    },
    {
      title: 'Mídia e Ofertas Personalizadas',
      description: 'Veicule campanhas com diferenciais técnicos e condições especiais de instalação.',
      icon: 'sparkles',
    },
  ],
  'live-inbox': [
    {
      title: 'Atendimento Ágil',
      description: 'Aborde o cliente interessado enquanto ele consulta simuladores e opções solares.',
      icon: 'zap',
    },
    {
      title: 'Acompanhamento Estruturado',
      description: 'Atendimento oportuno com histórico de mensagens e dados de contato organizados.',
      icon: 'trending',
    },
    {
      title: 'Gestão Centralizada',
      description: 'Histórico unificado de conversas, arquivos e propostas em um só lugar.',
      icon: 'shield',
    },
  ],
  generic: [
    {
      title: 'Atraia Compradores Qualificados',
      description: 'Destaque sua reputação com avaliações verificadas e selos auditados pelo setor.',
      icon: 'sparkles',
    },
    {
      title: 'Acelere seu Funil Comercial',
      description: 'Acesse sinais em tempo real sobre clientes pesquisando energia solar na sua região.',
      icon: 'trending',
    },
    {
      title: 'Autoridade & Credibilidade',
      description: 'Feche mais contratos transmitindo segurança técnica comprovada no mercado.',
      icon: 'shield',
    },
  ],
};

function BenefitIcon({ icon }: { icon?: string }) {
  const iconClass = "h-4 w-4 text-[hsl(var(--dashboard-accent))]";
  switch (icon) {
    case 'trending':
      return <TrendingUp className={iconClass} />;
    case 'target':
      return <Target className={iconClass} />;
    case 'users':
      return <Users className={iconClass} />;
    case 'zap':
      return <Zap className={iconClass} />;
    case 'shield':
      return <ShieldCheck className={iconClass} />;
    case 'sparkles':
    default:
      return <Sparkles className={iconClass} />;
  }
}

function LockedPreview() {
  return (
    <div aria-hidden="true" className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
      </div>
      <div className="h-56 rounded-3xl bg-[hsl(var(--dashboard-surface))]" />
    </div>
  );
}

export default function FeatureGuard({
  entry,
  title,
  description,
  children,
  className,
  featureId,
  loading,
  error,
  onRetry,
  targetPlanName,
  targetPlanSlug,
  benefits,
  currentPlanTier,
  onUpgrade,
}: FeatureGuardProps) {
  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse p-6 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10">
        <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-[350px] rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-56 rounded-3xl bg-slate-200 dark:bg-white/10 mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10 text-center min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Erro ao carregar permissões</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Não foi possível verificar os recursos do seu plano. Se o problema continuar, atualize a página.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (isFeatureHiddenEntry(entry)) return null;
  if (entry && isFeatureEnabledEntry(entry)) return <>{children}</>;

  // Determinar lista de benefícios para o modelo educacional inspirado no my.G2
  const activeBenefits =
    benefits && benefits.length > 0
      ? benefits
      : (featureId && DEFAULT_BENEFITS[featureId]) || DEFAULT_BENEFITS.generic;

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/pricing';
    }
  };

  const planLabel = targetPlanName || (targetPlanSlug ? `Plano ${targetPlanSlug.toUpperCase()}` : 'Plano Pro');
  const ctaText = targetPlanName ? `Desbloquear com ${targetPlanName}` : 'Fazer Upgrade Agora';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/20',
        className
      )}
    >
      {/* Blurred Background Content */}
      <div className="pointer-events-none select-none blur-[6px] opacity-35 transition-all duration-300">
        <LockedPreview />
      </div>

      {/* Overlaid Educational Paywall Container */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 bg-slate-900/20 dark:bg-black/30 backdrop-blur-[2px] overflow-y-auto">
        <Card className="max-w-2xl w-full border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#00223D] text-slate-900 dark:text-white shadow-xl rounded-2xl my-auto">
          <CardContent className="flex flex-col gap-5 p-6 sm:p-7">
            {/* Header: Badge de Plano Alvo + Título & Descrição */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs font-medium">
                      {planLabel}
                    </Badge>
                    {currentPlanTier && (
                      <span className="text-xs text-muted-foreground">
                        (Atual: {currentPlanTier})
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">
                    {title}
                  </h3>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Recurso Pro</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed -mt-1">
              {description}
            </p>

            {/* Grade de 3 Colunas de Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 transition-colors hover:border-slate-300 dark:hover:border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 shadow-xs">
                      <BenefitIcon icon={benefit.icon} />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {benefit.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-white/60 leading-normal">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Linha Divisória */}
            <div className="h-px w-full bg-slate-100 dark:bg-white/10" />

            {/* Rodapé: Upsell Copy + CTA Direcionado ao Plano */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-white/70">
                {entry?.upsell_copy || `Disponível mediante adesão ao ${planLabel}.`}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={handleUpgradeClick}
                  className="w-full sm:w-auto h-10 px-5 rounded-lg bg-[hsl(var(--dashboard-accent))] hover:brightness-110 text-white font-medium text-sm shadow-xs transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
