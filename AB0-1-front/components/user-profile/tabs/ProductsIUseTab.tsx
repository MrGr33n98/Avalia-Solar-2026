'use client';

import React, { useMemo, useState } from 'react';
import { Box, Plus, Star, Filter, Trash2, ExternalLink, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { EquipmentItem } from '../types';

interface ProductsIUseTabProps {
  /** `null` = falha ao carregar a lista real. */
  equipments: EquipmentItem[] | null;
  onAddEquipment?: () => void;
  /** Deve rejeitar quando a remoção não for persistida. */
  onRemoveEquipment?: (id: string) => Promise<void>;
  onLeaveReview?: (equipment?: EquipmentItem) => void;
  onRetry?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  company: 'Empresa',
  product: 'Produto',
  service: 'Serviço',
  technology: 'Tecnologia',
};

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

export function ProductsIUseTab({
  equipments,
  onAddEquipment,
  onRemoveEquipment,
  onLeaveReview,
  onRetry,
}: ProductsIUseTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'my_products' | 'compared'>('my_products');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const list = useMemo(() => equipments ?? [], [equipments]);
  const categories = useMemo(
    () => Array.from(new Set(list.map((item) => item.category).filter(Boolean))).sort(),
    [list]
  );
  const filteredEquipments = list.filter(
    (item) => filterCategory === 'all' || item.category === filterCategory
  );

  const handleRemove = async (item: EquipmentItem) => {
    if (!onRemoveEquipment) return;
    if (typeof window !== 'undefined' && !window.confirm(`Remover "${item.name}" da sua lista?`)) return;
    setRemoveError(null);
    setRemovingId(item.id);
    try {
      await onRemoveEquipment(item.id);
    } catch (error) {
      setRemoveError(
        error instanceof Error && error.message ? error.message : 'Não foi possível remover o equipamento.'
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="products-i-use-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipamentos que Utilizo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize os produtos e soluções que você instala ou possui no seu sistema.
          </p>
        </div>

        {onAddEquipment && equipments !== null && (
          <button
            type="button"
            onClick={onAddEquipment}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all self-start sm:self-auto"
            data-testid="add-equipment-button"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Equipamento</span>
          </button>
        )}
      </div>

      {/* Sub-abas */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6 -mb-px" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'my_products'}
            onClick={() => setActiveSubTab('my_products')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'my_products'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Meus Equipamentos{equipments !== null ? ` (${list.length})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'compared'}
            onClick={() => setActiveSubTab('compared')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'compared'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Equipamentos Comparados
          </button>
        </div>

        {activeSubTab === 'my_products' && categories.length > 1 && (
          <div className="hidden sm:flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filtrar por categoria"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {removeError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600" data-testid="equipment-remove-error">
          <AlertCircle className="w-4 h-4" />
          {removeError}
        </p>
      )}

      {/* Conteúdo da Aba */}
      {activeSubTab === 'compared' ? (
        <div
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          data-testid="compared-unavailable"
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ainda não disponível</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            O histórico de comparações será exibido aqui em uma próxima versão.
          </p>
        </div>
      ) : equipments === null ? (
        <div
          role="alert"
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/10"
          data-testid="products-load-error"
        >
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Não foi possível carregar seus equipamentos.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : filteredEquipments.length === 0 ? (
        <div
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          data-testid="products-empty-state"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Você ainda não adicionou nenhum equipamento!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Cadastre os produtos e soluções com os quais você trabalha para registrar sua experiência.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onAddEquipment && (
              <button
                type="button"
                onClick={onAddEquipment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Adicionar Equipamento</span>
              </button>
            )}
            {onLeaveReview && (
              <button
                type="button"
                onClick={() => onLeaveReview()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Deixar uma Avaliação</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="products-grid">
          {filteredEquipments.map((item) => {
            const addedAt = formatDate(item.created_at);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full truncate">
                      {item.category || TYPE_LABELS[item.type] || 'Sem categoria'}
                    </span>
                    {onRemoveEquipment && (
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={removingId === item.id}
                        aria-label={`Remover ${item.name}`}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white break-words">{item.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {TYPE_LABELS[item.type] || item.type}
                    {addedAt ? ` · Adicionado em ${addedAt}` : ''}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {item.verified ? (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verificado
                    </span>
                  ) : item.status === 'rejected' ? (
                    <span className="text-xs text-rose-600 font-semibold">Não aprovado</span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Aguardando validação</span>
                  )}
                  {onLeaveReview && (
                    <button
                      type="button"
                      onClick={() => onLeaveReview(item)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Avaliar</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
