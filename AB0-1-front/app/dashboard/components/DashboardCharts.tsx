"use client";

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import ChartCard from "./ChartCard";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const salesData = [
  { month: "Jan", value: 45000, proposals: 12 },
  { month: "Fev", value: 52000, proposals: 15 },
  { month: "Mar", value: 48000, proposals: 11 },
  { month: "Abr", value: 61000, proposals: 18 },
  { month: "Mai", value: 55000, proposals: 14 },
  { month: "Jun", value: 67000, proposals: 20 },
];

const categoryData = [
  { name: "Solar", value: 45 },
  { name: "Eólica", value: 28 },
  { name: "Biomassa", value: 15 },
  { name: "Hidro", value: 12 },
];

const performanceData = [
  { month: "Jan", conversao: 68, satisfacao: 85 },
  { month: "Fev", conversao: 72, satisfacao: 88 },
  { month: "Mar", conversao: 65, satisfacao: 82 },
  { month: "Abr", conversao: 78, satisfacao: 91 },
  { month: "Mai", conversao: 75, satisfacao: 89 },
  { month: "Jun", conversao: 82, satisfacao: 93 },
];

export function RevenueChart() {
  return (
    <ChartCard
      title="Receita Mensal"
      description="Evolução da receita nos últimos 6 meses"
      actions={
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--clay-surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--clay-radius-md)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProposalsChart() {
  return (
    <ChartCard
      title="Propostas por Categoria"
      description="Distribuição de propostas por tipo de energia"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={categoryData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--clay-surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--clay-radius-md)",
            }}
          />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--accent))"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PerformanceChart() {
  return (
    <ChartCard
      title="Performance"
      description="Taxa de conversão e satisfação do cliente"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--clay-surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--clay-radius-md)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="conversao"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Taxa de Conversão"
          />
          <Line
            type="monotone"
            dataKey="satisfacao"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            name="Satisfação"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
