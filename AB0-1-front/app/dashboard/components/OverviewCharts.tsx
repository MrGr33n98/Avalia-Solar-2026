'use client';

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate } from '../lib/overview-format';

export interface OverviewPerformanceChartProps {
  rows: Array<{ date: string; views: number; clicks: number }>;
}

export function OverviewPerformanceChart({ rows }: OverviewPerformanceChartProps) {
  const chartData = rows.map((row) => ({ ...row, label: formatDate(row.date) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="hsl(var(--dashboard-chart-grid))"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(var(--dashboard-muted))', fontSize: 10 }}
          minTickGap={26}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(var(--dashboard-muted))', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            borderColor: 'hsl(var(--dashboard-border))',
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 700 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="views"
          name="Visualizações"
          stroke="hsl(var(--dashboard-chart-1))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          name="Interações (CTAs)"
          stroke="hsl(var(--dashboard-chart-2))"
          strokeWidth={2.25}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface OverviewSourcesChartProps {
  sources: Array<{ name: string; visits: number; percentage: number; color: string }>;
}

export function OverviewSourcesChart({ sources }: OverviewSourcesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={sources}
          dataKey="visits"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={38}
          outerRadius={58}
          paddingAngle={2}
        >
          {sources.map((source) => (
            <Cell key={source.name} fill={source.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
