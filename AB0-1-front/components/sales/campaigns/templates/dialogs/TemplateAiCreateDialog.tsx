'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { createAiGeneration } from '@/lib/api/sales/ai';
import type { EmailTemplate } from '../types';

interface TemplateAiCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateGenerated: (template: Partial<EmailTemplate>) => void;
}

export function TemplateAiCreateDialog({
  isOpen,
  onClose,
  onTemplateGenerated,
}: TemplateAiCreateDialogProps) {
  const [briefing, setBriefing] = useState('');
  const [category, setCategory] = useState('Prospecção');
  const [tone, setTone] = useState<'consultivo' | 'direto' | 'executivo' | 'followup'>('consultivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefing.trim()) {
      setError('Descreva o objetivo ou público do template de e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createAiGeneration({
        feature: 'template_create',
        action: 'create_template',
        instructions: `Criar template de e-mail estruturado na categoria ${category}. Briefing: ${briefing.trim()}`,
        options: {
          tone,
          language: 'pt-BR',
        },
      });

      const res = response.result;
      const generatedTemplate: Partial<EmailTemplate> = {
        name: res.name || `Template IA — ${briefing.slice(0, 30)}`,
        category: res.category || category,
        subject_template: res.subject_template || res.subject || 'Proposta Comercial — {{company.name}}',
        preheader: res.preheader || '',
        status: 'draft',
        shared: true,
        schema_version: 1,
        body_json: res.body_json
          ? { version: 1, blocks: res.body_json.blocks }
          : {
              version: 1,
              blocks: [
                {
                  id: 'blk_1',
                  type: 'heading',
                  props: { text: res.subject || 'Avaliação Energética Solar', level: 2 },
                },
                {
                  id: 'blk_2',
                  type: 'text',
                  props: {
                    text: res.body_text || 'Olá {{person.first_name}},\n\nPreparamos um diagnóstico preliminar para {{company.name}}.',
                    html: res.body_html || '<p>Olá {{person.first_name}},</p><p>Preparamos um diagnóstico preliminar para {{company.name}}.</p>',
                  },
                },
                {
                  id: 'blk_3',
                  type: 'button',
                  props: { label: 'Conferir diagnóstico', url: 'https://avaliasolar.com.br', align: 'left' },
                },
              ],
            },
        body_html: res.body_html,
      };

      onTemplateGenerated(generatedTemplate);
      onClose();
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : null) ||
          'Falha ao gerar template com OpenRouter. Verifique a conectividade em Settings AI Models.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-lg bg-background rounded-xl shadow-2xl border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Criar Template com IA (OpenRouter)
              </h3>
              <p className="text-xs text-muted-foreground">
                Gera blocos estruturados, variáveis canônicas e assunto compatíveis com o editor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Briefing / Objetivo do Template *
            </label>
            <Textarea
              rows={3}
              placeholder="Ex: Abordagem para indústrias e galpões comerciais interessados em geração própria solar, focando em redução de custo sem investimento inicial..."
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              className="text-xs resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full text-xs h-9 px-3 border border-input rounded-md bg-background"
              >
                <option value="Prospecção">Prospecção</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Proposta">Proposta Comercial</option>
                <option value="Reativação">Reativação de Leads</option>
                <option value="Onboarding">Onboarding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Tom de Voz</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as 'consultivo' | 'direto' | 'executivo' | 'followup')}
                disabled={loading}
                className="w-full text-xs h-9 px-3 border border-input rounded-md bg-background"
              >
                <option value="consultivo">Consultivo & Técnico</option>
                <option value="direto">Direto & Objetivo</option>
                <option value="executivo">Executivo (C-Level)</option>
                <option value="followup">Follow-up Cordial</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Regras de Segurança Comercial:</p>
            <p>• O template gerado será aberto no editor como <strong>rascunho (draft)</strong>.</p>
            <p>• Nenhuma mutação ou disparo é executado sem sua revisão e salvamento.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !briefing.trim()}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Gerando Estrutura...' : 'Gerar Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

