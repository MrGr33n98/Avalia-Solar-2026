'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { BrandCatalogCombobox } from './BrandCatalogCombobox';
import type { BrandCatalogItem } from '@/lib/api/brands';
import {
  createReviewerBrandUsage,
  type BrandUsageContext,
  type ReviewerBrandUsage,
} from '@/lib/api/reviewer-brand-usages';

export interface BrandAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (usage: ReviewerBrandUsage) => void;
}

const contextOptions: { value: BrandUsageContext; label: string }[] = [
  { value: 'integrator_install', label: 'Instalo em projetos e obras' },
  { value: 'personal_owner', label: 'Uso pessoal / Proprietário do sistema' },
  { value: 'designer_specification', label: 'Especifico em projetos de engenharia' },
  { value: 'maintenance', label: 'Realizo manutenção técnica e suporte' },
  { value: 'reseller', label: 'Distribuo / Revendo equipamentos' },
];

export function BrandAddDialog({
  isOpen,
  onClose,
  onSuccess,
}: BrandAddDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<BrandCatalogItem | null>(null);
  const [context, setContext] = useState<BrandUsageContext>('integrator_install');
  const [experienceSince, setExperienceSince] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) {
      setErrorMessage('Selecione uma marca do catálogo oficial.');
      return;
    }

    if (isPublic && !consentConfirmed) {
      setErrorMessage('Confirme a autorização de consentimento para exibição no perfil público.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const resp = await createReviewerBrandUsage({
        brand_id: selectedBrand.id,
        usage_context: context,
        experience_since: experienceSince || undefined,
        description: description.trim() || undefined,
        visibility: isPublic ? 'public' : 'private',
        consent_confirmed: isPublic ? consentConfirmed : undefined,
        consent_version: isPublic ? 'reviewer-brands-v1' : undefined,
      });

      onSuccess(resp.data);
      handleReset();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocorreu um erro ao salvar o vínculo com a marca.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReset = () => {
    setSelectedBrand(null);
    setContext('integrator_install');
    setExperienceSince('');
    setDescription('');
    setIsPublic(false);
    setConsentConfirmed(false);
    setErrorMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-add-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="brand-add-title" className="text-sm font-bold text-slate-900">
              Vincular Marca com que Trabalho
            </h2>
            <p className="text-[11px] text-slate-500">
              Adicione fabricantes ao seu perfil profissional com contexto factual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 focus:outline-none"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Combobox de Marcas Oficiais */}
          <BrandCatalogCombobox
            value={selectedBrand}
            onSelect={setSelectedBrand}
            disabled={submitting}
          />

          {/* Contexto de Atuação */}
          <div>
            <label
              htmlFor="brand-usage-context"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Contexto de Atuação <span className="text-red-500">*</span>
            </label>
            <select
              id="brand-usage-context"
              value={context}
              onChange={(e) => setContext(e.target.value as BrandUsageContext)}
              disabled={submitting}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] bg-white text-slate-900"
            >
              {contextOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data de Início da Experiência */}
          <div>
            <label
              htmlFor="brand-experience-since"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Experiência com esta marca desde (opcional)
            </label>
            <input
              id="brand-experience-since"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={experienceSince}
              onChange={(e) => setExperienceSince(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] bg-white text-slate-900"
            />
          </div>

          {/* Descrição declarada */}
          <div>
            <label
              htmlFor="brand-usage-description"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Descrição declarada (opcional, máx 500 caracteres)
            </label>
            <textarea
              id="brand-usage-description"
              rows={2}
              maxLength={500}
              placeholder="Ex: Trabalho com inversores e módulos desta marca em instalações industriais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Opção de Visibilidade Pública com Consentimento */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  if (!e.target.checked) setConsentConfirmed(false);
                }}
                disabled={submitting}
                className="mt-0.5 rounded border-slate-300 text-[#17468D] focus:ring-[#17468D]"
              />
              <span className="text-xs text-slate-700">
                <strong className="block font-semibold">
                  Exibir esta marca no meu perfil público de Creator
                </strong>
                <span className="text-[11px] text-slate-500">
                  Por padrão, marcas vinculadas são estritamente privadas.
                </span>
              </span>
            </label>

            {isPublic && (
              <div className="mt-3 ml-6 p-2.5 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900">
                <label className="flex items-start gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    disabled={submitting}
                    className="mt-0.5 rounded border-blue-400 text-[#17468D] focus:ring-[#17468D]"
                  />
                  <span>
                    Autorizo formalmente a publicação do vínculo desta marca sob os termos de uso do Avalia Solar (versão reviewer-brands-v1).
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#17468D] hover:bg-[#12366e] rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Vínculo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
