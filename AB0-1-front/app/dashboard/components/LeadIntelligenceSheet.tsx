'use client';

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Zap, 
  Target, 
  Globe, 
  BarChart3, 
  Info, 
  ShieldCheck, 
  Link as LinkIcon,
  Search,
  History,
  MousePointer2,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LeadDossie } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import { useEffect } from 'react';

interface LeadIntelligenceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string | number;
    name: string;
    total_score: number;
    intent_level: string;
    recommended_action?: string;
    sla_window?: string;
    signals_count?: number;
    last_interaction_at?: string;
    technical_profile?: LeadDossie['technical_profile'];
    marketing_data?: LeadDossie['marketing_data'];
    top_signals?: LeadDossie['top_signals'];
  };
}

export default function LeadIntelligenceSheet({ isOpen, onClose, lead }: LeadIntelligenceSheetProps) {
  // PostHog Tracking
  useEffect(() => {
    if (isOpen && lead.id) {
      track('lead_dossier_viewed', {
        lead_id: lead.id,
        intent_level: lead.intent_level,
        total_score: lead.total_score,
        product_vertical: lead.technical_profile?.product_vertical
      });
    }
  }, [isOpen, lead.id, lead.intent_level, lead.total_score, lead.technical_profile?.product_vertical]);

  const translateLevel = (level: string) => {
    const map: Record<string, string> = {
      'cold': 'Frio',
      'warm': 'Morno',
      'hot': 'Quente',
      'boiling': 'Fervendo',
      'immediate': 'Imediato',
      'declared': 'Declarado'
    };
    return map[level.toLowerCase()] || level;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'immediate':
      case 'boiling':
      case 'declared':
        return 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'hot':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'warm':
        return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const translateSignalType = (type: string) => {
    const map: Record<string, string> = {
      'page_view': 'Visualização de Página',
      'click': 'Clique em Elemento',
      'form_start': 'Início de Formulário',
      'file_download': 'Download de Arquivo',
      'cta_click': 'Clique em Chamada de Ação',
      'scroll_depth': 'Rolagem da Página'
    };
    return map[type] || type;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[420px] w-full p-0 overflow-y-auto bg-slate-50 dark:bg-[#0B1120] border-l border-slate-200 dark:border-white/5 no-scrollbar">
        {/* Header - Glassmorphism */}
        <div className="sticky top-0 z-10 w-full p-6 bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center shadow-lg shadow-brand-blue/20 clay-convex">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black uppercase tracking-tighter text-foreground dark:text-white">
                  Dossiê de Inteligência
                </SheetTitle>
                <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-brand-blue/70">
                  Lead A+++ / Perfil de Alta Intenção
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex-1 p-3 rounded-xl clay-precision bg-white dark:bg-slate-900 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Potencial de Compra</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider border",
                    getLevelColor(lead.intent_level)
                  )}>
                    {translateLevel(lead.intent_level)}
                  </span>
                  <p className="text-sm font-black text-foreground dark:text-white">Score: {lead.total_score}</p>
                </div>
              </div>
              <div className="flex-1 p-3 rounded-xl clay-precision bg-white dark:bg-slate-900 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Tempo de Resposta (SLA)</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-brand-blue" />
                  <p className="text-sm font-black text-foreground dark:text-white">{lead.sla_window || 'Imediato'}</p>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-8">
          {/* Ação Recomendada - Claymorphism Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-xl bg-brand-blue text-white shadow-2xl shadow-brand-blue/30 relative overflow-hidden clay-convex border border-white/10"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Estratégia Recomendada</h4>
              </div>
              <p className="text-base font-bold leading-tight mb-4">
                {lead.recommended_action === 'nurture' ? 'Nutrição de Lead: Enviar conteúdos educativos sobre ROI solar.' :
                 lead.recommended_action === 'follow_up' ? 'Acompanhamento: Realizar follow-up consultivo em 48h.' :
                 lead.recommended_action === 'call_today' ? 'Foco Máximo: Realizar contato telefônico ainda hoje.' :
                 lead.recommended_action === 'call_now' ? 'Urgência: Entrar em contato nos próximos 15 minutos.' :
                 lead.recommended_action === 'emergency_contact' ? 'Contato Imediato: Prioridade máxima na fila de vendas.' :
                 lead.recommended_action === 'close_deal' ? 'Fechamento: Enviar proposta final para assinatura.' :
                 lead.recommended_action || "Abordagem técnica consultiva com foco em payback e economia imediata."}
              </p>
              <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold">
                <Info className="h-3.5 w-3.5" />
                <span>Análise baseada em {lead.signals_count || 5} sinais de interação recente.</span>
              </div>
            </div>
            {/* Background design element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
          </motion.div>

          {/* Technical Profile - Grid */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">Perfil Técnico do Projeto</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 transition-all hover:border-brand-blue/20 clay-precision shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Consumo Mensal</p>
                <p className="text-base font-black text-foreground dark:text-white">
                  {lead.technical_profile?.monthly_kwh ? `${lead.technical_profile.monthly_kwh} kWh` : 'Não informado'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 transition-all hover:border-brand-blue/20 clay-precision shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Fatura Média</p>
                <p className="text-base font-black text-foreground dark:text-white">
                  {formatCurrency(lead.technical_profile?.bill_value)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 transition-all hover:border-brand-blue/20 clay-precision shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Porte Sugerido</p>
                <div className="flex items-center gap-2">
                  <ScalingIcon className="h-4 w-4 text-brand-blue/50" />
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    {lead.technical_profile?.system_size || 'Padrão Residencial'}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 transition-all hover:border-brand-blue/20 clay-precision shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Janela de Decisão</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-blue/50" />
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    {lead.technical_profile?.decision_timeline || 'Curto Prazo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 border-none clay-concave">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-green-500/10 text-green-500 shadow-inner">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Qualificação Financeira</p>
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    Investimento estimado:
                    <span className="text-brand-green ml-2 font-black">{lead.technical_profile?.estimated_budget || 'Sob consulta'}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Behavior Signals */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-brand-blue" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">Sinais de Engajamento</h3>
            </div>
            
            <div className="p-4 rounded-xl bg-brand-blue/5 border border-brand-blue/10 clay-concave">
              <div className="space-y-4">
                {lead.top_signals && lead.top_signals.length > 0 ? (
                  lead.top_signals.map((signal, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 transition-transform hover:scale-[1.02]">
                      <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                        {signal.signal_category === 'contact_intent' ? <Zap className="h-4 w-4 text-brand-blue" /> : 
                         signal.signal_category === 'financial_intent' ? <BarChart3 className="h-4 w-4 text-brand-blue" /> :
                         <MousePointer2 className="h-4 w-4 text-brand-blue" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                          {translateSignalType(signal.signal_type)} na página {signal.page_path || 'Principal'}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(signal.tracked_at).toLocaleString('pt-BR')} • Peso: {signal.intent_weight}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Nenhum sinal específico detectado nos últimos 30 dias.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Marketing Data - Origin */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-brand-blue" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">Origem e Atribuição</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 clay-precision shadow-sm">
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Canal de Aquisição</span>
                </div>
                <span className="text-xs font-bold text-brand-blue">{lead.marketing_data?.utm_source || 'Tráfego Direto'}</span>
              </div>
              
              {lead.marketing_data?.utm_campaign && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 clay-precision shadow-sm">
                  <div className="flex items-center gap-3">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Campanha Marketing</span>
                  </div>
                  <span className="text-xs font-bold text-foreground dark:text-white">{lead.marketing_data.utm_campaign}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 clay-precision shadow-sm">
                <div className="flex items-center gap-3">
                  <MousePointer2 className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Caminho</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[150px]">{lead.marketing_data?.landing_path || '/home'}</span>
              </div>
            </div>
          </section>

          {/* CTA Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/5">
            <Button className="w-full h-12 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 clay-convex transition-transform active:scale-95">
              Exportar Dossier PDF
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ScalingIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 3 15 3M21 3 21 9M21 3 13 11" />
      <path d="M3 21 9 21M3 21 3 15M3 21 11 13" />
      <rect width="8" height="8" x="8" y="8" rx="2" />
    </svg>
  );
}
