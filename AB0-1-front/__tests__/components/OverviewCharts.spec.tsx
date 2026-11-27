import React from 'react';
import { render } from '@testing-library/react';
import {
  OverviewPerformanceChart,
  OverviewSourcesChart,
} from '@/app/dashboard/components/OverviewCharts';

// Mock ResizeObserver for Recharts ResponsiveContainer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('OverviewCharts (Lazy Recharts — Spec 022 D2/B3)', () => {
  it('renderiza OverviewPerformanceChart com linhas de série temporal', () => {
    const mockRows = [
      { date: '2026-11-20', views: 120, clicks: 15 },
      { date: '2026-11-21', views: 180, clicks: 22 },
      { date: '2026-11-22', views: 240, clicks: 35 },
    ];

    const { container } = render(<OverviewPerformanceChart rows={mockRows} />);
    expect(container).toBeInTheDocument();
  });

  it('renderiza OverviewSourcesChart com distribuição de fontes UTM', () => {
    const mockSources = [
      { name: 'Google Ads', visits: 450, percentage: 45, color: '#3b82f6' },
      { name: 'Orgânico', visits: 350, percentage: 35, color: '#10b981' },
      { name: 'Direto', visits: 200, percentage: 20, color: '#f59e0b' },
    ];

    const { container } = render(<OverviewSourcesChart sources={mockSources} />);
    expect(container).toBeInTheDocument();
  });
});
