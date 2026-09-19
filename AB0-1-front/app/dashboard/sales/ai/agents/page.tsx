'use client';

import { Bot, Key, Shield, CheckCircle2, Lock } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { AIControlPlaneHeader } from '@/components/sales/ai/AIControlPlaneHeader';

export default function AIAgentsPage() {
  const agents = [
    {
      id: 'agent:engineering:primary',
      name: 'Engineering Governance & Platform Agent',
      type: 'Engineering / Platform Core',
      version: '1.0.0',
      riskTierMax: 'R4',
      allowedTools: 'Todas as ferramentas (Full Spectrum)',
      scopes: ['mcp:read', 'mcp:analyze', 'mcp:write', 'mcp:admin', 'mcp:external_mutate', 'mcp:admin:critical'],
      status: 'Active',
    },
    {
      id: 'agent:hermes:outbound',
      name: 'Hermes Outbound Growth Agent',
      type: 'Growth / Outbound',
      version: '1.0.0',
      riskTierMax: 'R1',
      allowedTools: 'search_companies, search_products, get_company_profile, compare_companies, get_reviews_summary, recommend_next_actions',
      scopes: ['mcp:read', 'mcp:analyze'],
      status: 'Active',
    },
    {
      id: 'agent:support:triage',
      name: 'Support & Moderation Triage Agent',
      type: 'Support / Operations',
      version: '1.0.0',
      riskTierMax: 'R2',
      allowedTools: 'search_companies, get_company_profile, get_reviews_summary, create_review_request, get_leads_summary',
      scopes: ['mcp:read', 'mcp:write'],
      status: 'Active',
    },
    {
      id: 'agent:observability:primary',
      name: 'Observability & Performance Primary Agent',
      type: 'SRE / Observability',
      version: '1.0.0',
      riskTierMax: 'R0',
      allowedTools: 'diagnose_performance, get_system_health, get_outbox_health, get_postgres_health, get_redis_health, get_sidekiq_health',
      scopes: ['mcp:read', 'mcp:admin'],
      status: 'Active',
    },
  ];

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col min-h-[calc(100vh-5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <AIControlPlaneHeader />

        <div className="p-4 sm:p-6 space-y-6">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
            <Bot className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-purple-950">Catálogo de Identidades de Agentes (AgentIdentity)</h4>
              <p className="mt-0.5 text-purple-800">
                Identidades autorizadas pelo MCP Platform Core com autenticação server-side anti-spoofing, limites estritos de risco e isolamento de tenant.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((ag) => (
              <div
                key={ag.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors space-y-3.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ag.name}</h3>
                      <p className="font-mono text-xs text-indigo-600 font-semibold">{ag.id}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                    {ag.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo:</span>
                    <span className="font-medium text-slate-800">{ag.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teto de Risco:</span>
                    <span className="font-bold text-indigo-900 font-mono">{ag.riskTierMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Versão:</span>
                    <span className="font-mono text-slate-700">{ag.version}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-500 block font-semibold text-[11px]">Escopos Autorizados:</span>
                  <div className="flex flex-wrap gap-1">
                    {ag.scopes.map((sc) => (
                      <span
                        key={sc}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]"
                      >
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
