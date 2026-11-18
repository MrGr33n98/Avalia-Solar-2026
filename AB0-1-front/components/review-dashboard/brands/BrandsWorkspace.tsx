'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Filter, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { BrandAvatarStack } from './BrandAvatarStack';
import { BrandUsageCard } from './BrandUsageCard';
import { BrandMetricStrip } from './BrandMetricStrip';
import { BrandAddDialog } from './BrandAddDialog';
import {
  fetchReviewerBrandUsages,
  fetchReviewerBrandSummary,
  updateReviewerBrandUsage,
  deleteReviewerBrandUsage,
  type ReviewerBrandUsage,
  type ReviewerBrandSummary,
  type BrandUsageContext,
} from '@/lib/api/reviewer-brand-usages';

export function BrandsWorkspace() {
  const [usages, setUsages] = useState<ReviewerBrandUsage[]>([]);
  const [summary, setSummary] = useState<ReviewerBrandSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros locais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('all');

  // Modais e ações
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usagesResp, summaryResp] = await Promise.all([
        fetchReviewerBrandUsages({ status: 'active', limit: 50 }),
        fetchReviewerBrandSummary(),
      ]);
      setUsages(usagesResp.data);
      setSummary(summaryResp.data);
    } catch (err: unknown) {
      setError('Não foi possível carregar as marcas. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Alternar visibilidade pública/privada com consentimento
  const handleToggleVisibility = async (usage: ReviewerBrandUsage) => {
    const newVisibility = usage.visibility === 'public' ? 'private' : 'public';
    setActionInProgressId(usage.id);
    try {
      const resp = await updateReviewerBrandUsage(usage.id, {
        visibility: newVisibility,
        consent_confirmed: newVisibility === 'public' ? true : undefined,
        consent_version: newVisibility === 'public' ? 'reviewer-brands-v1' : undefined,
        lock_version: usage.lock_version,
      });

      setUsages((prev) =>
        prev.map((item) => (item.id === usage.id ? resp.data : item))
      );
      // Atualiza sumário após mudança de visibilidade
      fetchReviewerBrandSummary().then((res) => setSummary(res.data)).catch(() => {});
    } catch (err: unknown) {
      alert('Falha ao atualizar visibilidade da marca.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Excluir marca (soft delete)
  const handleDelete = async (usage: ReviewerBrandUsage) => {
    const confirmed = window.confirm(
      `Deseja realmente desvincular a marca ${usage.brand.name} do contexto "${usage.usage_context_label}"?`
    );
    if (!confirmed) return;

    setActionInProgressId(usage.id);
    try {
      await deleteReviewerBrandUsage(usage.id);
      setUsages((prev) => prev.filter((item) => item.id !== usage.id));
      fetchReviewerBrandSummary().then((res) => setSummary(res.data)).catch(() => {});
    } catch (err: unknown) {
      alert('Falha ao desvincular a marca.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filtragem local
  const filteredUsages = useMemo(() => {
    return usages.filter((usage) => {
      const matchesSearch =
        !searchQuery.trim() ||
        usage.brand.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        usage.brand.slug.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesContext =
        selectedContext === 'all' || usage.usage_context === selectedContext;

      return matchesSearch && matchesContext;
    });
  }, [usages, searchQuery, selectedContext]);

  // Lista de marcas únicas para o BrandAvatarStack
  const uniqueCatalogBrands = useMemo(() => {
    return usages.map((u) => u.brand);
  }, [usages]);

  return (
    <div className="space-y-4">
      {/* Indicadores numéricos consolidados */}
      <BrandMetricStrip
        summary={summary}
        loading={loading}
        hasError={Boolean(error)}
      />

      {/* Barra de controle: AvatarStack + Busca + Filtros + CTA */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <BrandAvatarStack
            brands={uniqueCatalogBrands}
            maxVisible={5}
            size={28}
          />

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar marcas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por contexto de uso */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] bg-white text-slate-700 font-medium"
            >
              <option value="all">Todos os contextos</option>
              <option value="integrator_install">Instalo em projetos</option>
              <option value="personal_owner">Uso pessoal</option>
              <option value="designer_specification">Especifico em projetos</option>
              <option value="maintenance">Manutenção</option>
              <option value="reseller">Revenda</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#17468D] hover:bg-[#12366e] rounded shadow-sm transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Marca</span>
          </button>
        </div>
      </div>

      {/* Conteúdo principal / Lista / Estados */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded p-4 h-32 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                  <div className="w-32 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-full h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-red-800 mb-1">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : filteredUsages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#17468D]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-xs font-bold text-slate-900 mb-1">
              {searchQuery || selectedContext !== 'all'
                ? 'Nenhuma marca encontrada com os filtros atuais'
                : 'Nenhuma marca vinculada ao seu perfil'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {searchQuery || selectedContext !== 'all'
                ? 'Tente ajustar os termos da busca ou limpar os filtros selecionados.'
                : 'Indique os fabricantes de equipamentos solares com os quais você atua em projetos, instalações ou uso pessoal.'}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#17468D] hover:bg-[#12366e] rounded shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular Primeira Marca</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsages.map((usage) => (
            <BrandUsageCard
              key={usage.id}
              usage={usage}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
              isUpdating={actionInProgressId === usage.id}
            />
          ))}
        </div>
      )}

      {/* Modal para Adicionar Marca */}
      <BrandAddDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newUsage) => {
          setUsages((prev) => [newUsage, ...prev]);
          fetchReviewerBrandSummary().then((res) => setSummary(res.data)).catch(() => {});
        }}
      />
    </div>
  );
}
