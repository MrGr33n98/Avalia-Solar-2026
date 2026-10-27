'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  TrendingUp,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiPipeline } from '@/lib/api/sales/types';

interface StageDraft {
  name: string;
  probability: number;
  terminal_type?: 'won' | 'lost' | null;
}

const PRESET_ONBOARDING_STAGES: StageDraft[] = [
  { name: 'Boas-vindas & Kickoff', probability: 15, terminal_type: null },
  { name: 'Coleta de Documentos & Fatura', probability: 35, terminal_type: null },
  { name: 'Engenharia & Homologação', probability: 60, terminal_type: null },
  { name: 'Instalação / Configuração', probability: 80, terminal_type: null },
  { name: 'Treinamento & Go-Live', probability: 95, terminal_type: null },
  { name: 'Onboarding Concluído', probability: 100, terminal_type: 'won' },
  { name: 'Cancelado / Desistência', probability: 0, terminal_type: 'lost' },
];

const PRESET_SALES_STAGES: StageDraft[] = [
  { name: 'Prospecção (Prospect)', probability: 10, terminal_type: null },
  { name: 'Contato Inicial', probability: 20, terminal_type: null },
  { name: 'Qualificação (BANT)', probability: 35, terminal_type: null },
  { name: 'Apresentação & Proposta', probability: 65, terminal_type: null },
  { name: 'Negociação / Fechamento', probability: 85, terminal_type: null },
  { name: 'Fechado Ganho (Won)', probability: 100, terminal_type: 'won' },
  { name: 'Fechado Perdido (Lost)', probability: 0, terminal_type: 'lost' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (pipeline: ApiPipeline) => void;
}

export default function CreatePipelineModal({ open, onClose, onSuccess }: Props) {
  const [pipelineType, setPipelineType] = useState<'onboarding' | 'sales' | 'custom'>('onboarding');
  const [name, setName] = useState('Onboarding de Clientes');
  const [stages, setStages] = useState<StageDraft[]>(PRESET_ONBOARDING_STAGES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (type: 'onboarding' | 'sales' | 'custom') => {
    setPipelineType(type);
    setError(null);
    if (type === 'onboarding') {
      setName('Onboarding de Clientes');
      setStages(PRESET_ONBOARDING_STAGES);
    } else if (type === 'sales') {
      setName('Novo Pipeline de Vendas');
      setStages(PRESET_SALES_STAGES);
    } else {
      setName('Funil Customizado');
      setStages([
        { name: 'Etapa 1', probability: 20, terminal_type: null },
        { name: 'Etapa 2', probability: 60, terminal_type: null },
        { name: 'Finalizado com Sucesso', probability: 100, terminal_type: 'won' },
        { name: 'Perdido / Cancelado', probability: 0, terminal_type: 'lost' },
      ]);
    }
  };

  const handleStageChange = <K extends keyof StageDraft>(
    index: number,
    field: K,
    value: StageDraft[K]
  ) => {
    setStages((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addStage = () => {
    setStages((current) => [
      ...current,
      { name: `Nova Etapa ${current.length + 1}`, probability: 50, terminal_type: null },
    ]);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 2) {
      setError('O pipeline deve conter pelo menos 2 etapas.');
      return;
    }
    setStages((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do pipeline.');
      return;
    }
    if (stages.some((s) => !s.name.trim())) {
      setError('Todas as etapas devem ter um nome.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await salesApi.createPipeline({
        name: name.trim(),
        key: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        stages: stages.map((s, idx) => ({
          name: s.name.trim(),
          key: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          position: idx + 1,
          probability: Number(s.probability) || 0,
          terminal_type: s.terminal_type || null,
        })),
      });

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar pipeline.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto font-sans p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Criar Novo Funil / Pipeline
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Configure um novo fluxo de trabalho no CRM. Você pode criar um pipeline de Vendas Comerciais ou de Onboarding/Pós-venda para clientes fechados.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Presets */}
          <div>
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Escolha um Modelo
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => selectPreset('onboarding')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  pipelineType === 'onboarding'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Rocket className={`h-4 w-4 ${pipelineType === 'onboarding' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-800 font-bold">Recomendado</Badge>
                </div>
                <div className="font-bold text-xs text-slate-900">Onboarding Solar</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Kickoff, homologação e instalação</div>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('sales')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  pipelineType === 'sales'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <TrendingUp className={`h-4 w-4 ${pipelineType === 'sales' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="text-[10px] text-slate-400">Comercial</span>
                </div>
                <div className="font-bold text-xs text-slate-900">Vendas B2B</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Prospecção, proposta e negociação</div>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('custom')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  pipelineType === 'custom'
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Sliders className={`h-4 w-4 ${pipelineType === 'custom' ? 'text-slate-800' : 'text-slate-500'}`} />
                  <span className="text-[10px] text-slate-400">Livre</span>
                </div>
                <div className="font-bold text-xs text-slate-900">Personalizado</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Crie suas próprias etapas</div>
              </button>
            </div>
          </div>

          {/* Nome do Pipeline */}
          <div>
            <Label htmlFor="pipeline-name" className="text-xs font-bold text-slate-700">
              Nome do Pipeline
            </Label>
            <Input
              id="pipeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Onboarding de Clientes, Vendas Corporativas..."
              className="mt-1.5 text-xs h-9 bg-white"
              required
            />
          </div>

          {/* Etapas do Funil */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Etapas do Funil ({stages.length})
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addStage}
                className="h-7 text-xs gap-1 text-indigo-700 hover:text-indigo-900 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs"
                >
                  <span className="w-5 text-center font-bold text-slate-400">{idx + 1}</span>
                  <Input
                    value={stage.name}
                    onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                    placeholder="Nome da etapa"
                    className="h-8 text-xs bg-white flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">Prob:</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={stage.probability}
                      onChange={(e) => handleStageChange(idx, 'probability', Number(e.target.value) || 0)}
                      className="h-8 w-14 text-xs text-center bg-white"
                    />
                    <span className="text-[11px] text-slate-400">%</span>
                  </div>

                  <select
                    value={stage.terminal_type || ''}
                    onChange={(e) =>
                      handleStageChange(
                        idx,
                        'terminal_type',
                        e.target.value === 'won' || e.target.value === 'lost' ? e.target.value : null
                      )
                    }
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
                    aria-label={`Tipo de fechamento da etapa ${stage.name}`}
                  >
                    <option value="">Em andamento</option>
                    <option value="won">Ganho / Concluído</option>
                    <option value="lost">Perdido / Cancelado</option>
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStage(idx)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                    aria-label="Remover etapa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 bg-indigo-900 hover:bg-indigo-950 font-bold text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Criando Funil...' : 'Criar Pipeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
