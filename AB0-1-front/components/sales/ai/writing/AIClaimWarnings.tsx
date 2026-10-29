'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { CrmAiWarning } from '@/lib/api/sales/aiTypes';

interface AIClaimWarningsProps {
  warnings: CrmAiWarning[];
  missingFields?: string[];
}

export default function AIClaimWarnings({ warnings, missingFields = [] }: AIClaimWarningsProps) {
  if ((!warnings || warnings.length === 0) && (!missingFields || missingFields.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      {warnings.map((w, idx) => (
        <div
          key={`${w.code}_${idx}`}
          className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
            w.severity === 'warning' || w.severity === 'error'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          {w.severity === 'warning' || w.severity === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-semibold mr-1">[{w.code}]</span>
            <span>{w.message}</span>
          </div>
        </div>
      ))}

      {missingFields.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Campos ausentes no registro CRM (mantidos como variáveis dinâmicas se aplicável):{' '}
            <code className="text-slate-800">{missingFields.join(', ')}</code>
          </span>
        </div>
      )}
    </div>
  );
}

