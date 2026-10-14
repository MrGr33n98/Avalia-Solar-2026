'use client';

import React from 'react';
import { Pencil, CheckCircle2, ShieldCheck } from 'lucide-react';
import { type WizardFormState, type WizardCompany } from './types';

interface QuoteStepReviewProps {
  form: WizardFormState;
  preferredCompany: WizardCompany | null;
  onGoToStep: (stepNumber: number) => void;
}

export function QuoteStepReview({
  form,
  preferredCompany,
  onGoToStep,
}: QuoteStepReviewProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-3.5 space-y-3">
        {/* Bloco 1: Solução & Perfil */}
        <div className="flex items-start justify-between border-b border-slate-200/60 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Solução & Projeto
            </span>
            <p className="text-xs font-bold text-slate-900">
              {form.productVertical} • {form.projectProfile}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 p-1 rounded-md transition-colors"
            title="Editar solução e projeto"
          >
            <Pencil className="h-3 w-3" />
            <span>Editar</span>
          </button>
        </div>

        {/* Bloco 2: Detalhes & Localização */}
        <div className="flex items-start justify-between border-b border-slate-200/60 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Detalhes & Local
            </span>
            <p className="text-xs font-bold text-slate-900">
              {form.billValue || 'Não especificado'} • {form.decisionTimeline}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {[form.city, form.state].filter(Boolean).join(', ') || form.zipcode || 'Local não informado'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 p-1 rounded-md transition-colors"
            title="Editar detalhes do projeto"
          >
            <Pencil className="h-3 w-3" />
            <span>Editar</span>
          </button>
        </div>

        {/* Bloco 3: Contato */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Solicitante
            </span>
            <p className="text-xs font-bold text-slate-900">
              {form.fullName}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {form.phone} • {form.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 p-1 rounded-md transition-colors"
            title="Editar dados de contato"
          >
            <Pencil className="h-3 w-3" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Nota de Segurança e Destinatário */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 flex items-center gap-2 text-emerald-900 text-xs">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-[11px] font-medium leading-tight">
          {preferredCompany
            ? `Sua solicitação será enviada com prioridade para ${preferredCompany.name}.`
            : 'Sua solicitação será distribuída para empresas credenciadas da sua região.'}
        </span>
      </div>
    </div>
  );
}
