'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalPdfModelId } from '../ProposalSettingsStudio';

interface PdfPreviewModalProps {
  modelId: ProposalPdfModelId | null;
  companyName?: string;
  onClose: () => void;
  onSelectAndSave: (modelId: ProposalPdfModelId) => void;
}

export function PdfPreviewModal({
  modelId,
  companyName = 'Sua Empresa',
  onClose,
  onSelectAndSave,
}: PdfPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!modelId) return null;

  const totalPages = 3;

  const modelTitles: Record<ProposalPdfModelId, string> = {
    modelo_1: 'Modelo 1 — Essencial Técnico',
    modelo_2: 'Modelo 2 — Executivo Azul',
    modelo_3: 'Modelo 3 — Técnico Solar',
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(70, z - 15));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header do Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 id="preview-modal-title" className="font-black text-sm sm:text-base text-slate-900">
              Pré-visualização: {modelTitles[modelId]}
            </h3>
            <span className="hidden sm:inline-flex text-[11px] bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
              Formato A4 Oficial
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Zoom */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 70}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                title="Reduzir zoom"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[11px] font-bold text-slate-600 w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Controles de Página */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                title="Página anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                title="Próxima página"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
              aria-label="Fechar prévia"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport da Folha A4 Real */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 flex justify-center items-start">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[595px] min-h-[842px] bg-white rounded-lg shadow-xl p-8 border border-slate-200 flex flex-col justify-between text-slate-800 transition-transform duration-150"
          >
            {/* PÁGINA 1: Capa e Identificação */}
            {currentPage === 1 && (
              <div className="flex flex-col h-full justify-between space-y-6">
                {/* Header Documento */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                      AS
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{companyName}</h4>
                      <p className="text-xs text-slate-500">Proposta Comercial de Engenharia Solar</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold text-slate-900">Projeto Personalizado</p>
                    <p>Validade definida na proposta</p>
                  </div>
                </div>

                {/* Banner Central com Design Específico do Modelo */}
                {modelId === 'modelo_1' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                      Projeto Fotovoltaico
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      Solução Solar Técnica e Econômica
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Dimensionamento de alta eficiência projetado para redução de custos com energia elétrica e sustentabilidade.
                    </p>
                  </div>
                )}

                {modelId === 'modelo_2' && (
                  <div className="h-64 rounded-xl bg-gradient-to-br from-blue-700 via-sky-600 to-slate-900 p-6 text-white flex flex-col justify-end space-y-2 relative overflow-hidden shadow-md">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <span className="text-xs font-bold text-sky-200 uppercase tracking-wider relative z-10">
                      Energia Limpa & Sustentável
                    </span>
                    <h2 className="text-xl font-black relative z-10 leading-snug">
                      Energia solar para um futuro mais sustentável e econômico.
                    </h2>
                  </div>
                )}

                {modelId === 'modelo_3' && (
                  <div className="rounded-xl border-2 border-slate-900 p-6 space-y-3 bg-white">
                    <div className="inline-block bg-yellow-400 text-slate-950 px-3 py-1 rounded-md text-xs font-black uppercase">
                      Engenharia de Alta Performance
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                      Proposta Comercial & Especificações Técnicas
                    </h2>
                    <p className="text-xs text-slate-600">
                      Equipamentos homologados pelos principais órgãos reguladores do setor elétrico brasileiro.
                    </p>
                  </div>
                )}

                {/* Resumo Geral de Seções */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Estrutura da Proposta
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                      <span className="font-bold text-slate-800 block">Equipamentos e Serviços</span>
                      <span className="text-slate-500 text-[11px]">Módulos, inversores, estruturas e homologação</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                      <span className="font-bold text-slate-800 block">Condições e Prazos</span>
                      <span className="text-slate-500 text-[11px]">Pagamento parcelado, cronograma e garantias</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé Página 1 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Avalia Solar • Plataforma Oficial de Energia Solar</span>
                  <span>Página 1 de {totalPages}</span>
                </div>
              </div>
            )}

            {/* PÁGINA 2: Itens Técnicos e Garantias */}
            {currentPage === 2 && (
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-xs text-slate-700">{companyName}</span>
                  <span className="text-xs text-slate-400">Especificações Técnicas</span>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Equipamentos e Componentes Homologados
                  </h5>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-4 bg-slate-50 p-2.5 font-bold text-slate-700">
                      <span className="col-span-2">Item</span>
                      <span>Qtd</span>
                      <span className="text-right">Garantia</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Módulos Monocristalinos Tier-1</span>
                      <span>Definido em projeto</span>
                      <span className="text-right text-slate-500">Fabricante</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Inversor String com Monitoramento Wi-Fi</span>
                      <span>Definido em projeto</span>
                      <span className="text-right text-slate-500">Fabricante</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Estrutura de Fixação em Alumínio Anodizado</span>
                      <span>Conforme telhado</span>
                      <span className="text-right text-slate-500">Fabricante</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Engenharia, Instalação e Homologação</span>
                      <span>Pacote completo</span>
                      <span className="text-right text-slate-500">Instaladora</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Garantias e Prazos do Serviço
                  </h5>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-600 leading-relaxed">
                    As garantias dos equipamentos são fornecidas pelos fabricantes certificados, e a mão de obra de instalação conta com garantia técnica da integradora conforme registrado no contrato de prestação de serviços.
                  </div>
                </div>

                {/* Rodapé Página 2 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Avalia Solar • Documento Oficial</span>
                  <span>Página 2 de {totalPages}</span>
                </div>
              </div>
            )}

            {/* PÁGINA 3: Termos, Cronograma e Assinaturas */}
            {currentPage === 3 && (
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-xs text-slate-700">{companyName}</span>
                  <span className="text-xs text-slate-400">Termos Comerciais e Cronograma</span>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Cronograma Padrão de Execução
                  </h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                      <span className="font-bold text-blue-600 block text-[11px]">Etapa 1</span>
                      <span className="font-semibold text-slate-800">Vistoria Técnica</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Validação local</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                      <span className="font-bold text-blue-600 block text-[11px]">Etapa 2</span>
                      <span className="font-semibold text-slate-800">Instalação</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Montagem física</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                      <span className="font-bold text-blue-600 block text-[11px]">Etapa 3</span>
                      <span className="font-semibold text-slate-800">Homologação</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Concessionária</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Termos e Condições Comerciais
                  </h5>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
                    Valores e prazos estipulados nesta proposta estão sujeitos a confirmação após visita técnica presencial. Os pagamentos e parcelamentos seguem os termos acordados entre comprador e integrador credenciado.
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 mb-1" />
                    <span className="font-bold text-slate-800">{companyName}</span>
                    <span className="block text-[10px] text-slate-400">Responsável Técnico</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1" />
                    <span className="font-bold text-slate-800">Cliente Comprador</span>
                    <span className="block text-[10px] text-slate-400">Aceite da Proposta</span>
                  </div>
                </div>

                {/* Rodapé Página 3 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Avalia Solar • Documento Oficial</span>
                  <span>Página 3 de {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => onSelectAndSave(modelId)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors"
          >
            Usar este modelo
          </button>
        </div>
      </div>
    </div>
  );
}
