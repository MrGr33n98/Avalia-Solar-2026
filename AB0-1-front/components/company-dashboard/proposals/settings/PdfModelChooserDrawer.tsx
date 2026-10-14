'use client';

import React from 'react';
import {
  ChevronLeft,
  X,
  Maximize2,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalPdfModelId } from '../ProposalSettingsStudio';

interface PdfModelChooserDrawerProps {
  isOpen: boolean;
  selectedModel: ProposalPdfModelId;
  savedModel: ProposalPdfModelId;
  companyName?: string;
  isSaving?: boolean;
  onSelectModel: (modelId: ProposalPdfModelId) => void;
  onExpandPreview: (modelId: ProposalPdfModelId) => void;
  onSave: () => void;
  onClose: () => void;
}

export function PdfModelChooserDrawer({
  isOpen,
  selectedModel,
  savedModel,
  companyName = 'Sua Empresa',
  isSaving = false,
  onSelectModel,
  onExpandPreview,
  onSave,
  onClose,
}: PdfModelChooserDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside
      className="w-full sm:w-[380px] md:w-[420px] max-w-full border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-30 shadow-2xl h-full"
      aria-label="Gaveta de Escolha de Modelo de Proposta"
    >
      {/* Header do Drawer */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/70">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Modelo de Proposta</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Fechar gaveta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Conteúdo do Drawer */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Escolha o modelo da proposta
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            O modelo selecionado será o seu modelo padrão de propostas. Você poderá mudá-lo sempre que quiser.
          </p>
        </div>

        {/* Grid de Modelos */}
        <div className="space-y-6">
          {/* MODELO 1: Essencial Técnico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Modelo 1</span>
              <button
                type="button"
                onClick={() => onExpandPreview('modelo_1')}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="Ampliar pré-visualização do Modelo 1"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <div
              onClick={() => onSelectModel('modelo_1')}
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden bg-white shadow-xs hover:shadow-md group',
                selectedModel === 'modelo_1'
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Badge Indicador de Seleção */}
              <div className="absolute top-3 right-3 z-10">
                {selectedModel === 'modelo_1' ? (
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                )}
              </div>

              {/* Miniatura do Modelo 1 */}
              <div className="p-4 space-y-2.5 bg-white text-[9px] text-slate-700 leading-tight">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    AS
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 text-[10px] truncate">{companyName}</p>
                    <p className="text-slate-400 text-[8px]">Engenharia Solar Fotovoltaica</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-blue-600 text-[9px]">Proposta Técnica Comercial</p>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-[7.5px] text-slate-400 block font-medium">Potência</span>
                      <span className="font-bold text-slate-900 text-[9px]">Conforme projeto</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-400 block font-medium">Validade</span>
                      <span className="font-bold text-emerald-600 text-[9px]">10 dias</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-lg overflow-hidden text-[7px]">
                  <div className="grid grid-cols-3 bg-slate-100 font-bold p-1 text-slate-600">
                    <span>Equipamento</span>
                    <span>Qtd</span>
                    <span className="text-right">Garantia</span>
                  </div>
                  <div className="grid grid-cols-3 p-1 border-t border-slate-50 text-slate-600">
                    <span className="truncate">Módulos N-Type</span>
                    <span>16 un</span>
                    <span className="text-right">Fabricante</span>
                  </div>
                  <div className="grid grid-cols-3 p-1 border-t border-slate-50 text-slate-600">
                    <span className="truncate">Inversor String</span>
                    <span>01 un</span>
                    <span className="text-right">Fabricante</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MODELO 2: Executivo Azul */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Modelo 2</span>
              <button
                type="button"
                onClick={() => onExpandPreview('modelo_2')}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="Ampliar pré-visualização do Modelo 2"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <div
              onClick={() => onSelectModel('modelo_2')}
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden shadow-xs hover:shadow-md group',
                selectedModel === 'modelo_2'
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="absolute top-3 right-3 z-10">
                {selectedModel === 'modelo_2' ? (
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                )}
              </div>

              {/* Miniatura do Modelo 2 */}
              <div className="h-52 relative bg-gradient-to-b from-blue-700 via-sky-600 to-slate-900 flex flex-col justify-between p-4 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

                <div className="relative z-10 pt-2 space-y-1.5">
                  <h4 className="text-xs font-black tracking-tight leading-snug">
                    Energia solar para um futuro mais sustentável.
                  </h4>
                  <div className="space-y-0.5 text-[7.5px] text-blue-100">
                    <p>Proposta comercial personalizada</p>
                    <p>Validade estipulada em orçamento</p>
                  </div>
                </div>

                <div className="relative z-10 bg-white text-slate-900 p-2 rounded-xl flex items-center gap-2 shadow-lg">
                  <div className="h-5 w-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                    AS
                  </div>
                  <div className="text-[7.5px] leading-tight truncate">
                    <p className="font-bold text-slate-900 truncate">{companyName}</p>
                    <p className="text-slate-500">Parceiro Oficial Avalia Solar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MODELO 3: Técnico Solar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Modelo 3</span>
              <button
                type="button"
                onClick={() => onExpandPreview('modelo_3')}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="Ampliar pré-visualização do Modelo 3"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <div
              onClick={() => onSelectModel('modelo_3')}
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden shadow-xs hover:shadow-md group',
                selectedModel === 'modelo_3'
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="absolute top-3 right-3 z-10">
                {selectedModel === 'modelo_3' ? (
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                )}
              </div>

              {/* Miniatura do Modelo 3 */}
              <div className="h-52 relative bg-gradient-to-b from-blue-800 via-sky-700 to-indigo-950 flex flex-col justify-between p-4 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

                <div className="relative z-10 pt-2 space-y-1.5">
                  <h4 className="text-xs font-black tracking-tight leading-snug">
                    Soluções em energia solar de alta performance.
                  </h4>
                  <div className="space-y-0.5 text-[7.5px] text-blue-100">
                    <p>Engenharia fotovoltaica homologada</p>
                    <p>Equipamentos certificados pelo INMETRO</p>
                  </div>
                </div>

                <div className="relative z-10 bg-yellow-400 text-slate-950 p-2 rounded-xl flex items-center gap-2 shadow-lg">
                  <div className="h-5 w-5 rounded-lg bg-slate-950 text-yellow-400 flex items-center justify-center font-bold text-[8px] shrink-0">
                    ☀️
                  </div>
                  <div className="text-[7.5px] leading-tight truncate">
                    <p className="font-black text-slate-950 uppercase truncate">{companyName}</p>
                    <p className="text-slate-800">Engenharia e Soluções</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Fixo com Botão Salvar Modelo */}
      <div className="border-t border-slate-100 p-4 bg-white shrink-0">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando no servidor...</span>
            </>
          ) : (
            <span>Salvar como modelo padrão</span>
          )}
        </button>
      </div>
    </aside>
  );
}
