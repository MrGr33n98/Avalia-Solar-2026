'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIClaimWarnings from '../writing/AIClaimWarnings';
import { createAiGeneration, submitAiGenerationFeedback } from '@/lib/api/sales/ai';
import type { CrmAiGenerationResponse } from '@/lib/api/sales/aiTypes';

interface SolarProposalDefenseModalProps {
  opportunityId?: number | null;
  accountId?: number | null;
  contactId?: number | null;
  quoteId?: number | null;
  companyName?: string;
  totalValue?: number;
  systemKwp?: number;
  trigger?: React.ReactNode;
}

export default function SolarProposalDefenseModal({
  opportunityId,
  accountId,
  contactId,
  quoteId,
  companyName = 'Cliente Solar',
  totalValue,
  systemKwp,
  trigger,
}: SolarProposalDefenseModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparativo' | 'defesa' | 'texto'>('comparativo');
  const [generation, setGeneration] = useState<CrmAiGenerationResponse | null>(null);

  const handleGenerateDefense = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await createAiGeneration({
        feature: 'proposal_defense',
        action: 'generate_defense',
        instructions: `Elabore a defesa executiva da proposta comercial para ${companyName}. ${
          totalValue ? `Valor de investimento: R$ ${totalValue.toLocaleString('pt-BR')}.` : ''
        } ${systemKwp ? `Potência do sistema: ${systemKwp} kWp.` : ''} Destaque TIR superior ao CDB, proteção contra reajustes de tarifa da concessionária e garantia de equipamentos Tier 1 contra integradores de fundo de quintal.`,
        context: {
          opportunity_id: opportunityId || null,
          account_id: accountId || null,
          contact_id: contactId || null,
          quote_id: quoteId || null,
        },
        options: {
          tone: 'executivo',
          length: 'detailed',
          language: 'pt-BR',
        },
      });

      setGeneration(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar defesa executiva da proposta.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fullText = generation?.result?.full_defense_text || generation?.result?.body_text || '';

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (generation?.id) {
      void submitAiGenerationFeedback(generation.id, { decision: 'accepted' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-8 font-bold text-xs gap-1.5 border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100/70"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            Defesa de Proposta IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-white border-slate-200 p-6 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-slate-900 text-white border-0 text-[11px] font-mono">
              CRM-AI • Proposal Defense
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {companyName}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Carta de Defesa de Proposta & Quebra de Objeções Solares
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Argumentação executiva blindada: compare o investimento fotovoltaico à renda fixa e defenda sua margem contra concorrentes.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Barra de ação inicial quando ainda não gerou */}
        {!generation && (
          <div className="py-8 text-center space-y-4">
            <div className="p-4 rounded-full bg-amber-50 text-amber-700 w-12 h-12 mx-auto flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Gerar Análise Comparativa com OpenRouter</h3>
              <p className="text-xs text-slate-500">
                A IA analisará a potência do sistema, valor de investimento e tarifa regional para montar o comparativo de TIR e os argumentos contra kits de baixo custo.
              </p>
            </div>
            <Button
              onClick={() => void handleGenerateDefense()}
              disabled={loading}
              className="h-9 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Calculando Argumentação Executiva...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" /> Gerar Defesa de Valor
                </>
              )}
            </Button>
          </div>
        )}

        {/* Exibição do Resultado no Estilo IBM Carbon */}
        {generation && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            {/* Header com métricas principais no estilo tabular */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Comparativo de TIR</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {generation.result?.tir_comparison?.slice(0, 32) || 'Superior ao CDB em 2.4x'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Payback Estimado</span>
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  {generation.result?.payback_years || '3 ~ 4 anos'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Economia em 25 Anos</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {generation.result?.cumulative_savings_25yr?.slice(0, 32) || 'Proteção Tarifária'}
                </span>
              </div>
            </div>

            {/* Claim Warnings se houver */}
            {generation.warnings && generation.warnings.length > 0 && (
              <AIClaimWarnings warnings={generation.warnings} missingFields={generation.missing_fields} />
            )}

            {/* Abas de Navegação */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
              <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="comparativo" className="text-xs font-semibold">
                  TIR & Renda Fixa
                </TabsTrigger>
                <TabsTrigger value="defesa" className="text-xs font-semibold">
                  Contra Concorrentes
                </TabsTrigger>
                <TabsTrigger value="texto" className="text-xs font-semibold">
                  Texto Completo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comparativo" className="space-y-3 pt-3">
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Resumo do Retorno do Investimento
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {generation.result?.executive_summary || generation.result?.summary}
                  </p>
                  {generation.result?.tir_comparison && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md text-xs text-emerald-950 font-medium">
                      {generation.result.tir_comparison}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="defesa" className="space-y-2 pt-3">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Por que nossa solução supera kits baratos de concorrentes:
                  </span>
                  {generation.result?.defense_points?.map((dp, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-800 font-medium leading-relaxed">{dp}</span>
                    </div>
                  ))}
                  {generation.result?.recommended_closing_question && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs mt-3">
                      <span className="font-bold text-amber-900 block mb-1">Pergunta de Fechamento Recomendada:</span>
                      <p className="text-amber-950 font-semibold italic">&ldquo;{generation.result.recommended_closing_question}&rdquo;</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="texto" className="pt-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-sans whitespace-pre-line leading-relaxed text-slate-800 max-h-64 overflow-y-auto">
                  {fullText}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Rodapé com botões de ação rápida */}
        {generation && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              {generation.resolved_model} • {generation.usage.latency_ms}ms
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleGenerateDefense()}
                disabled={loading}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Regenerar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className="h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado para Área de Transferência!' : 'Copiar Defesa Completa'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

