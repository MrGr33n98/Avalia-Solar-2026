import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard de Intenção | Avalia Solar',
  description: 'Visualize leads qualificados por intenção de compra'
};

export default async function IntentDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Intenção</h1>
          <p className="text-gray-600 mt-2">
            Visualize em tempo real quais empresas estão demonstrando interesse na sua solução
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Leads Imediatos" value="4" alert />
          <KpiCard title="Leads Fervendo" value="12" trend="+3 hoje" />
          <KpiCard title="Leads Quentes" value="28" trend="+8 esta semana" />
          <KpiCard title="Baixas de Materiais" value="32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Sinalizações Recentes (Hot & Above)</h2>
            <Suspense fallback={<div>Carregando leads...</div>}>
              <HotLeadsTable />
            </Suspense>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl border p-6">
              <h3 className="font-bold mb-2">Dark Funnel Insights</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Copiaram seu telefone</span>
                  <span className="font-medium">24 vezes</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Compararam c/ concorrente</span>
                  <span className="font-medium">18 vezes</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Simularam financiamento</span>
                  <span className="font-medium">45 vezes</span>
                </li>
              </ul>
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

function KpiCard({ title, value, trend, alert }: any) {
  return (
    <div className={`p-6 rounded-xl border ${alert ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {trend && <span className="text-sm text-green-600 font-medium mb-1">{trend}</span>}
      </div>
    </div>
  );
}

function HotLeadsTable() {
  const mockLeads = [
    { id: 1, company: 'SolarEdge Tech (Via IP)', score: 92, level: '🚨 Imediato', sla: '15 min', last_action: 'Copiou telefone', time: 'Há 5 min' },
    { id: 2, company: 'Lead Anônimo #55', score: 85, level: '🌋 Fervendo', sla: '2 horas', last_action: 'Simulou 50kWp', time: 'Há 1 hora' },
    { id: 3, company: 'Weg Indústrias', score: 68, level: '🔥 Quente', sla: '24 horas', last_action: 'Baixou PDF Técnico', time: 'Há 3 horas' },
  ];

  return (
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
        {mockLeads.map(lead => (
          <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-3 font-medium text-gray-900">{lead.company}</td>
            <td className="py-3">
              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${lead.score > 80 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {lead.score} pts
              </span>
            </td>
            <td className="py-3">
              <span className="font-medium">{lead.level}</span>
              <br />
              <span className="text-xs text-gray-500">SLA: {lead.sla}</span>
            </td>
            <td className="py-3 text-gray-600">
              {lead.last_action}
              <br />
              <span className="text-xs text-gray-400">{lead.time}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
