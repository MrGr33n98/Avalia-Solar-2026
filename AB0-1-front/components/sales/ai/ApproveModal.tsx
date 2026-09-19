'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApprovalRequest } from '@/lib/api/mcp/approvals';

interface ApproveModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (uuid: string) => Promise<void>;
  isApproving: boolean;
}

export function ApproveModal({
  request,
  isOpen,
  onClose,
  onConfirm,
  isApproving,
}: ApproveModalProps) {
  const [criticalConfirmation, setCriticalConfirmation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const isR4 = request.risk_tier === 'r4';

  const handleApprove = async () => {
    if (isR4 && !criticalConfirmation) {
      setErrorMsg('Confirmação obrigatória para ações de risco crítico (R4).');
      return;
    }

    try {
      setErrorMsg(null);
      await onConfirm(request.request_uuid);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao aprovar solicitação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Aprovar Ação do Agente</h3>
              <p className="text-xs text-slate-500">Revisão e liberação de execução</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ferramenta:</span>
              <span className="font-mono font-bold text-slate-900">{request.tool_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Agente:</span>
              <span className="font-mono text-indigo-700 font-semibold">{request.agent_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nível de Risco:</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                  isR4 ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'
                )}
              >
                {request.risk_tier.toUpperCase()}
              </span>
            </div>
          </div>

          {isR4 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Atenção: Ação de Risco Crítico (R4)</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Esta ação pode envolver transações financeiras, concessão de permissões de alto nível ou mutações
                irreversíveis. Certifique-se de que revisou todos os parâmetros.
              </p>

              <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={criticalConfirmation}
                  onChange={(e) => setCriticalConfirmation(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-[11px] font-semibold text-rose-900">
                  Eu confirmo a execução e autorizo a liberação desta mutação crítica.
                </span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isApproving || (isR4 && !criticalConfirmation)}
            onClick={handleApprove}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isApproving ? 'Aprovando...' : 'Confirmar Aprovação'}
          </button>
        </div>
      </div>
    </div>
  );
}
