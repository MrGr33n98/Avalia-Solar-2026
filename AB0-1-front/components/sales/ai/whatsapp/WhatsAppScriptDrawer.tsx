'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import AIClaimWarnings from '../writing/AIClaimWarnings';
import { createAiGeneration, submitAiGenerationFeedback } from '@/lib/api/sales/ai';
import type { CrmAiGenerationResponse } from '@/lib/api/sales/aiTypes';

interface WhatsAppScriptDrawerProps {
  contactId?: number | null;
  accountId?: number | null;
  opportunityId?: number | null;
  quoteId?: number | null;
  contactName?: string;
  phone?: string;
  trigger?: React.ReactNode;
  onActivityLogged?: () => void;
}

export default function WhatsAppScriptDrawer({
  contactId,
  accountId,
  opportunityId,
  quoteId,
  contactName = 'Contato',
  phone = '',
  trigger,
  onActivityLogged,
}: WhatsAppScriptDrawerProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<'followup' | 'direto' | 'consultivo' | 'executivo'>('followup');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [generation, setGeneration] = useState<CrmAiGenerationResponse | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const handleGenerate = async (selectedTone = tone) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createAiGeneration({
        feature: 'whatsapp_followup',
        action: 'generate_script',
        instructions: instructions.trim() || undefined,
        context: {
          contact_id: contactId || null,
          account_id: accountId || null,
          opportunity_id: opportunityId || null,
          quote_id: quoteId || null,
        },
        options: {
          tone: selectedTone,
          length: 'short',
          language: 'pt-BR',
        },
      });

      setGeneration(response);
      const text = response.result?.message_text || response.result?.body_text || '';
      setCurrentMessage(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar script de WhatsApp.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentMessage) return;
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = async () => {
    if (!currentMessage) return;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(currentMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (generation?.id) {
      void submitAiGenerationFeedback(generation.id, { decision: 'accepted' });
    }

    // Registrar atividade automaticamente se accountId estiver presente
    if (accountId) {
      try {
        await fetch(`/api/v1/sales/accounts/${accountId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            activity: {
              activity_type: 'whatsapp',
              subject: 'WhatsApp Comercial — Script IA',
              body: `Mensagem enviada para ${contactName} (${phone}):\n"${currentMessage}"`,
              sales_contact_id: contactId || null,
              sales_opportunity_id: opportunityId || null,
            },
          }),
        });
        onActivityLogged?.();
      } catch {
        // Registro em background não bloqueia abertura do WhatsApp
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Script IA WhatsApp
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white border-l border-slate-200 p-6 flex flex-col gap-4 overflow-y-auto">
        <SheetHeader className="text-left border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-700 text-white border-0 text-[11px] font-mono">
              CRM-AI • WhatsApp
            </Badge>
            {phone && (
              <span className="text-[11px] font-mono text-slate-500">
                +{fullPhone}
              </span>
            )}
          </div>
          <SheetTitle className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Copiloto WhatsApp Comercial
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Mensagens ultra-curtas com pergunta aberta baseadas no histórico de {contactName}.
          </SheetDescription>
        </SheetHeader>

        {/* Seleção de Tom / Objetivo */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">Tom da Abordagem</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'followup', label: 'Follow-up' },
              { id: 'direto', label: 'Direto' },
              { id: 'consultivo', label: 'Consultivo' },
              { id: 'executivo', label: 'Executivo' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const newTone = t.id as typeof tone;
                  setTone(newTone);
                  if (currentMessage) void handleGenerate(newTone);
                }}
                className={`py-1.5 text-[11px] font-medium rounded-md border text-center transition-all ${
                  tone === t.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instruções Adicionais (opcional) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">Instrução Adicional (Opcional)</label>
          <Input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: Citar que a tabela de preços atualiza na sexta..."
            className="h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Botão de Disparo da Geração */}
        <Button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="w-full h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5 shadow-2xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando Script no OpenRouter...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> {currentMessage ? 'Regenerar Script' : 'Gerar Script Personalizado'}
            </>
          )}
        </Button>

        {/* Tratamento de Erro */}
        {error && (
          <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Área de Visualização e Edição */}
        {currentMessage && (
          <div className="space-y-3 pt-2 border-t border-slate-100 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Mensagem Sugerida (Edite se desejar)</span>
                {generation?.usage && (
                  <span className="font-mono text-[10px] text-slate-400">
                    {generation.usage.latency_ms}ms • ~US$ {generation.usage.estimated_cost_usd}
                  </span>
                )}
              </div>

              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                rows={4}
                className="text-xs font-sans p-3 bg-emerald-50/30 border-emerald-200 focus-visible:ring-emerald-500 rounded-lg resize-none"
              />

              {/* Claim Warnings se houver */}
              {generation?.warnings && generation.warnings.length > 0 && (
                <AIClaimWarnings warnings={generation.warnings} missingFields={generation.missing_fields} />
              )}

              {/* Variações alternativas sugeridas */}
              {generation?.result?.variations && generation.result.variations.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">Outras Variações Disponíveis:</span>
                  <div className="space-y-1">
                    {generation.result.variations.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentMessage(v)}
                        className="w-full text-left p-2 rounded-md bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 text-[11px] text-slate-700 transition"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ações Finais: Copiar & Abrir no WhatsApp */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 h-9 text-xs font-semibold gap-1.5 border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenWhatsApp}
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                Abrir no WhatsApp
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

