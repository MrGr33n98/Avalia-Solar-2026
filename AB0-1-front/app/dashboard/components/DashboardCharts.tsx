"use client";

import { 
  AreaChart as ReAreaChart, 
  Area, 
  BarChart as ReBarChart, 
  Bar, 
  LineChart as ReLineChart, 
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

// Helper components for the DashboardCharts object
function AreaChartComponent({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReAreaChart data={data}>
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
      </ReAreaChart>
    </ResponsiveContainer>
  );
}

function BarChartComponent({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
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
      </ReBarChart>
    </ResponsiveContainer>
  );
}

function LineChartComponent({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
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
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
}

export const DashboardCharts = {
  AreaChart: AreaChartComponent,
  BarChart: BarChartComponent,
  LineChart: LineChartComponent,
};

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
        <ReAreaChart data={salesData}>
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
        </ReAreaChart>
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
        <ReBarChart data={categoryData}>
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
        </ReBarChart>
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
        <ReLineChart data={performanceData}>
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
        </ReLineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
