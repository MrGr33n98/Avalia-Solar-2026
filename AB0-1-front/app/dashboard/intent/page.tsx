import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard de Intenção | Avalia Solar',
  description: 'Visualize leads qualificados por intenção de compra',
};

/**
 * AVISO DE DESENVOLVIMENTO (REQ-002):
 * Esta página está em desenvolvimento (FASE 2). Os dados exibidos são ILUSTRATIVOS —
 * não representam sinais reais da sua empresa. Conexão com API real será implementada
 * na próxima sprint. Veja PDR AS-DATA-INTEGRITY REQ-002.
 */

export default async function IntentDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Banner de Disclaimer — REQ-002 */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Esta visualização está em desenvolvimento</p>
            <p className="text-sm mt-1 text-amber-700">
              Os dados exibidos abaixo são <strong>ilustrativos</strong> e não representam sinais reais
              da sua empresa. O módulo de Inteligência de Intenção está previsto para a FASE 2.
            </p>
          </div>
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Intenção</h1>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              Em breve
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            Visualize em tempo real quais empresas estão demonstrando interesse na sua solução
          </p>
        </header>

        {/* KPIs — marcados como ilustrativos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Leads Imediatos" value="4" alert illustrative />
          <KpiCard title="Leads Fervendo" value="12" trend="+3 hoje" illustrative />
          <KpiCard title="Leads Quentes" value="28" trend="+8 esta semana" illustrative />
          <KpiCard title="Baixas de Materiais" value="32" illustrative />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Sinalizações Recentes (Hot &amp; Above)</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Ilustrativo
              </span>
            </div>
            <Suspense fallback={<div>Carregando leads...</div>}>
              <HotLeadsTable />
            </Suspense>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl border p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Dark Funnel Insights</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  Ilustrativo
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Copiaram seu telefone</span>
                  <span className="font-medium text-gray-400">— dados indisponíveis</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Compararam c/ concorrente</span>
                  <span className="font-medium text-gray-400">— dados indisponíveis</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Simularam financiamento</span>
                  <span className="font-medium text-gray-400">— dados indisponíveis</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                Disponível na FASE 2 — integração com eventos de intenção em tempo real.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Desbloqueie o Radar Completo</h3>
              <p className="text-blue-100 text-sm mb-4">
                Veja exatamente QUAIS empresas estão gerando estes sinais fazendo upgrade para o PRO.
              </p>
              <button className="w-full bg-white text-blue-800 font-bold py-2 rounded shadow hover:bg-gray-50">
                Ver Planos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  trend,
  alert,
  illustrative,
}: {
  title: string;
  value: string;
  trend?: string;
  alert?: boolean;
  illustrative?: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border relative ${alert ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
      {illustrative && (
        <span className="absolute top-2 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
          Ilustrativo
        </span>
      )}
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-300">{value}</span>
        {trend && <span className="text-sm text-gray-300 font-medium mb-1">{trend}</span>}
      </div>
    </div>
  );
}

function HotLeadsTable() {
  // Dados ilustrativos — REQ-002: não são sinais reais.
  // TODO FASE 2: substituir por chamada a /api/v1/company_dashboard/intent_signals
  const illustrativeLeads = [
    {
      id: 1,
      company: 'Empresa Exemplo A',
      score: 92,
      level: '🚨 Imediato',
      sla: '15 min',
      last_action: 'Exemplo de sinal',
      time: 'Ilustrativo',
    },
    {
      id: 2,
      company: 'Empresa Exemplo B',
      score: 85,
      level: '🌋 Fervendo',
      sla: '2 horas',
      last_action: 'Exemplo de sinal',
      time: 'Ilustrativo',
    },
    {
      id: 3,
      company: 'Empresa Exemplo C',
      score: 68,
      level: '🔥 Quente',
      sla: '24 horas',
      last_action: 'Exemplo de sinal',
      time: 'Ilustrativo',
    },
  ];

  return (
    <>
      <p className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        ⚠️ Empresas e sinais abaixo são <strong>exemplos ilustrativos</strong>. Dados reais disponíveis na FASE 2.
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-400 border-b">
            <th className="pb-3 font-medium">Lead / Empresa</th>
            <th className="pb-3 font-medium">Score</th>
            <th className="pb-3 font-medium">Status (SLA)</th>
            <th className="pb-3 font-medium">Último Sinal</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {illustrativeLeads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors opacity-60">
              <td className="py-3 font-medium text-gray-500">{lead.company}</td>
              <td className="py-3">
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                    lead.score > 80
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {lead.score} pts
                </span>
              </td>
              <td className="py-3">
                <span className="font-medium text-gray-400">{lead.level}</span>
                <br />
                <span className="text-xs text-gray-400">SLA: {lead.sla}</span>
              </td>
              <td className="py-3 text-gray-400">
                {lead.last_action}
                <br />
                <span className="text-xs text-gray-300">{lead.time}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
