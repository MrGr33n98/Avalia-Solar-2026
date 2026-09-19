'use client';

import { Activity, ShieldCheck, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { AIControlPlaneHeader } from '@/components/sales/ai/AIControlPlaneHeader';
import { useApprovals } from '@/lib/api/mcp/approvals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AIActivityPage() {
  const { data: response, isLoading } = useApprovals({ per_page: 30 });
  const approvals = response?.data || [];

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col min-h-[calc(100vh-5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <AIControlPlaneHeader />

        <div className="p-4 sm:p-6 space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-3">
            <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900">Feed de Atividade e Auditoria de Governança</h4>
              <p className="mt-0.5 text-slate-600">
                Log cronológico de todas as solicitações, decisões e execuções registradas pelo Control Plane com integridade criptográfica.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            {isLoading && <p className="text-xs text-slate-400 py-4">Carregando atividades...</p>}

            {!isLoading && approvals.length === 0 && (
              <p className="text-xs text-slate-400 py-4">Nenhuma atividade registrada.</p>
            )}

            {!isLoading && (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {approvals.map((req) => (
                  <div key={req.request_uuid} className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{req.tool_name}</span>
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Agente <strong className="font-mono text-indigo-700">{req.agent_id}</strong> requisitou ação com
                      risco <strong className="uppercase">{req.risk_tier}</strong> (Status atual:{' '}
                      <strong className="uppercase font-bold">{req.status}</strong>).
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono">
                      <span>UUID: {req.request_uuid}</span>
                      <span>SHA-256: {req.payload_digest.slice(0, 12)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
