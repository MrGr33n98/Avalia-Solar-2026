'use client';

import React, { useState } from 'react';
import { Box, Plus, Star, Sparkles, Filter, Trash2, ExternalLink } from 'lucide-react';
import { EquipmentItem } from '../types';

interface ProductsIUseTabProps {
  equipments: EquipmentItem[];
  onAddEquipment?: () => void;
  onRemoveEquipment?: (id: string) => void;
  onLeaveReview?: (equipment: EquipmentItem) => void;
}

export function ProductsIUseTab({
  equipments,
  onAddEquipment,
  onRemoveEquipment,
  onLeaveReview,
}: ProductsIUseTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'my_products' | 'compared'>('my_products');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredEquipments = equipments.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="space-y-6" data-testid="products-i-use-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Equipamentos que Utilizo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize os inversores, módulos e baterias que você instala ou possui no seu sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddEquipment}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all self-start sm:self-auto"
          data-testid="add-equipment-button"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Equipamento</span>
        </button>
      </div>

      {/* Sub-abas (Estilo G2) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6 -mb-px">
          <button
            type="button"
            onClick={() => setActiveSubTab('my_products')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'my_products'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Meus Equipamentos ({equipments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('compared')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'compared'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Equipamentos Comparados (0)
          </button>
        </div>

        {equipments.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="inverter">Inversores</option>
              <option value="module">Módulos Solares</option>
              <option value="battery">Baterias / Armazenamento</option>
              <option value="structure">Estruturas de Fixação</option>
            </select>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba */}
      {filteredEquipments.length === 0 ? (
        /* Empty State Ilustrado Inspirado no G2 */
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
            Cadastre os inversores e módulos solares com os quais você trabalha para comprovar sua expertise técnica e receber cotações mais qualificadas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddEquipment}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Adicionar Equipamento</span>
            </button>
            <button
              type="button"
              onClick={() => onLeaveReview?.({} as EquipmentItem)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Deixar uma Avaliação</span>
            </button>
          </div>
        </div>
      ) : (
        /* Grid de Equipamentos */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEquipments.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                    {item.category === 'inverter'
                      ? 'Inversor'
                      : item.category === 'module'
                      ? 'Módulo'
                      : item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveEquipment?.(item.id)}
                    aria-label="Remover equipamento"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.brand} — {item.model}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adicionado em {item.date_added}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Homologado
                </span>
                <button
                  type="button"
                  onClick={() => onLeaveReview?.(item)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Avaliar</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

