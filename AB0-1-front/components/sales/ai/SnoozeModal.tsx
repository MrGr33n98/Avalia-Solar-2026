'use client';

import { useState } from 'react';
import { addHours, setHours, setMinutes, addDays } from 'date-fns';
import { Moon, Clock, X } from 'lucide-react';
import { ApprovalRequest } from '@/lib/api/mcp/approvals';

interface SnoozeModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (uuid: string, until: string, reason?: string) => Promise<void>;
  isSnoozing: boolean;
}

export function SnoozeModal({
  request,
  isOpen,
  onClose,
  onConfirm,
  isSnoozing,
}: SnoozeModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('1h');
  const [customDateTime, setCustomDateTime] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const calculateUntilTime = (): Date => {
    const now = new Date();
    switch (selectedPreset) {
      case '1h':
        return addHours(now, 1);
      case '3h':
        return addHours(now, 3);
      case 'later_today':
        return setMinutes(setHours(now, 18), 0);
      case 'tomorrow':
        return setMinutes(setHours(addDays(now, 1), 9), 0);
      case 'custom':
        return customDateTime ? new Date(customDateTime) : addHours(now, 1);
      default:
        return addHours(now, 1);
    }
  };

  const handleSnooze = async () => {
    try {
      setErrorMsg(null);
      const untilDate = calculateUntilTime();

      if (untilDate <= new Date()) {
        setErrorMsg('O horário de adiamento deve ser no futuro.');
        return;
      }

      await onConfirm(request.request_uuid, untilDate.toISOString(), reason.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adiar solicitação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Adiar Ação (Snooze)</h3>
              <p className="text-xs text-slate-500">Ocultar temporariamente da fila pendente</p>
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
            Adiar oculta a solicitação da fila principal até o momento escolhido. O tempo limite original de expiração
            (TTL) <strong>não</strong> é estendido.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '1h', label: 'Em 1 hora' },
              { id: '3h', label: 'Em 3 horas' },
              { id: 'later_today', label: 'Fim do dia (18:00)' },
              { id: 'tomorrow', label: 'Amanhã (09:00)' },
              { id: 'custom', label: 'Personalizado' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPreset(opt.id)}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  selectedPreset === opt.id
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {selectedPreset === 'custom' && (
            <div className="space-y-1">
              <label htmlFor="custom-datetime" className="font-semibold text-slate-700 block">Data e Hora:</label>
              <input
                id="custom-datetime"
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="snooze-reason" className="font-semibold text-slate-700 block">Motivo (Opcional):</label>
            <input
              id="snooze-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Aguardando retorno da reunião com o diretor..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder:text-slate-400"
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
            disabled={isSnoozing}
            onClick={handleSnooze}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            {isSnoozing ? 'Adiado...' : 'Confirmar Snooze'}
          </button>
        </div>
      </div>
    </div>
  );
}
