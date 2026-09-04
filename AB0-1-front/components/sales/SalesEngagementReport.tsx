'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  MousePointerClick,
  Phone,
  RotateCw,
  Send,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
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

export default function SalesEngagementReport() {
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

  const engagementTrend = [
    { day: 'Seg', emails: 45, calls: 28, whatsapp: 34 },
    { day: 'Ter', emails: 62, calls: 35, whatsapp: 48 },
    { day: 'Qua', emails: 78, calls: 42, whatsapp: 56 },
    { day: 'Qui', emails: 54, calls: 31, whatsapp: 40 },
    { day: 'Sex', emails: 89, calls: 49, whatsapp: 65 },
    { day: 'Sáb', emails: 15, calls: 8, whatsapp: 12 },
    { day: 'Dom', emails: 9, calls: 3, whatsapp: 6 },
  ];

  const channelBreakdown = [
    { name: 'E-mail Comercial', value: 42, color: '#3b82f6' },
    { name: 'WhatsApp B2B', value: 33, color: '#10b981' },
    { name: 'Ligações / Call', value: 18, color: '#f59e0b' },
    { name: 'Reunião Presencial', value: 7, color: '#8b5cf6' },
  ];

  return (
    <SalesLayoutWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-sky-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Relatório de Engajamento & Outreach</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Análise de interação multicanal (E-mails SES, WhatsApp, Chamadas e Reuniões) com compradores solares.
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
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-600" />
            <p className="text-xs font-semibold">Carregando métricas de engajamento...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">E-mails Enviados</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Send className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">352</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+14.2% este mês</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Taxa de Abertura (Opens)</CardTitle>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Eye className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">48.6%</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Benchmark Solar: 32%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Interações WhatsApp</CardTitle>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">213</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                    <span>94.2% resposta em &lt;2h</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Ligações Registradas</CardTitle>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Phone className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">197</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>82% conectadas</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Area Chart */}
              <Card className="lg:col-span-2 border-slate-200 shadow-xs">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">Volume de Atividades Diárias</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Distribuição semanal de contatos por canal comercial.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="emails" name="E-mails" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="calls" name="Ligações" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">Mix de Canais</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Proporção de uso por canal de contato.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4 flex flex-col items-center justify-center h-72">
                  <ResponsiveContainer width="100%" height="180px">
                    <PieChart>
                      <Pie data={channelBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                        {channelBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full mt-2 text-[11px]">
                    {channelBreakdown.map((item) => (
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
