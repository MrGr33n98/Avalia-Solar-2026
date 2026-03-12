import { useCompanyDashboard } from '@/app/dashboard/hooks/useCompanyDashboard'
import RealtimeKPICard from './RealtimeKPICard'
import { Card } from '@/components/ui/card'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'

function toChartData(points: { t: number; value: number }[]) {
  return points.map((p) => ({ t: new Date(p.t).toLocaleTimeString(), value: p.value }))
}

export default function RealtimeDashboard({ companyId }: { companyId: number }) {
  const { kpis, series, status } = useCompanyDashboard(companyId)

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/40">Status: {status}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <RealtimeKPICard title="Eventos" value={kpis.events_count} />
        <RealtimeKPICard title="Orçamentos" value={kpis.quote_clicks} />
        <RealtimeKPICard title="WhatsApp" value={kpis.whatsapp_clicks} />
        <RealtimeKPICard title="Avaliações" value={kpis.reviews_count} />
        <RealtimeKPICard title="Média de Nota" value={kpis.average_rating?.toFixed?.(2) ?? kpis.average_rating} />
        <RealtimeKPICard title="Qtd. Notas" value={kpis.rating_count} />
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Eventos por tempo (tempo real)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={toChartData(series.events)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} name="Eventos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Clicks por tipo</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Orçamentos', value: kpis.quote_clicks },
              { name: 'WhatsApp', value: kpis.whatsapp_clicks },
              { name: 'Avaliações', value: kpis.reviews_count },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Eventos recentes</div>
        <ScrollArea className="h-48">
          <ul className="space-y-1">
            {series.events.slice(-20).map((p, i) => (
              <li key={i} className="text-xs text-white/40 flex justify-between">
                <span>{new Date(p.t).toLocaleString()}</span>
                <span>+{p.value}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>
    </div>
  )
}

