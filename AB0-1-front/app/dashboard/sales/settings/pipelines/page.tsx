'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Eye,
  Edit3,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ListChecks,
  AlertCircle,
  RotateCw,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreatePipelineModal from '@/components/sales/pipeline/CreatePipelineModal';
import { salesApi } from '@/lib/api/sales/client';
import { ApiPipeline, ApiStage } from '@/lib/api/sales/types';
import {
  getStageChecklist,
  saveStageChecklist,
} from '@/components/sales/pipeline/stageChecklistUtils';

interface EditableStage {
  id?: number;
  name: string;
  key: string;
  position: number;
  probability: number;
  terminal_type: 'won' | 'lost' | null;
  opportunities_count?: number;
  checklist: string[];
}

export default function SalesPipelinesSettingsPage() {
  // Controle de Permissão / Modo Read-Only (como solicitado pelo usuário)
  const [isAdmin, setIsAdmin] = useState(true);

  // Estados de dados
  const [pipelines, setPipelines] = useState<ApiPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [pipelineName, setPipelineName] = useState('');
  const [stages, setStages] = useState<EditableStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<{ index: number; name: string } | null>(null);

  // Carregar Pipelines da API
  const loadPipelines = useCallback(async (selectId?: number) => {
    setLoading(true);
    try {
      const data = await salesApi.getPipelines();
      setPipelines(data);
      if (data.length > 0) {
        const target = selectId
          ? data.find((p) => p.id === selectId) || data[0]
          : data[0];
        setSelectedPipelineId(target.id);
        setPipelineName(target.name);
        setStages(
          target.stages.map((stg) => ({
            id: stg.id,
            name: stg.name,
            key: stg.key,
            position: stg.position,
            probability: stg.probability || 0,
            terminal_type: stg.terminal_type || null,
            opportunities_count: stg.opportunities_count || 0,
            checklist: getStageChecklist(target.key, stg.key),
          }))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar pipelines.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelines();
  }, [loadPipelines]);

  // Ao trocar de Pipeline selecionado
  const handleSelectPipeline = (pipelineId: number) => {
    const target = pipelines.find((p) => p.id === pipelineId);
    if (!target) return;
    setSelectedPipelineId(target.id);
    setPipelineName(target.name);
    setStages(
      target.stages.map((stg) => ({
        id: stg.id,
        name: stg.name,
        key: stg.key,
        position: stg.position,
        probability: stg.probability || 0,
        terminal_type: stg.terminal_type || null,
        opportunities_count: stg.opportunities_count || 0,
        checklist: getStageChecklist(target.key, stg.key),
      }))
    );
  };

  // Alteração de campo de uma etapa
  const handleStageFieldChange = <K extends keyof EditableStage>(
    index: number,
    field: K,
    value: EditableStage[K]
  ) => {
    if (!isAdmin) return;
    setStages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Mover etapa para cima / para baixo
  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    setStages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((stg, idx) => ({ ...stg, position: idx + 1 }));
    });
  };

  // Adicionar nova etapa
  const handleAddStage = () => {
    if (!isAdmin) return;
    const newPosition = stages.length + 1;
    const newName = `Nova Etapa ${newPosition}`;
    const newKey = `etapa_${Date.now()}`;
    const newStage: EditableStage = {
      name: newName,
      key: newKey,
      position: newPosition,
      probability: Math.min(100, Math.round((newPosition / (stages.length + 1)) * 100)),
      terminal_type: null,
      opportunities_count: 0,
      checklist: [
        'Confirmar alinhamento com cliente',
        'Registrar atualizações no histórico',
      ],
    };
    setStages((prev) => [...prev, newStage]);
  };

  // Remover etapa
  const confirmRemoveStage = (index: number) => {
    if (!isAdmin) return;
    const target = stages[index];
    if (stages.length <= 2) {
      toast.error('O pipeline deve conter pelo menos 2 etapas.');
      return;
    }
    if (target.opportunities_count && target.opportunities_count > 0) {
      toast.error(
        `Não é possível remover '${target.name}' pois existem ${target.opportunities_count} oportunidade(s) nesta etapa.`
      );
      return;
    }
    setStageToDelete({ index, name: target.name });
  };

  const handleExecuteDeleteStage = () => {
    if (!stageToDelete) return;
    setStages((prev) =>
      prev
        .filter((_, idx) => idx !== stageToDelete.index)
        .map((stg, idx) => ({ ...stg, position: idx + 1 }))
    );
    setStageToDelete(null);
  };

  // Checklist: Adicionar item
  const handleAddChecklistItem = (stageIndex: number) => {
    if (!isAdmin) return;
    const text = prompt('Informe a diretriz de validação ou tarefa para esta etapa:');
    if (!text || !text.trim()) return;

    setStages((prev) => {
      const copy = [...prev];
      const stage = copy[stageIndex];
      copy[stageIndex] = {
        ...stage,
        checklist: [...stage.checklist, text.trim()],
      };
      return copy;
    });
  };

  // Checklist: Remover item
  const handleRemoveChecklistItem = (stageIndex: number, itemIndex: number) => {
    if (!isAdmin) return;
    setStages((prev) => {
      const copy = [...prev];
      const stage = copy[stageIndex];
      copy[stageIndex] = {
        ...stage,
        checklist: stage.checklist.filter((_, i) => i !== itemIndex),
      };
      return copy;
    });
  };

  // Salvar Alterações
  const handleSave = async () => {
    if (!isAdmin || !selectedPipelineId) return;

    if (!pipelineName.trim()) {
      toast.error('O nome do pipeline não pode ficar vazio.');
      return;
    }

    if (stages.some((s) => !s.name.trim())) {
      toast.error('Todas as etapas devem possuir um nome válido.');
      return;
    }

    setSaving(true);
    try {
      const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
      const pipelineKey = currentPipeline?.key || 'sales';

      // 1. Salvar checklists locais
      stages.forEach((stg) => {
        saveStageChecklist(pipelineKey, stg.key, stg.checklist);
      });

      // 2. Chamar endpoint da API para atualizar pipeline e etapas
      const updated = await salesApi.updatePipeline(selectedPipelineId, {
        name: pipelineName.trim(),
        stages: stages.map((stg, idx) => ({
          id: stg.id,
          name: stg.name.trim(),
          key: stg.key,
          position: idx + 1,
          probability: Number(stg.probability) || 0,
          terminal_type: stg.terminal_type || null,
        })),
      });

      setSaveSuccess(true);
      toast.success('Pipeline e etapas salvos com sucesso!');
      await loadPipelines(updated.id);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar etapas.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Excluir pipeline
  const handleDeletePipeline = async () => {
    if (!isAdmin || !selectedPipelineId) return;
    try {
      await salesApi.deletePipeline(selectedPipelineId);
      toast.success('Pipeline excluído com sucesso!');
      setDeleteConfirmOpen(false);
      await loadPipelines();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir pipeline.';
      toast.error(msg);
    }
  };

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  return (
    <SalesLayoutWrapper>
      <TooltipProvider delayDuration={200}>
        <div className="max-w-[1080px] mx-auto py-2 space-y-5 font-sans text-xs">
          {/* HEADER DA PÁGINA (Alinhado ao padrão Nutshell / IBM Carbon) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Pipelines & Processos de Venda
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure as etapas, probabilidades de conversão e tarefas de validação de cada fase comercial.
                  </p>
                </div>
              </div>
            </div>

            {/* Alternador de Perfil para Homologação / Simulação Read-Only (como solicitado) */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs self-start sm:self-auto">
              <span className="text-[11px] font-medium text-slate-500">Perfil:</span>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                  isAdmin
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" /> Admin
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                  !isAdmin
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> Read-Only
                </span>
              </button>
            </div>
          </div>

          {/* BANNER DE AVISO READ-ONLY */}
          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Somente Leitura:</strong> Você está visualizando este pipeline sem permissão de edição. Apenas administradores podem adicionar, renomear ou remover etapas.
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase tracking-wider font-semibold"
              >
                Read-Only
              </Badge>
            </div>
          )}

          {/* BARRA SUPERIOR DE SELEÇÃO DE PIPELINE */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Funil Selecionado:</span>
              </label>

              <Select
                value={selectedPipelineId ? String(selectedPipelineId) : ''}
                onValueChange={(val) => handleSelectPipeline(Number(val))}
                disabled={loading}
              >
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-300 w-64 font-semibold text-slate-800">
                  <SelectValue placeholder="Selecione um pipeline..." />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name} ({p.stages.length} etapas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPipeline && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">
                    key: {selectedPipeline.key}
                  </span>
                  <span>•</span>
                  <span>
                    {selectedPipeline.opportunities_count || 0} oportunidade(s) ativas
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-8 flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Pipeline...</span>
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled
                        size="sm"
                        className="bg-slate-200 text-slate-400 font-medium text-xs h-8 cursor-not-allowed"
                      >
                        + Novo Pipeline...
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs bg-slate-900 text-white">
                    Criação de novos pipelines desabilitada em modo somente leitura
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* CARD PRINCIPAL DE EDIÇÃO DO PIPELINE E SUAS ETAPAS */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-md border border-slate-200">
              <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
              <span>Carregando configurações do pipeline...</span>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
              {/* Header do Card com Barra Cinza e Botão Save */}
              <div className="bg-[#f5f6f8] px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Configuração de Etapas do Funil
                  </h2>
                  <span className="text-slate-400 text-xs">({stages.length} etapas)</span>
                  {saveSuccess && (
                    <span className="text-emerald-700 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#43a047] hover:bg-[#388e3c] text-white font-medium text-xs h-7 px-4 shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <RotateCw className="w-3 h-3 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <span>Salvar Alterações</span>
                      )}
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            disabled
                            className="bg-slate-200 text-slate-400 font-medium text-xs h-7 px-4 cursor-not-allowed"
                          >
                            Salvar Alterações
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs bg-slate-900 text-white">
                        Edição bloqueada em modo somente leitura
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Informações Básicas do Pipeline */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                  <label className="sm:col-span-3 text-slate-700 font-semibold text-xs">
                    Nome do Pipeline
                  </label>
                  <div className="sm:col-span-9 max-w-md">
                    <Input
                      value={pipelineName}
                      onChange={(e) => setPipelineName(e.target.value)}
                      disabled={!isAdmin}
                      className="h-8 text-xs bg-white border-slate-300 font-medium disabled:bg-slate-100"
                      placeholder="Ex: Avalia Solar B2B Sales"
                    />
                  </div>
                </div>
              </div>

              {/* TABELA / LISTA DE ETAPAS */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-xs">
                      Etapas Sequenciais do Processo Comercial
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      As etapas orientam o fluxo Kanban dos leads e acionam o checklist do processo de venda.
                    </p>
                  </div>

                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={handleAddStage}
                      variant="outline"
                      className="h-7 text-xs border-slate-300 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      <span>Adicionar Etapa</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {stages.map((stage, idx) => (
                    <div
                      key={stage.id || stage.key || idx}
                      className="border border-slate-200 rounded-lg bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                    >
                      {/* Linha Principal da Etapa */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Botões de Ordem */}
                          {isAdmin ? (
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveStage(idx, 'up')}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === stages.length - 1}
                                onClick={() => moveStage(idx, 'down')}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          ) : null}

                          {/* Posição */}
                          <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            #{stage.position}
                          </span>

                          {/* Nome da Etapa */}
                          <div className="flex-1 max-w-sm">
                            <Input
                              value={stage.name}
                              onChange={(e) =>
                                handleStageFieldChange(idx, 'name', e.target.value)
                              }
                              disabled={!isAdmin}
                              className="h-8 text-xs font-semibold bg-white border-slate-300 disabled:bg-slate-50 disabled:text-slate-700"
                              placeholder="Nome da etapa"
                            />
                          </div>
                        </div>

                        {/* Configurações da Etapa: Probabilidade, Tipo de Fechamento e Exclusão */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          {/* Probabilidade */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Probabilidade:
                            </span>
                            <div className="relative flex items-center">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={stage.probability}
                                onChange={(e) =>
                                  handleStageFieldChange(
                                    idx,
                                    'probability',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={!isAdmin}
                                className="h-8 w-16 text-xs text-right pr-5 font-bold disabled:bg-slate-50"
                              />
                              <span className="absolute right-2 text-slate-400 text-xs pointer-events-none">
                                %
                              </span>
                            </div>
                          </div>

                          {/* Terminal Type */}
                          <div className="w-36">
                            <Select
                              value={stage.terminal_type || 'normal'}
                              onValueChange={(val) =>
                                handleStageFieldChange(
                                  idx,
                                  'terminal_type',
                                  val === 'won' || val === 'lost' ? val : null
                                )
                              }
                              disabled={!isAdmin}
                            >
                              <SelectTrigger className="h-8 text-[11px] bg-white border-slate-300 disabled:bg-slate-50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal" className="text-xs">
                                  Padrão (Em aberto)
                                </SelectItem>
                                <SelectItem value="won" className="text-xs text-emerald-700 font-medium">
                                  Fechado Ganho (Won)
                                </SelectItem>
                                <SelectItem value="lost" className="text-xs text-rose-700 font-medium">
                                  Fechado Perdido (Lost)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Oportunidades vinculadas */}
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 text-[10px] font-normal"
                          >
                            {stage.opportunities_count || 0} leads
                          </Badge>

                          {/* Botão de Excluir Etapa */}
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => confirmRemoveStage(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                              title="Remover esta etapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="text-slate-300 p-1.5 cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SUBSEÇÃO: CHECKLIST & DIRETRIZES DO PROCESSO DE VENDA (o "onde já tem checkbox") */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-3 space-y-2 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              Checklist de Validação Comercial desta Etapa ({stage.checklist.length} itens)
                            </span>
                          </span>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleAddChecklistItem(idx)}
                              className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Tarefa ao Checklist</span>
                            </button>
                          )}
                        </div>

                        {stage.checklist.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Nenhuma tarefa de validação configurada. Adicione tarefas para que apareçam na oportunidade no CRM.
                          </p>
                        ) : (
                          <div className="space-y-1.5 pt-1">
                            {stage.checklist.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200/70 text-[11px] text-slate-800"
                              >
                                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    defaultChecked={false}
                                    disabled
                                    className="accent-sky-600 h-3.5 w-3.5 rounded border-slate-300"
                                  />
                                  <span className="font-medium truncate">{item}</span>
                                </label>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChecklistItem(idx, itemIdx)}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 ml-2"
                                    title="Remover tarefa"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RODAPÉ DO CARD COM AÇÕES ADICIONAIS */}
              <div className="bg-[#f5f6f8] px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {isAdmin && pipelines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7"
                    >
                      Excluir este funil...
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/sales/leads?view=kanban"
                    className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-medium mr-2"
                  >
                    <span>Ver no Pipeline Kanban</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  {isAdmin ? (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#43a047] hover:bg-[#388e3c] text-white font-medium text-xs h-8 px-5 shadow-xs"
                    >
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* MODAL PARA CRIAR NOVO PIPELINE */}
          <CreatePipelineModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={(newPipeline) => {
              toast.success(`Pipeline '${newPipeline.name}' criado com sucesso!`);
              loadPipelines(newPipeline.id);
            }}
          />

          {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ETAPA */}
          <Dialog
            open={!!stageToDelete}
            onOpenChange={(v) => !v && setStageToDelete(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Deseja realmente remover a etapa{' '}
                  <strong className="text-slate-800">&quot;{stageToDelete?.name}&quot;</strong>{' '}
                  deste pipeline? As posições das demais etapas serão ajustadas automaticamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStageToDelete(null)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteDeleteStage}
                  className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs font-semibold"
                >
                  Confirmar Remoção
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PIPELINE */}
          <Dialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
          >
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Excluir Pipeline
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Tem certeza que deseja excluir o pipeline{' '}
                  <strong className="text-slate-800">&quot;{selectedPipeline?.name}&quot;</strong>?
                  Esta ação é irreversível. O pipeline só poderá ser excluído se não contiver oportunidades vinculadas.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeletePipeline}
                  className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs font-semibold"
                >
                  Excluir Funil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </SalesLayoutWrapper>
  );
}
