'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Loader2,
  MessageCircle,
  RotateCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createAiGeneration } from '@/lib/api/sales/ai';
import type { CrmAiGenerationResponse } from '@/lib/api/sales/aiTypes';
import WhatsAppScriptDrawer from '../whatsapp/WhatsAppScriptDrawer';
import CallLoggerModal from '@/components/sales/CallLoggerModal';

interface DailyFunnelDigestCardProps {
  queueData: {
    overdue?: Array<{ id: number; title: string; account_id?: number; account_name?: string; contact_id?: number; contact_name?: string }>;
    today?: Array<{ id: number; title: string; account_id?: number; account_name?: string; contact_id?: number; contact_name?: string }>;
    no_next_action?: Array<{ id: number; name: string; account_id?: number; account_name?: string; value_cents?: number; primary_contact_name?: string }>;
    stale?: Array<{ id: number; name: string; account_id?: number; account_name?: string; value_cents?: number; last_activity_at?: string; primary_contact_name?: string }>;
  } | null;
  onRefreshQueue?: () => void;
}

export default function DailyFunnelDigestCard({
  queueData,
  onRefreshQueue,
}: DailyFunnelDigestCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<CrmAiGenerationResponse | null>(null);

  const overdueCount = queueData?.overdue?.length || 0;
  const noActionCount = queueData?.no_next_action?.length || 0;
  const staleCount = queueData?.stale?.length || 0;
  const todayCount = queueData?.today?.length || 0;

  const handleGenerateDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryPayload = {
        overdue_samples: (queueData?.overdue || []).slice(0, 3),
        stale_samples: (queueData?.stale || []).slice(0, 3),
        no_action_samples: (queueData?.no_next_action || []).slice(0, 3),
        counts: {
          overdue: overdueCount,
          no_action: noActionCount,
          stale: staleCount,
          today_tasks: todayCount,
        },
      };

      const response = await createAiGeneration({
        feature: 'daily_digest',
        action: 'generate_morning_digest',
        instructions: `Analise as oportunidades da fila de hoje e priorize exatamente os 3 negócios com maior risco de perda ou maior probabilidade de avanço imediato. Forneça ação clara com o canal ideal (whatsapp, call ou email). Dados da fila:\n${JSON.stringify(
          summaryPayload
        )}`,
        options: {
          tone: 'direto',
          length: 'short',
          language: 'pt-BR',
        },
      });

      setGeneration(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar digest do funil.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const priorities = generation?.result?.priorities || [];

  return (
    <Card className="border-slate-300 bg-gradient-to-r from-slate-900 to-slate-950 text-white shadow-md overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-slate-950 font-bold border-0 text-[10px] uppercase tracking-wider font-mono">
              CRM-AI • Briefing Matinal
            </Badge>
            {generation?.usage && (
              <span className="text-[10px] font-mono text-slate-400">
                {generation.resolved_model} • {generation.usage.latency_ms}ms
              </span>
            )}
          </div>
          <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Priorização Inteligente do Funil Solo
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => void handleGenerateDigest()}
            disabled={loading}
            className="h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando Fila...
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" /> {generation ? 'Atualizar Briefing' : 'Gerar Briefing Matinal IA'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Estado Inicial sem Geração */}
        {!generation && !loading && !error && (
          <div className="py-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Você tem {overdueCount + staleCount + noActionCount} negócios necessitando de atenção hoje.
              </p>
              <p className="text-xs text-slate-400">
                Clique no botão acima para a IA sintetizar os 3 negócios com maior prioridade e sugerir a abordagem exata do dia.
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2.5 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-700/60 rounded w-full" />
                <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                <div className="h-7 bg-slate-700/60 rounded w-full mt-3" />
              </div>
            ))}
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-950/40 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleGenerateDigest()}
              className="h-7 text-xs border-red-500/40 text-red-200 hover:bg-red-900/50"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Conteúdo Gerado pela IA */}
        {generation && !loading && (
          <div className="space-y-4">
            {/* Headline & Dica Rápida */}
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
              <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {generation.result?.headline || 'Foco Comercial Recomendado:'}
              </p>
              {generation.result?.quick_tip && (
                <p className="text-slate-300 text-[11px] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="italic">{generation.result.quick_tip}</span>
                </p>
              )}
            </div>

            {/* Grid dos 3 Negócios Prioritários (IBM Carbon Density) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {priorities.map((item, idx) => {
                const isHigh = item.urgency === 'high';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`text-[9px] font-mono uppercase tracking-wider border-0 ${
                            isHigh
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isHigh ? 'Urgência Alta' : 'Prioridade'}
                        </Badge>
                        {item.channel && (
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Canal: {item.channel}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </h4>
                      {item.contact_name && (
                        <p className="text-xs text-slate-300 font-medium truncate">
                          Decisor: {item.contact_name}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                        {item.reason}
                      </p>
                    </div>

                    {/* Ação Rápida Conectada */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-amber-300 font-medium truncate">
                        {item.suggested_action}
                      </span>

                      {item.channel === 'whatsapp' ? (
                        <WhatsAppScriptDrawer
                          opportunityId={item.opportunity_id}
                          contactName={item.contact_name || undefined}
                          onActivityLogged={onRefreshQueue}
                          trigger={
                            <Button
                              size="sm"
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-1 shrink-0"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </Button>
                          }
                        />
                      ) : item.channel === 'call' ? (
                        <CallLoggerModal
                          contactName={item.contact_name || undefined}
                          onSuccess={onRefreshQueue}
                        />
                      ) : (
                        <Link href={`/dashboard/sales/pipeline`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 shrink-0 gap-1"
                          >
                            Abrir <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

