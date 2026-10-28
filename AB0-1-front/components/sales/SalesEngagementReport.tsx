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
      const res = await salesApi.getEmailEngagement(period);
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

  const metrics = data?.metrics || {
    sent: 0,
    delivered: 0,
    unique_opens: 0,
    open_rate: 0,
    unique_clicks: 0,
    click_rate: 0,
    replied: 0,
    bounces: 0,
    bounce_rate: 0,
    unsubscribed: 0,
    unsub_rate: 0,
  };

  const engagementTrend = data?.trend?.length ? data.trend : [
    { day: 'Seg', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Ter', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Qua', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Qui', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Sex', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Sáb', emails: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Dom', emails: 0, opens: 0, clicks: 0, replies: 0 },
  ];

  const channelBreakdown = data?.channels?.length ? data.channels : [];

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
                  <div className="text-2xl font-black text-slate-900">{metrics.sent}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{metrics.delivered} entregues</span>
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
                  <div className="text-2xl font-black text-slate-900">{metrics.open_rate}%</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{metrics.unique_opens} aberturas únicas</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Taxa de Cliques (CTR)</CardTitle>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">{metrics.click_rate}%</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                    <span>{metrics.unique_clicks} cliques em links</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">Respostas Recebidas</CardTitle>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-black text-slate-900">{metrics.replied}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bounce: {metrics.bounce_rate}%</span>
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
                  {channelBreakdown.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="180px">
                        <PieChart>
                          <Pie data={channelBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                            {channelBreakdown.map((entry: { name: string; value: number; color: string }, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 w-full mt-2 text-[11px]">
                        {channelBreakdown.map((item: { name: string; value: number; color: string }) => (
                          <div key={item.name} className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600 font-medium truncate">{item.name} ({item.value}%)</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <p className="text-xs font-semibold text-slate-700">Sem dados de canais</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Nenhuma atividade ou envio registrado para este período.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
