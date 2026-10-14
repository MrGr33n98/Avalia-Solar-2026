'use client';

import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Flame,
  Zap,
  Eye,
  MessageCircle,
  FileText,
  Share2,
  Calendar,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type BuyerIntentAccount,
  type BuyingStage,
  type ActivityLevel,
} from '@/lib/api/buyer-intent';

interface AccountDetailDrawerProps {
  account: BuyerIntentAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDetailDrawer({
  account,
  isOpen,
  onClose,
}: AccountDetailDrawerProps) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Cabeçalho do Drawer */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 font-extrabold text-base text-white shadow-md">
              {account.account_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {account.account_name}
                </h2>
                <span className="text-xl" title={account.intent_level}>
                  {account.thermometer}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>{account.segment || 'Segmento Comercial / Usina'}</span>
                <span>•</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{account.location}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Box de Ação Recomendada & SLA */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Ação Recomendada (G2 Playbook):
              </span>
              <Badge className="bg-amber-500 text-white font-bold">
                SLA: {account.sla_window}
              </Badge>
            </div>
            <p className="mt-2 font-semibold text-sm text-slate-900 dark:text-white">
              {account.recommended_action}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Esta organização tem um Score de Intenção de{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">
                {account.total_score}/100 pts
              </strong>{' '}
              com {Math.round(account.confidence_score * 100)}% de precisão comportamental.
            </p>
          </div>

          {/* Cards de Métricas da Conta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] font-medium text-slate-500">Estágio de Compra</span>
              <div className="mt-1 font-bold text-sm text-slate-900 dark:text-white capitalize">
                {account.buying_stage}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] font-medium text-slate-500">Nível de Atividade</span>
              <div className="mt-1 font-bold text-sm text-emerald-600 dark:text-emerald-400 capitalize">
                {account.activity_level}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] font-medium text-slate-500">Visitantes Únicos</span>
              <div className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
                {account.unique_visitors} pessoas
              </div>
            </div>
          </div>

          {/* Comparadores e Concorrentes */}
          {account.compared_competitors && account.compared_competitors.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Concorrentes Comparados pelo Comprador:
              </h3>
              <div className="flex flex-wrap gap-2">
                {account.compared_competitors.map((comp) => (
                  <Badge
                    key={comp.name}
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    Comparado com {comp.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Detalhada (Detailed Company Activity) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Histórico Granular de Sinais (Activity Timeline):
            </h3>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 dark:border-slate-800">
              {(account.timeline || [
                {
                  id: 'def-1',
                  signal_type: 'profile_view',
                  signal_category: 'research_intent',
                  description: 'Acessou o perfil da empresa no catálogo regional',
                  tracked_at: account.last_interaction_at,
                  intent_weight: 4,
                },
              ]).map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-4 ring-white dark:ring-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {evt.description}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        Peso {evt.intent_weight}/10
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{new Date(evt.tracked_at).toLocaleString('pt-BR')}</span>
                      <span>•</span>
                      <span className="capitalize">{evt.signal_category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações de Fechamento */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
            Fechar
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs shadow-xs"
            onClick={() => {
              window.open(`https://wa.me/?text=Olá, somos da equipe solar! Notamos seu interesse recente em soluções fotovoltaicas.`, '_blank');
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Iniciar Conversa WhatsApp
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 bg-amber-500 text-white hover:bg-amber-600 font-semibold text-xs shadow-xs"
            onClick={() => {
              window.location.href = `/dashboard/proposals?account=${account.id}`;
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Criar Proposta Comercial
          </Button>
        </div>
      </div>
    </div>
  );
}
