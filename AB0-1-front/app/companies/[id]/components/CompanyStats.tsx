import { motion } from 'framer-motion';
import DashboardStats from '@/components/DashboardStats';
import { Company } from '@/lib/api';
import { ReviewAnalytics, TrafficSource, HistoricalData, CompanyAnalyticsSettings } from '@/lib/api-analytics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface CompanyStatsProps {
  company: Company;
  companyStats: {
    reviewCount: number;
    rating: number;
    productCount: number;
    recentViews?: number;
    responseRate?: number;
  };
  reviewAnalytics?: ReviewAnalytics;
  trafficSources?: TrafficSource[];
  historicalData?: HistoricalData[];
  analyticsSettings?: CompanyAnalyticsSettings;
}

export default function CompanyStats({ company, companyStats, reviewAnalytics, trafficSources, historicalData, analyticsSettings }: CompanyStatsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-semibold mb-6">Desempenho da Empresa</h3>
      <DashboardStats 
        reviewsCount={companyStats.reviewCount}
        averageRating={companyStats.rating}
        productsCount={companyStats.productCount}
        leadsCount={companyStats.recentViews ?? 0}
        activeCampaigns={companyStats.responseRate ?? 0}
        companiesCount={1}
        monthlyRevenue={0}
      />

      {analyticsSettings?.public_visibility?.response_time_public && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm bg-muted/5">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Tempo de Resposta (faixa pública)</h4>
            <Badge variant="outline">Calculado</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            {analyticsSettings.public_visibility.response_band === '1h' && 'até 1h'}
            {analyticsSettings.public_visibility.response_band === '4h' && 'até 4h'}
            {analyticsSettings.public_visibility.response_band === '24h' && 'até 24h'}
            {analyticsSettings.public_visibility.response_band === '48h' && 'até 48h'}
            {analyticsSettings.public_visibility.response_band === '48h_plus' && '≥ 48h'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Distribuição de Avaliações</h4>
            <Badge variant="secondary">Verificado</Badge>
          </div>
          {reviewAnalytics ? (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={([5,4,3,2,1] as const).map((star) => ({
                      rating: `${star}★`,
                      count: reviewAnalytics.rating_distribution[star] || 0,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Avaliações" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {([5,4,3,2,1] as const).map((star) => {
                  const count = reviewAnalytics.rating_distribution[star] || 0;
                  const total = reviewAnalytics.total_reviews || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-6 text-sm font-medium">{star}★</span>
                      <div className="flex-1 h-2 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-sm text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados de avaliações</p>
          )}
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm bg-muted/5">
          <h4 className="text-lg font-semibold mb-4">Fontes de Tráfego</h4>
          {trafficSources && trafficSources.length > 0 ? (
            <div className="space-y-3">
              {trafficSources.slice(0,6).map((src) => (
                <div key={src.source} className="flex items-center justify-between">
                  <span className="text-sm">{src.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{src.visits}</span>
                    <span className="text-sm font-medium">{src.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados de tráfego</p>
          )}
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border border-border shadow-sm bg-muted/5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Série Histórica (30 dias)</h4>
          <Badge variant="outline">Calculado</Badge>
        </div>
        {historicalData && historicalData.length > 0 ? (
          <div className="space-y-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Visitas" />
                  <Line type="monotone" dataKey="clicks" stroke="#10b981" name="Cliques" />
                  <Line type="monotone" dataKey="leads" stroke="#f59e0b" name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 pr-4">Data</th>
                    <th className="text-right py-2 pr-4">Visitas</th>
                    <th className="text-right py-2 pr-4">Cliques</th>
                    <th className="text-right py-2">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.slice(-7).map((row) => (
                    <tr key={row.date} className="border-t border-border/50">
                      <td className="py-2 pr-4">{row.date}</td>
                      <td className="py-2 pr-4 text-right">{row.views}</td>
                      <td className="py-2 pr-4 text-right">{row.clicks}</td>
                      <td className="py-2 text-right">{row.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Sem dados históricos</p>
        )}
      </div>
    </div>
  );
}
