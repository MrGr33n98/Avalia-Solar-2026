'use client';

import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, ShieldX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BillingStatusBannerProps {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'enterprise_lead' | string;
  onActionClick?: () => void;
  actionLoading?: boolean;
}

export function BillingStatusBanner({
  status,
  onActionClick,
  actionLoading = false,
}: BillingStatusBannerProps) {
  
  if (!['past_due', 'unpaid', 'canceled'].includes(status)) {
    return null;
  }

  // Define os estilos e mensagens baseado no status da assinatura
  const bannerConfig = {
    past_due: {
      bgCls: 'bg-amber-50 border-amber-200 text-amber-950',
      icon: AlertTriangle,
      iconCls: 'text-amber-600',
      title: 'Aviso de Pagamento Pendente',
      message: 'O pagamento da sua fatura falhou. Para evitar a suspensão da sua vitrine e dos CTAs personalizados, por favor atualize sua forma de pagamento no portal Stripe.',
      btnText: 'Atualizar Cartão',
      btnCls: 'bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-sm shadow-amber-600/10',
    },
    unpaid: {
      bgCls: 'bg-red-50 border-red-200 text-red-950',
      icon: AlertOctagon,
      iconCls: 'text-red-600 animate-pulse',
      title: 'Acesso Limitado por Inadimplência',
      message: 'Suas funcionalidades Pro foram suspensas devido a faturas não pagas. Restabeleça o serviço imediatamente atualizando suas informações financeiras.',
      btnText: 'Regularizar Assinatura',
      btnCls: 'bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm shadow-red-600/10',
    },
    canceled: {
      bgCls: 'bg-slate-50 border-slate-200 text-slate-900',
      icon: ShieldX,
      iconCls: 'text-slate-500',
      title: 'Sua assinatura Pro foi Cancelada',
      message: 'Seu perfil foi rebaixado para o plano Gratuito. Ative novamente o plano Pro para remover concorrentes e retomar o controle da sua vitrine comercial.',
      btnText: 'Reativar Plano Pro',
      btnCls: 'bg-brand-green hover:bg-brand-green/90 text-white border-0 shadow-sm shadow-brand-green/10',
    },
  }[status as 'past_due' | 'unpaid' | 'canceled'];

  if (!bannerConfig) return null;

  const Icon = bannerConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`flex flex-col md:flex-row items-center justify-between gap-5 p-5 md:p-6 rounded-[2rem] border ${bannerConfig.bgCls} shadow-sm max-w-full`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          <Icon className={`h-6 w-6 ${bannerConfig.iconCls}`} />
        </div>
        <div className="space-y-1 text-left">
          <h5 className="font-black text-sm tracking-tight">{bannerConfig.title}</h5>
          <p className="text-xs leading-relaxed opacity-90 max-w-3xl">{bannerConfig.message}</p>
        </div>
      </div>

      {onActionClick && (
        <Button
          onClick={onActionClick}
          disabled={actionLoading}
          size="sm"
          className={`rounded-full h-10 px-5 text-xs font-semibold shrink-0 transition-all ${bannerConfig.btnCls}`}
        >
          {actionLoading ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Processando...
            </span>
          ) : (
            bannerConfig.btnText
          )}
        </Button>
      )}
    </motion.div>
  );
}
