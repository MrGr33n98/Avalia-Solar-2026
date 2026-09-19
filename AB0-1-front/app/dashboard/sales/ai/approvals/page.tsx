'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, PlayCircle, Moon } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { AIControlPlaneHeader } from '@/components/sales/ai/AIControlPlaneHeader';
import { useApprovals, ApprovalStatus, ApprovalRiskTier } from '@/lib/api/mcp/approvals';
import { cn } from '@/lib/utils';

export default function AIApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useApprovals({
    status: statusFilter || undefined,
    risk_tier: riskFilter || undefined,
    page: page,
    per_page: 20,
  });

  const approvals = response?.data || [];
  const meta = response?.meta;

  const filteredApprovals = searchTerm
    ? approvals.filter(
        (a) =>
          a.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.request_uuid.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : approvals;

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col min-h-[calc(100vh-5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <AIControlPlaneHeader />

        <div className="p-4 sm:p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por tool, agent ou UUID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="">Todos os Estados</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="executed">Executados</option>
                <option value="rejected">Rejeitados</option>
                <option value="expired">Expirados</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="">Todos os Riscos</option>
                <option value="r0">R0 (Safe Read)</option>
                <option value="r1">R1 (Analysis/Draft)</option>
                <option value="r2">R2 (Internal Write)</option>
                <option value="r3">R3 (External Mutation)</option>
                <option value="r4">R4 (Critical/Financial)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ferramenta / Tool</th>
                  <th className="py-3 px-4">Agente</th>
                  <th className="py-3 px-4">Risco</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Solicitado Em</th>
                  <th className="py-3 px-4">Expiração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Carregando aprovações...
                    </td>
                  </tr>
                )}

                {!isLoading && filteredApprovals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhuma solicitação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredApprovals.map((item) => (
                    <tr key={item.request_uuid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.tool_name}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-medium">{item.agent_id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                            item.risk_tier === 'r4' && 'bg-rose-100 text-rose-800 border-rose-200',
                            item.risk_tier === 'r3' && 'bg-orange-100 text-orange-800 border-orange-200',
                            item.risk_tier === 'r2' && 'bg-amber-100 text-amber-800 border-amber-200',
                            item.risk_tier === 'r1' && 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            item.risk_tier === 'r0' && 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {item.risk_tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                            item.status === 'approved' && 'bg-emerald-100 text-emerald-800',
                            item.status === 'executed' && 'bg-blue-100 text-blue-800',
                            item.status === 'rejected' && 'bg-rose-100 text-rose-800',
                            item.status === 'pending' && 'bg-amber-100 text-amber-800',
                            item.status === 'expired' && 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                        {item.tenant_name || (item.tenant_id ? `Tenant #${item.tenant_id}` : 'Global')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {format(new Date(item.requested_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {format(new Date(item.expires_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Mostrando {approvals.length} de {meta.total} registros
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-semibold text-slate-700">
                  {page} / {meta.total_pages}
                </span>
                <button
                  type="button"
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
