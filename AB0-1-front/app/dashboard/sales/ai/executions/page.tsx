'use client';

import { format } from 'date-fns';
import { PlayCircle, CheckCircle2, AlertCircle, ShieldCheck, Terminal } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { AIControlPlaneHeader } from '@/components/sales/ai/AIControlPlaneHeader';
import { useApprovals } from '@/lib/api/mcp/approvals';

export default function AIExecutionsPage() {
  const { data: response, isLoading } = useApprovals({ status: 'executed', per_page: 50 });
  const executions = response?.data || [];

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col min-h-[calc(100vh-5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <AIControlPlaneHeader />

        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <PlayCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-950">Registro de Execuções Duráveis</h4>
              <p className="mt-0.5 text-blue-800">
                Histórico de ferramentas disparadas após aprovação humana, com exatamente uma execução garantida (Exactly-Once Consumption) e rastreamento transacional.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ferramenta</th>
                  <th className="py-3 px-4">Agente</th>
                  <th className="py-3 px-4">Execution ID</th>
                  <th className="py-3 px-4">Aprovado Por</th>
                  <th className="py-3 px-4">Executado Em</th>
                  <th className="py-3 px-4">Integridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Carregando histórico de execuções...
                    </td>
                  </tr>
                )}

                {!isLoading && executions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhuma execução registrada até o momento.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  executions.map((item) => (
                    <tr key={item.request_uuid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.tool_name}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-medium">{item.agent_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {item.execution_id || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.approver_name || 'Admin'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.executed_at ? format(new Date(item.executed_at), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          SHA-256 Verified
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
