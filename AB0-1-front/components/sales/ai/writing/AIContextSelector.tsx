'use client';

import React from 'react';
import { Building2, Briefcase, User } from 'lucide-react';

interface AIContextSelectorProps {
  contactId?: number | null;
  contactLabel?: string | null;
  accountId?: number | null;
  accountLabel?: string | null;
  opportunityId?: number | null;
  opportunityLabel?: string | null;
  sourcesUsed?: string[];
}

export default function AIContextSelector({
  contactId,
  contactLabel,
  accountId,
  accountLabel,
  opportunityId,
  opportunityLabel,
  sourcesUsed = [],
}: AIContextSelectorProps) {
  const hasAny = Boolean(contactId || accountId || opportunityId || sourcesUsed.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-slate-500 font-medium">Contexto CRM verificado:</span>
      {contactId && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <User className="w-3 h-3" />
          {contactLabel || `Contato #${contactId}`}
        </span>
      )}
      {accountId && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Building2 className="w-3 h-3" />
          {accountLabel || `Conta #${accountId}`}
        </span>
      )}
      {opportunityId && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Briefcase className="w-3 h-3" />
          {opportunityLabel || `Oportunidade #${opportunityId}`}
        </span>
      )}
      {!hasAny && (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          Sem registro específico (usando placeholders canônicos)
        </span>
      )}
    </div>
  );
}

