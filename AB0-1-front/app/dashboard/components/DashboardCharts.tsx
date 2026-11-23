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
import { Download, BarChart3 } from "lucide-react";

function ChartEmptyState({ message = 'Nenhum dado registrado para o período.' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-label={message}
      className="h-[300px] w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[hsl(var(--dashboard-border))] rounded-xl bg-[hsl(var(--dashboard-surface)/0.3)]"
    >
      <BarChart3 className="h-10 w-10 text-[hsl(var(--dashboard-muted))] mb-2 opacity-50" aria-hidden="true" />
      <p className="text-sm font-medium text-[hsl(var(--dashboard-ink))]">{message}</p>
      <p className="text-xs text-[hsl(var(--dashboard-muted))] mt-1">
        Conforme novas interações ocorrerem, o gráfico será atualizado automaticamente.
      </p>
    </div>
  );
}

// Helper components for the DashboardCharts object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AreaChartComponent({ data }: { data?: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartEmptyState />;
  }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarChartComponent({ data }: { data?: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartEmptyState />;
  }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineChartComponent({ data }: { data?: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartEmptyState />;
  }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RevenueChart({ data }: { data?: any[] }) {
  const chartData = data && Array.isArray(data) && data.length > 0 ? data : [];

  return (
    <ChartCard
      title="Receita Mensal"
      description="Evolução da receita no período"
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Exportar dados do gráfico em CSV"
          title="Exportar dados do gráfico em CSV"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </Button>
      }
    >
      {chartData.length === 0 ? (
        <ChartEmptyState message="Nenhum dado de receita registrado para o período." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ReAreaChart data={chartData}>
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
      )}
    </ChartCard>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProposalsChart({ data }: { data?: any[] }) {
  const chartData = data && Array.isArray(data) && data.length > 0 ? data : [];

  return (
    <ChartCard
      title="Propostas por Categoria"
      description="Distribuição de propostas por categoria"
    >
      {chartData.length === 0 ? (
        <ChartEmptyState message="Nenhum dado de propostas registrado para o período." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={chartData}>
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
      )}
    </ChartCard>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PerformanceChart({ data }: { data?: any[] }) {
  const chartData = data && Array.isArray(data) && data.length > 0 ? data : [];

  return (
    <ChartCard
      title="Performance"
      description="Taxa de conversão e interações"
    >
      {chartData.length === 0 ? (
        <ChartEmptyState message="Nenhum dado de performance registrado para o período." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={chartData}>
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
      )}
    </ChartCard>
  );
}
