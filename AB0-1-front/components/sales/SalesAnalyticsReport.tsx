'use client';

import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  Filter,
  PieChart as PieIcon,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
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
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

const monthlyForecastData = [
  { month: 'Mai', realizado: 45000, previsao: 60000 },
  { month: 'Jun', realizado: 78000, previsao: 90000 },
  { month: 'Jul', realizado: 92000, previsao: 110000 },
  { month: 'Ago', realizado: 135000, previsao: 140000 },
  { month: 'Set (Atual)', realizado: 48000, previsao: 185000 },
  { month: 'Out (Proj)', realizado: 0, previsao: 220000 },
];

const funnelData = [
  { stage: '1. Prospects', count: 120, valor: 420000 },
  { stage: '2. Contatados', count: 85, valor: 310000 },
  { stage: '3. Qualificados', count: 54, valor: 240000 },
  { stage: '4. Diagnóstico', count: 32, valor: 175000 },
  { stage: '5. Proposta', count: 19, valor: 128000 },
  { stage: '6. Negociação', count: 11, valor: 95000 },
  { stage: '7. Fechado (Won)', count: 7, valor: 64000 },
];

const winLossData = [
  { name: 'Ganhos (Won)', value: 68, color: '#10B981' },
  { name: 'Perdidos (Preço)', value: 18, color: '#EF4444' },
  { name: 'Perdidos (Sem Contato)', value: 9, color: '#F59E0B' },
  { name: 'Perdidos (Concorrente)', value: 5, color: '#6B7280' },
];

export default function SalesAnalyticsReport() {
  const [period, setPeriod] = useState('this_month');

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-semibold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Executive Intelligence</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Analytics & Performance Comercial</h1>
            <p className="mt-1 text-sm text-slate-600">
              Visão executiva de conversão do funil de vendas, projeção de receita e velocidade de fechamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="min-h-11 border-slate-300 bg-white font-medium text-slate-900 shadow-xs w-[180px]">
                <Calendar className="mr-2 h-4 w-4 text-blue-700" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">Este Mês (Setembro)</SelectItem>
                <SelectItem value="last_quarter">Último Trimestre</SelectItem>
                <SelectItem value="ytd">Ano Atual (YTD)</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="min-h-11 border-slate-300 bg-white shadow-xs hover:bg-slate-50">
              <Download className="mr-2 h-4 w-4 text-blue-700" /> Exportar Relatório Executivo
            </Button>
          </div>
        </header>

        {/* KPI Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Total</span>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-800">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">R$ 1.532.000</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ArrowUpRight className="h-4 w-4" /> +14.2% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taxa de Conversão</span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">24.8%</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ArrowUpRight className="h-4 w-4" /> +3.5% acima da meta
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ticket Médio</span>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-800">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">R$ 38.500</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                Projetos solares comerciais B2B
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ciclo Médio de Venda</span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">14 dias</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ArrowDownRight className="h-4 w-4" /> -2 dias (mais rápido)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Forecast Chart */}
          <Card className="border-slate-200 shadow-sm lg:col-span-2 bg-white">
            <CardHeader className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Projeção e Faturamento Realizado (R$)</CardTitle>
                  <CardDescription>Comparativo entre receita fechada e meta projetada por mês.</CardDescription>
                </div>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-900 font-semibold">
                  Forecast IA
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyForecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, '']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend />
                    <Bar dataKey="realizado" name="Realizado (Fechado)" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previsao" name="Previsão Meta" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win / Loss Pie */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Motivos de Perda / Sucesso</CardTitle>
              <CardDescription>Distribuição de fechamento comercial.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={winLossData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {winLossData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Conversion Table & Chart */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-base font-bold text-slate-900">Funil de Conversão Comercial por Estágio</CardTitle>
            <CardDescription>Volume de oportunidades ativas e taxa de avanço em cada etapa.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="stage" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="count" name="Oportunidades" stroke="#1D4ED8" fill="#DBEAFE" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-slate-100 border rounded-lg border-slate-200 bg-slate-50/50">
                {funnelData.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between p-3 text-xs">
                    <span className="font-semibold text-slate-900">{item.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">{item.count} leads</span>
                      <span className="font-bold text-blue-900">R$ {(item.valor / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
