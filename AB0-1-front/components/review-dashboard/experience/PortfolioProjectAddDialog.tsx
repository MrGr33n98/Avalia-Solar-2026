'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchReviewerBrandUsages, type ReviewerBrandUsage } from '@/lib/api/reviewer-brand-usages';
import {
  createReviewerProject,
  type PortfolioProjectType,
  type ReviewerPortfolioProject,
} from '@/lib/api/reviewer-portfolio-projects';

export interface PortfolioProjectAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: ReviewerPortfolioProject) => void;
}

const PROJECT_TYPE_OPTIONS: { value: PortfolioProjectType; label: string }[] = [
  { value: 'residential', label: 'Residencial' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural / Agro' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'ev_charging', label: 'Eletromobilidade / Recarga' },
  { value: 'bess_storage', label: 'Armazenamento de Energia (BESS)' },
];

export function PortfolioProjectAddDialog({
  isOpen,
  onClose,
  onSuccess,
}: PortfolioProjectAddDialogProps) {
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<PortfolioProjectType>('residential');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacityKwp, setCapacityKwp] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Marcas do usuário para vinculação
  const [userBrands, setUserBrands] = useState<ReviewerBrandUsage[]>([]);
  const [selectedBrandUsageIds, setSelectedBrandUsageIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReviewerBrandUsages({ status: 'active', limit: 50 })
        .then((resp) => setUserBrands(resp.data))
        .catch(() => setUserBrands([]));
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setProjectType('residential');
    setCity('');
    setState('');
    setCapacityKwp('');
    setStartedAt('');
    setCompletedAt('');
    setDescription('');
    setVisibility('private');
    setConsentConfirmed(false);
    setSelectedBrandUsageIds([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleBrandUsage = (id: string) => {
    setSelectedBrandUsageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Informe o título do projeto.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (startedAt && startedAt > todayStr) {
      setError('A data de início não pode ser uma data futura.');
      return;
    }
    if (completedAt && completedAt > todayStr) {
      setError('A data de conclusão não pode ser uma data futura.');
      return;
    }
    if (startedAt && completedAt && completedAt < startedAt) {
      setError('A data de conclusão não pode ser anterior à data de início.');
      return;
    }

    if (visibility === 'public' && !consentConfirmed) {
      setError('Para publicar este projeto no perfil público, confirme seu consentimento formal.');
      return;
    }

    setSaving(true);
    try {
      const resp = await createReviewerProject({
        title: title.trim(),
        project_type: projectType,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase() || undefined,
        capacity_kwp: capacityKwp ? parseFloat(capacityKwp.replace(',', '.')) : undefined,
        started_at: startedAt || undefined,
        completed_at: completedAt || undefined,
        description: description.trim() || undefined,
        visibility,
        brand_usage_ids: selectedBrandUsageIds.length > 0 ? selectedBrandUsageIds : undefined,
        consent_confirmed: visibility === 'public' ? true : undefined,
        consent_version: visibility === 'public' ? 'reviewer-projects-v1' : undefined,
      });

      onSuccess(resp.data);
      handleClose();
    } catch (err: unknown) {
      setError('Não foi possível cadastrar o projeto. Verifique os campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Cadastrar Projeto do Portfólio</h2>
            <p className="text-[11px] text-slate-500">
              Registre usinas ou instalações que você executou, especificou ou opera.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Título do Projeto *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Usina Solar Fotovoltaica Granja Boa Vista"
              maxLength={160}
            />
          </div>

          {/* Tipo e Potência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de Projeto *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as PortfolioProjectType)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#17468D]"
              >
                {PROJECT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Potência (kWp autodeclarada)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={capacityKwp}
                onChange={(e) => setCapacityKwp(e.target.value)}
                placeholder="Ex.: 15.5"
              />
            </div>
          </div>

          {/* Cidade e UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Cidade (sem endereço exato)</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: Campinas"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">UF (2 letras)</label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value.slice(0, 2).toUpperCase())}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Início (Opcional)</label>
              <Input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Conclusão (Opcional)</label>
              <Input
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
              />
            </div>
          </div>

          {/* Vínculo com Marcas Declaradas */}
          {userBrands.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Marcas utilizadas neste projeto (Opcional)
              </label>
              <div className="border border-slate-200 rounded p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50">
                {userBrands.map((ub) => (
                  <label
                    key={ub.id}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrandUsageIds.includes(ub.id)}
                      onChange={() => toggleBrandUsage(ub.id)}
                      className="rounded border-slate-300 text-[#17468D] focus:ring-[#17468D]"
                    />
                    <span className="font-semibold text-slate-900">{ub.brand.name}</span>
                    <span className="text-[10px] text-slate-500">({ub.usage_context_label})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Descrição Técnica (sem dados de clientes)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva detalhes como tipo de telhado, solo, módulos, inversor ou sistema de monitoramento..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D]"
              maxLength={500}
            />
          </div>

          {/* Visibilidade e Consentimento */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">Visibilidade do Projeto</p>
                <p className="text-[11px] text-slate-500">Exibir este projeto no perfil público do Creator?</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    visibility === 'private'
                      ? 'bg-slate-200 text-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Privado
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    visibility === 'public'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Público
                </button>
              </div>
            </div>

            {visibility === 'public' && (
              <label className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-blue-900 leading-tight">
                  Confirmo que as informações declaradas não contêm dados pessoais de clientes,
                  endereços restritos ou informações confidenciais, e autorizo a exibição pública deste
                  portfólio.
                </span>
              </label>
            )}
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
