'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Building,
  CheckCircle2,
  Compass,
  DollarSign,
  Filter,
  Globe,
  Loader2,
  PieChart as PieIcon,
  RotateCw,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesApi } from '@/lib/api/sales/client';

export default function SalesMarketingReport() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesApi.getAnalytics(period);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const leadSources = [
    { name: 'Portal Avalia Solar B2B', leads: 148, won: 32, conversion: '21.6%', color: '#3b82f6' },
    { name: 'Google Ads (Search)', leads: 95, won: 18, conversion: '18.9%', color: '#ea4335' },
    { name: 'Inbound Organic / SEO', leads: 82, won: 22, conversion: '26.8%', color: '#34a853' },
    { name: 'LinkedIn Sales Nav', leads: 54, won: 11, conversion: '20.3%', color: '#0a66c2' },
    { name: 'Outreach Ativo / Hermes', leads: 41, won: 9, conversion: '21.9%', color: '#f59e0b' },
  ];

  const segmentDistribution = [
    { name: 'Integradores EPC / Instaladores', value: 45, color: '#3b82f6' },
    { name: 'Fabricantes / Distribuição', value: 25, color: '#10b981' },
    { name: 'Comercial & Industrial (C&I)', value: 20, color: '#f59e0b' },
    { name: 'Usinas de Geração Distribuída', value: 10, color: '#8b5cf6' },
  ];

  return (
    <SalesLayoutWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Marketing & Atribuição de Leads</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Origem de leads, canais de aquisição B2B solar e eficiência de conversão por segmento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 h-9 text-xs border-slate-300 bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-9 text-xs border-slate-300 gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
            <p className="text-xs font-semibold">Carregando dados de marketing & inteligência...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Total de Leads Qualificados</CardTitle>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">420</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+22.4% este mês</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Custo de Aquisição (CAC)</CardTitle>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">R$ 148</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>-12% vs. trimestre anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Conversão de Lead &gt; Cliente</CardTitle>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Target className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">21.9%</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                    <span>Média mercado: 14%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Segmento Principal</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Building className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-lg font-black text-slate-900 truncate">Integradores EPC</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                    <span>45% do volume de entradas</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart Lead Sources */}
              <Card className="lg:col-span-2 border-slate-200 shadow-xs">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">Origem & Conversão por Canal</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Volume de leads gerados e fechamentos confirmados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadSources} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" tickLine={false} tick={{ fontSize: 11, fill: '#334155' }} width={140} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="leads" name="Leads Entrada" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                      <Bar dataKey="won" name="Negócios Ganhos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Segment Pie Chart */}
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">Distribuição Solar</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Perfil das empresas que entram no funil.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4 flex flex-col items-center justify-center h-72">
                  <ResponsiveContainer width="100%" height="180px">
                    <PieChart>
                      <Pie data={segmentDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                        {segmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full mt-2 text-[11px]">
                    {segmentDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 font-medium truncate">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
