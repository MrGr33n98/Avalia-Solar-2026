'use client';

import { useState } from 'react';
import { XCircle, X } from 'lucide-react';
import { ApprovalRequest } from '@/lib/api/mcp/approvals';

interface RejectModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (uuid: string, reason?: string) => Promise<void>;
  isRejecting: boolean;
}

export function RejectModal({
  request,
  isOpen,
  onClose,
  onConfirm,
  isRejecting,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleReject = async () => {
    try {
      setErrorMsg(null);
      await onConfirm(request.request_uuid, reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao rejeitar solicitação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rejeitar Ação do Agente</h3>
              <p className="text-xs text-slate-500">Bloqueio explícito de execução</p>
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
          <p className="text-slate-600">
            A solicitação para executar <strong className="text-slate-900 font-mono">{request.tool_name}</strong> pelo
            agente <strong className="text-indigo-700 font-mono">{request.agent_id}</strong> será marcada como
            rejeitada e arquivada para fins de auditoria.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="font-semibold text-slate-700 block">Motivo da Rejeição (Opcional):</label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Parâmetros inconsistentes, solicitação não alinhada com o cliente..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

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
            disabled={isRejecting}
            onClick={handleReject}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            {isRejecting ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </button>
        </div>
      </div>
    </div>
  );
}
