import { render, screen } from '@testing-library/react';
import React from 'react';
import { DashboardCharts, RevenueChart, ProposalsChart, PerformanceChart } from './DashboardCharts';

describe('DashboardCharts Clean Data & Empty State (Zero Mocks)', () => {
  it('renders a clear, accessible empty state when data is empty in AreaChart', () => {
    render(<DashboardCharts.AreaChart data={[]} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Nenhum dado registrado para o período/i)).toBeInTheDocument();
  });

  it('renders a clear, accessible empty state when data is undefined in BarChart', () => {
    render(<DashboardCharts.BarChart data={undefined as unknown as any[]} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Nenhum dado registrado para o período/i)).toBeInTheDocument();
  });

  it('does not render hardcoded static salesData when RevenueChart has empty data', () => {
    render(<RevenueChart data={[]} />);

    // Must show empty status and must not render fake sales
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/R\$ 45k/i)).not.toBeInTheDocument();
  });

  it('does not render fake energy types (Eólica, Biomassa) in ProposalsChart when data is empty', () => {
    render(<ProposalsChart data={[]} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/Biomassa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Eólica/i)).not.toBeInTheDocument();
  });

  it('has accessible label on the chart download/export button in RevenueChart', () => {
    render(<RevenueChart data={[]} />);

    const exportBtn = screen.getByRole('button', { name: /exportar dados do gráfico/i });
    expect(exportBtn).toBeInTheDocument();
  });
});

