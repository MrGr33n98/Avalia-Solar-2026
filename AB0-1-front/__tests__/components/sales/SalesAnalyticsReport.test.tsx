import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesAnalyticsReport from '@/components/sales/SalesAnalyticsReport';

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  usePathname() {
    return '/dashboard/sales/reports';
  },
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock do next/image para Jest
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<'img'> & { unoptimized?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock do SalesLayoutWrapper para focar os testes no SalesAnalyticsReport
jest.mock('@/components/sales/layout/SalesLayoutWrapper', () => {
  return function MockSalesLayoutWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="sales-layout-wrapper">{children}</div>;
  };
});

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin User', email: 'admin@avaliasolar.com.br' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

const mockAnalyticsData = {
  kpis: {
    pipeline_value_cents: 1350000,
    weighted_pipeline_cents: 450000,
    won_revenue_cents: 800000,
    conversion_rate: 0.25,
    average_ticket_cents: 200000,
    average_sales_cycle_days: 14,
    open_deals: 9,
    won_deals: 4,
    lost_deals: 2,
  },
  funnel: [
    { stage: 'Prospect', count: 5, value_cents: 500000 },
    { stage: 'Proposta', count: 4, value_cents: 850000 },
  ],
  win_loss: [
    { name: 'Preço', value: 60, color: '#EF4444' },
    { name: 'Prazo', value: 40, color: '#F59E0B' },
  ],
  loss_reasons: [
    { name: 'Preço', value: 60, color: '#EF4444' },
    { name: 'Prazo', value: 40, color: '#F59E0B' },
  ],
  revenue_by_month: [
    { month: 'Jul', won_cents: 300000, pipeline_cents: 200000 },
    { month: 'Ago', won_cents: 500000, pipeline_cents: 250000 },
  ],
  team_performance: [
    {
      owner_id: 1,
      name: 'Carlos Vendedor 1',
      email: 'carlos@avaliasolar.com.br',
      total_deals: 10,
      won_deals: 3,
      lost_deals: 1,
      won_revenue_cents: 600000,
      win_rate: 75,
    },
    {
      owner_id: 2,
      name: 'Mariana Vendedora 2',
      email: 'mariana@avaliasolar.com.br',
      total_deals: 8,
      won_deals: 1,
      lost_deals: 1,
      won_revenue_cents: 200000,
      win_rate: 50,
    },
  ],
  email_metrics: {
    sent: 120,
    delivered: 115,
    open: 45,
    click: 15,
    replied: 8,
    bounce: 5,
    complaint: 0,
  },
};

describe('SalesAnalyticsReport Premium Redesign Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData),
      })
    ) as jest.Mock;
  });

  it('renders loading skeleton initially and fetches data', async () => {
    render(<SalesAnalyticsReport />);
    expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Analytics & Performance Comercial')).toBeInTheDocument();
    });
  });

  it('renders all 7 KPIs with formatted values after load', async () => {
    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-kpis')).toBeInTheDocument();
    });

    // Validar Pipeline Total
    expect(screen.getByTestId('kpi-pipeline-total')).toHaveTextContent('R$ 13.500');
    expect(screen.getByTestId('kpi-pipeline-total')).toHaveTextContent('9 negócios em aberto');

    // Validar Pipeline Ponderado
    expect(screen.getByTestId('kpi-pipeline-weighted')).toHaveTextContent('R$ 4.500');

    // Validar Receita Fechada
    expect(screen.getByTestId('kpi-won-revenue')).toHaveTextContent('R$ 8.000');

    // Validar Taxa de Conversão
    expect(screen.getByTestId('kpi-conversion-rate')).toHaveTextContent('25.0%');

    // Validar Ticket Médio
    expect(screen.getByTestId('kpi-ticket-medio')).toHaveTextContent('R$ 2.000');

    // Validar Ciclo Médio
    expect(screen.getByTestId('kpi-ciclo-venda')).toHaveTextContent('14 dias');

    // Validar Perdidos
    expect(screen.getByTestId('kpi-lost-deals')).toHaveTextContent('2');
  });

  it('renders executive insight cards derived from real data', async () => {
    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByText(/Insight do Período/i)).toBeInTheDocument();
      expect(screen.getByText(/Saúde do Pipeline & Alertas/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/9 oportunidades abertas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 negócios/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders sales team performance leaderboard with rank badges', async () => {
    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByTestId('sales-team-performance')).toBeInTheDocument();
    });

    expect(screen.getByText('Carlos Vendedor 1')).toBeInTheDocument();
    expect(screen.getByText('Mariana Vendedora 2')).toBeInTheDocument();
    expect(screen.getByText('1º')).toBeInTheDocument();
    expect(screen.getByText('2º')).toBeInTheDocument();
  });

  it('renders email performance strip with all metrics', async () => {
    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByTestId('email-analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Enviados')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Entregues')).toBeInTheDocument();
    expect(screen.getByText('115')).toBeInTheDocument();
    expect(screen.getByText('Aberturas')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('handles export CSV without throwing', async () => {
    // Mock URL.createObjectURL
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('analytics-kpis')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Exportar CSV/i });
    expect(exportBtn).not.toBeDisabled();

    fireEvent.click(exportBtn);
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('handles error state gracefully', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Erro interno no banco de dados' } }),
      })
    ) as jest.Mock;

    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
      expect(screen.getByText(/Erro interno no banco de dados/i)).toBeInTheDocument();
    });
  });

  it('handles unauthorized session gracefully', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    ) as jest.Mock;

    render(<SalesAnalyticsReport />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-unauthorized')).toBeInTheDocument();
      expect(screen.getByText(/Sessão expirada ou sem permissão/i)).toBeInTheDocument();
    });
  });
});
