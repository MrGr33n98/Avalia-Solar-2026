'use client';

import React from 'react';
import { Sliders, Plus, Table as TableIcon } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function CustomReportPage() {
  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Custom Reports
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Crie relatórios customizados com agrupamento por vendedor, tags solares e filtros avançados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Relatório</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-12 text-center shadow-xs">
          <TableIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Construtor de Relatórios Personalizados
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Monte visões tabulares dinâmicas selecionando colunas de leads, campos personalizados de energia solar e métricas de conversão.
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Configurar Primeiro Relatório
          </button>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
