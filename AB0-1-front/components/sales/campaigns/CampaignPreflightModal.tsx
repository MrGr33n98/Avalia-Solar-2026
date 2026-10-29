'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPreflight, PreflightItem } from '@/lib/api-campaigns';

interface CampaignPreflightModalProps {
  open: boolean;
  campaignId: number | null;
  campaignName?: string;
  onClose: () => void;
  onConfirmDispatch: (id: number) => Promise<void>;
}

export default function CampaignPreflightModal({
  open,
  campaignId,
  campaignName = 'Campanha',
  onClose,
  onConfirmDispatch,
}: CampaignPreflightModalProps) {
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preflightData, setPreflightData] = useState<{
    ready: boolean;
    blockers: PreflightItem[];
    warnings: PreflightItem[];
    qa_audit?: {
      checked: boolean;
      findings_count: number;
      findings: Array<{ code: string; message: string; severity?: string }>;
    };
    audience?: { estimated_count: number };
    sender?: { sender_name: string; from_email: string };
  } | null>(null);

  useEffect(() => {
    if (open && campaignId) {
      setLoading(true);
      setError(null);
      fetchPreflight(campaignId)
        .then((res) => {
          setPreflightData(res.preflight as unknown as NonNullable<typeof preflightData>);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Falha ao executar preflight da campanha.';
          setError(msg);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPreflightData(null);
      setError(null);
    }
  }, [open, campaignId]);

  if (!open || !campaignId) return null;

  const handleConfirm = async () => {
    setDispatching(true);
    setError(null);
    try {
      await onConfirmDispatch(campaignId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao disparar campanha.';
      setError(msg);
    } finally {
      setDispatching(false);
    }
  };

  const isReady = preflightData?.ready && (!preflightData.blockers || preflightData.blockers.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl bg-background rounded-xl shadow-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Auditoria Pré-Envio (Preflight QA)
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-sm">
                {campaignName} (#{campaignId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={dispatching}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span>Auditando templates, variáveis dinâmicas e destinatários...</span>
          </div>
        ) : preflightData ? (
          <div className="space-y-4 text-xs">
            {/* Status Gate */}
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                isReady
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {isReady ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-semibold text-sm">
                  {isReady ? 'Campanha pronta para disparo' : 'Bloqueios detectados no Preflight'}
                </span>
              </div>
              {preflightData.audience && (
                <span className="text-xs font-mono font-medium">
                  {preflightData.audience.estimated_count} contatos estimados
                </span>
              )}
            </div>

            {/* Blockers */}
            {preflightData.blockers && preflightData.blockers.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-rose-700 block text-[11px] uppercase tracking-wider">
                  Bloqueadores ({preflightData.blockers.length})
                </span>
                {preflightData.blockers.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold mr-1">[{b.code}]</span>
                      <span>{b.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {preflightData.warnings && preflightData.warnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-amber-700 block text-[11px] uppercase tracking-wider">
                  Avisos de Qualidade & Variáveis ({preflightData.warnings.length})
                </span>
                {preflightData.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold mr-1">[{w.code}]</span>
                      <span>{w.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QA Content Audit */}
            {preflightData.qa_audit?.checked && (
              <div className="p-3 bg-muted/30 border rounded-lg space-y-1">
                <div className="flex items-center justify-between font-semibold text-foreground text-[11px]">
                  <span>Auditor de Conteúdo & Alegações</span>
                  <span className="text-muted-foreground">
                    {preflightData.qa_audit.findings_count === 0
                      ? 'Nenhuma discrepância encontrada'
                      : `${preflightData.qa_audit.findings_count} apontamento(s)`}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Verificou variáveis no template, URLs externas e promessas comerciais.
                </p>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
              <strong className="block text-slate-800">Controle Comercial Humano:</strong>
              O disparo enfileira e-mails no servidor de envio corporativo. Uma vez iniciado, você pode pausar a campanha a qualquer momento.
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={dispatching}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!isReady || dispatching || loading}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            {dispatching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            {dispatching ? 'Iniciando Disparo...' : 'Confirmar Disparo'}
          </Button>
        </div>
      </div>
    </div>
  );
}

