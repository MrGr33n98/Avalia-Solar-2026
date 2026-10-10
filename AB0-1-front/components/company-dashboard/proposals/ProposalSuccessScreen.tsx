'use client';

import React from 'react';
import { CheckCircle2, Eye, Mail, ArrowLeft } from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';

interface ProposalSuccessScreenProps {
  proposal: MarketplaceProposal;
  onViewProposal: () => void;
  onBackToList: () => void;
}

export function ProposalSuccessScreen({
  proposal,
  onViewProposal,
  onBackToList,
}: ProposalSuccessScreenProps) {
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSendEmail = () => {
    setEmailSent(true);
  };

  return (
    <div className="flex min-h-[540px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 text-center shadow-sm">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
        Proposta publicada com sucesso!
      </h2>

      <p className="mt-3 max-w-md text-sm text-slate-600 leading-relaxed">
        A proposta <strong className="text-slate-900">{proposal.reference}</strong> foi enviada para o
        cliente <strong className="text-slate-900">{proposal.lead?.name || ''}</strong> e já está
        disponível para acompanhamento no histórico.
      </p>

      {emailSent && (
        <p className="mt-3 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
          Notificação encaminhada com sucesso para o e-mail do cliente!
        </p>
      )}

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={onViewProposal}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Eye className="h-4 w-4" />
          Ver proposta
        </button>

        <button
          type="button"
          onClick={handleSendEmail}
          disabled={emailSent}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {emailSent ? 'E-mail enviado' : 'Enviar por e-mail'}
        </button>

        <button
          type="button"
          onClick={onBackToList}
          className="flex min-h-11 w-full items-center justify-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para propostas
        </button>
      </div>
    </div>
  );
}
