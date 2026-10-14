'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  Palette,
  Upload,
  Layers,
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  Building2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditingTarget = {
  type: 'cores' | 'capa' | 'secao' | 'condicao_pagamento' | 'precificacao_novo' | null;
  item?: any;
};

interface SectionEditorDrawerProps {
  editingTarget: EditingTarget;
  companyName?: string;
  pdfColors: { primary: string; secondary: string; accent: string };
  coverOption: 'padrao' | 'solar_ceu' | 'usina_solo' | 'custom';
  onSaveColors: (colors: { primary: string; secondary: string; accent: string }) => void;
  onSaveCover: (coverOption: 'padrao' | 'solar_ceu' | 'usina_solo' | 'custom') => void;
  onSaveSection: (id: string, content: string) => void;
  onSavePaymentCondition: (item: any) => void;
  onSavePricingTier: (tier: any) => void;
  onClose: () => void;
}

export function SectionEditorDrawer({
  editingTarget,
  companyName = 'Sua Empresa',
  pdfColors,
  coverOption,
  onSaveColors,
  onSaveCover,
  onSaveSection,
  onSavePaymentCondition,
  onSavePricingTier,
  onClose,
}: SectionEditorDrawerProps) {
  // Local states for editing
  const [localColors, setLocalColors] = useState(pdfColors);
  const [localCover, setLocalCover] = useState(coverOption);
  const [localContent, setLocalContent] = useState('');
  const [localPaymentItem, setLocalPaymentItem] = useState<any>(null);
  const [localPricingTier, setLocalPricingTier] = useState<any>({
    costName: '',
    pricePerKwp: 0,
    fromKwp: 0,
    toKwp: 10,
    calculationType: 'Por kWp',
    status: true,
  });

  useEffect(() => {
    setLocalColors(pdfColors);
  }, [pdfColors]);

  useEffect(() => {
    setLocalCover(coverOption);
  }, [coverOption]);

  useEffect(() => {
    if (editingTarget.type === 'secao' && editingTarget.item) {
      setLocalContent(editingTarget.item.content || '');
    } else if (editingTarget.type === 'condicao_pagamento' && editingTarget.item) {
      setLocalPaymentItem(editingTarget.item);
    } else if (editingTarget.type === 'precificacao_novo') {
      setLocalPricingTier({
        costName: '',
        pricePerKwp: 0,
        fromKwp: 0,
        toKwp: 10,
        calculationType: 'Por kWp',
        status: true,
      });
    }
  }, [editingTarget]);

  if (!editingTarget.type) return null;

  return (
    <aside
      className="w-full sm:w-[380px] md:w-[420px] max-w-full border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-30 shadow-2xl h-full"
      aria-label="Editor de Configuração"
    >
      {/* Header do Drawer */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/70">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>
            {editingTarget.type === 'cores' && 'Cores da Proposta'}
            {editingTarget.type === 'capa' && 'Imagem de Capa'}
            {editingTarget.type === 'secao' && (editingTarget.item?.label || 'Editar Seção')}
            {editingTarget.type === 'condicao_pagamento' && 'Condição de Pagamento'}
            {editingTarget.type === 'precificacao_novo' && 'Inserir Custo de Mão de Obra'}
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Conteúdo do Editor */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 1. EDITOR DE CORES */}
        {editingTarget.type === 'cores' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Personalize as cores primárias, secundárias e detalhes das suas propostas para manter a identidade visual da sua empresa.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cor Primária (Destaques e Títulos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localColors.primary}
                    onChange={(e) => setLocalColors({ ...localColors, primary: e.target.value })}
                    className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={localColors.primary}
                    onChange={(e) => setLocalColors({ ...localColors, primary: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cor Secundária (Textos e Fundos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localColors.secondary}
                    onChange={(e) => setLocalColors({ ...localColors, secondary: e.target.value })}
                    className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={localColors.secondary}
                    onChange={(e) => setLocalColors({ ...localColors, secondary: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cor de Acento (Badges e Selos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localColors.accent}
                    onChange={(e) => setLocalColors({ ...localColors, accent: e.target.value })}
                    className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={localColors.accent}
                    onChange={(e) => setLocalColors({ ...localColors, accent: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Restaurar padrão Avalia Solar</span>
              <button
                type="button"
                onClick={() => setLocalColors({ primary: '#0066FF', secondary: '#0F172A', accent: '#F6E85A' })}
                className="text-blue-600 font-bold hover:underline"
              >
                Padrão
              </button>
            </div>
          </div>
        )}

        {/* 2. EDITOR DE CAPA */}
        {editingTarget.type === 'capa' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Defina a imagem de abertura ou capa dos seus modelos de proposta PDF.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'solar_ceu', label: 'Céu Límpido com Painéis Solares', desc: 'Fotografia profissional em alta resolução' },
                { id: 'usina_solo', label: 'Usina Fotovoltaica de Solo', desc: 'Visual técnico e corporativo' },
                { id: 'padrao', label: 'Capa Clean com Logotipo', desc: 'Fundo neutro destacando o logo da empresa' },
                { id: 'custom', label: 'Fazer upload de imagem própria', desc: 'PNG, JPG ou WebP até 10MB' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setLocalCover(opt.id as any)}
                  className={cn(
                    'p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3',
                    localCover === opt.id
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                  {localCover === opt.id && (
                    <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. EDITOR DE SEÇÃO DE CONTEÚDO */}
        {editingTarget.type === 'secao' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Conteúdo de {editingTarget.item?.label}
              </label>
              <textarea
                rows={6}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder={`Informe os detalhes para ${editingTarget.item?.label}...`}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-blue-600 focus:outline-none"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>Informações adicionadas serão impressas na seção correspondente</span>
                <span>{localContent.length} caracteres</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. EDITOR DE PRECIFICAÇÃO */}
        {editingTarget.type === 'precificacao_novo' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Custo / Serviço</label>
              <input
                type="text"
                value={localPricingTier.costName}
                onChange={(e) => setLocalPricingTier({ ...localPricingTier, costName: e.target.value })}
                placeholder="Ex: Instalação Padrão Telhado Cerâmico"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preço / Unidade (R$)</label>
                <input
                  type="number"
                  value={localPricingTier.pricePerKwp || ''}
                  onChange={(e) => setLocalPricingTier({ ...localPricingTier, pricePerKwp: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Cálculo</label>
                <select
                  value={localPricingTier.calculationType}
                  onChange={(e) => setLocalPricingTier({ ...localPricingTier, calculationType: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white"
                >
                  <option value="Por kWp">Por kWp</option>
                  <option value="Fixo por projeto">Fixo por projeto</option>
                  <option value="Percentual">Percentual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">De (kWp)</label>
                <input
                  type="number"
                  value={localPricingTier.fromKwp}
                  onChange={(e) => setLocalPricingTier({ ...localPricingTier, fromKwp: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Até (kWp)</label>
                <input
                  type="number"
                  value={localPricingTier.toKwp}
                  onChange={(e) => setLocalPricingTier({ ...localPricingTier, toKwp: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. EDITOR DE CONDIÇÃO DE PAGAMENTO */}
        {editingTarget.type === 'condicao_pagamento' && localPaymentItem && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Condição</label>
              <input
                type="text"
                value={localPaymentItem.name}
                onChange={(e) => setLocalPaymentItem({ ...localPaymentItem, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Máx. Parcelas</label>
                <input
                  type="number"
                  value={localPaymentItem.installments || 1}
                  onChange={(e) => setLocalPaymentItem({ ...localPaymentItem, installments: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Desconto (%)</label>
                <input
                  type="number"
                  value={localPaymentItem.discountPercent || 0}
                  onChange={(e) => setLocalPaymentItem({ ...localPaymentItem, discountPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé de Salvar */}
      <div className="border-t border-slate-100 p-4 bg-white shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 text-xs transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            if (editingTarget.type === 'cores') {
              onSaveColors(localColors);
            } else if (editingTarget.type === 'capa') {
              onSaveCover(localCover);
            } else if (editingTarget.type === 'secao' && editingTarget.item) {
              onSaveSection(editingTarget.item.id, localContent);
            } else if (editingTarget.type === 'condicao_pagamento' && localPaymentItem) {
              onSavePaymentCondition(localPaymentItem);
            } else if (editingTarget.type === 'precificacao_novo') {
              onSavePricingTier(localPricingTier);
            }
            onClose();
          }}
          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-xs transition-colors"
        >
          Salvar
        </button>
      </div>
    </aside>
  );
}
