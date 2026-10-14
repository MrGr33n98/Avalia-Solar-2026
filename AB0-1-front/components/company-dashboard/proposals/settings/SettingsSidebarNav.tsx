'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sliders,
  FileText,
  Smartphone,
  Layers,
  DollarSign,
  Palette,
  TrendingUp,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSidebarNavProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  className?: string;
}

export function SettingsSidebarNav({
  activeSection,
  onSelectSection,
  className,
}: SettingsSidebarNavProps) {
  const [isGeralOpen, setIsGeralOpen] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(true);
  const [isDigitalOpen, setIsDigitalOpen] = useState(true);

  return (
    <nav
      className={cn(
        'w-[210px] xl:w-[224px] border-r border-slate-200 bg-white p-3 shrink-0 flex flex-col gap-4 text-xs font-medium select-none overflow-y-auto',
        className
      )}
      aria-label="Menu de Configurações de Propostas"
    >
      {/* Grupo: Geral */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsGeralOpen(!isGeralOpen)}
          className="flex w-full items-center justify-between px-2.5 py-1.5 font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <span className="text-[13px] tracking-tight">Geral</span>
          {isGeralOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {isGeralOpen && (
          <div className="ml-2 space-y-0.5 border-l-2 border-slate-100 pl-2">
            <button
              type="button"
              onClick={() => onSelectSection('geral_mao_de_obra')}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'geral_mao_de_obra'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span>Mão de obra</span>
              </div>
              <span className="text-[10px] opacity-60">Precificação</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection('geral_pagamento')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'geral_pagamento'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <DollarSign className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Condições de pagamento</span>
            </button>
          </div>
        )}
      </div>

      {/* Grupo: Proposta PDF */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsPdfOpen(!isPdfOpen)}
          className="flex w-full items-center justify-between px-2.5 py-1.5 font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <span className="text-[13px] tracking-tight">Proposta PDF</span>
          {isPdfOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {isPdfOpen && (
          <div className="ml-2 space-y-0.5 border-l-2 border-slate-100 pl-2">
            <button
              type="button"
              onClick={() => onSelectSection('pdf_configuracoes')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'pdf_configuracoes'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Sliders className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Configurações</span>
            </button>
          </div>
        )}
      </div>

      {/* Grupo: Proposta Digital */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsDigitalOpen(!isDigitalOpen)}
          className="flex w-full items-center justify-between px-2.5 py-1.5 font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <span className="text-[13px] tracking-tight">Proposta Digital</span>
          {isDigitalOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {isDigitalOpen && (
          <div className="ml-2 space-y-0.5 border-l-2 border-slate-100 pl-2">
            <button
              type="button"
              onClick={() => onSelectSection('digital_configuracoes')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'digital_configuracoes'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Configurações</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection('digital_cores')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'digital_cores'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Palette className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Cores</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection('digital_roi')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'digital_roi'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <TrendingUp className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Retorno do investimento</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection('digital_produtos')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'digital_produtos'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Package className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Configurações de produto</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection('digital_comissao')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors text-left',
                activeSection === 'digital_comissao'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>Comissionamento</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
