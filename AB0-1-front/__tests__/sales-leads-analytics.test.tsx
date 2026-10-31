import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadsAnalyticsView } from '@/components/sales/leads/views/LeadsAnalyticsView';
import { salesApi } from '@/lib/api/sales/client';
import type { LeadsAnalyticsResponse } from '@/lib/api/sales/types';

jest.mock('@/lib/api/sales/client', () => ({
  salesApi: {
    getOpportunitiesAnalytics: jest.fn(),
  },
}));

jest.mock('posthog-js', () => ({
  __loaded: true,
  capture: jest.fn(),
}));

const mockAnalyticsResponse: LeadsAnalyticsResponse = {
  summary: {
    total_leads: 12,
    total_value_cents: 120_000_000,
    total_value_formatted: 'R$ 1.200.000,00',
    avg_value_cents: 10_000_000,
    avg_value_formatted: 'R$ 100.000,00',
    avg_time_open_days: 14.5,
    win_rate_percentage: 33.3,
  },
  time_series: [
    {
      period_label: '24/10',
      start_date: '2026-10-24',
      quantity: 5,
      value_cents: 50_000_000,
    },
    {
      period_label: '31/10',
      start_date: '2026-10-31',
      quantity: 7,
      value_cents: 70_000_000,
    },
  ],
  breakdowns: {
    assignee: [
      { id: 1, label: 'Carlos Vendedor', count: 8, percentage: 66.7 },
      { id: 2, label: 'Ana Comercial', count: 4, percentage: 33.3 },
    ],
    stage: [
      { id: 10, label: 'Qualificação', count: 5, percentage: 41.7 },
      { id: 11, label: 'Proposta Apresentada', count: 7, percentage: 58.3 },
    ],
    product: [
      { id: 101, label: 'Kit Solar 5kWp', count: 6, percentage: 50.0 },
      { id: 102, label: 'Kit Solar 10kWp', count: 6, percentage: 50.0 },
    ],
    outcome: [
      { status: 'won', label: 'Won', count: 4, percentage: 33.3, color: '#16A34A' },
      { status: 'open', label: 'Open', count: 6, percentage: 50.0, color: '#334155' },
      { status: 'lost', label: 'Lost', count: 2, percentage: 16.7, color: '#DC2626' },
    ],
    source: [{ label: 'Google Ads', count: 12, percentage: 100.0 }],
    competitor: [{ id: 50, label: 'Concorrente Solar X', count: 3, percentage: 25.0 }],
    tag: [{ id: 70, label: 'Urgente', count: 5, percentage: 41.7 }],
    territory: [{ label: 'SP', count: 12, percentage: 100.0 }],
    age: [{ label: '< 1 month', count: 12, percentage: 100.0 }],
    value_bracket: [{ label: 'R$ 75k+', count: 12, percentage: 100.0 }],
    channel: [{ label: 'Inbound', count: 12, percentage: 100.0 }],
  },
};

const emptyAnalyticsResponse: LeadsAnalyticsResponse = {
  summary: {
    total_leads: 0,
    total_value_cents: 0,
    total_value_formatted: 'R$ 0,00',
    avg_value_cents: 0,
    avg_value_formatted: 'R$ 0,00',
    avg_time_open_days: 0,
    win_rate_percentage: 0,
  },
  time_series: [],
  breakdowns: {
    assignee: [],
    stage: [],
    product: [],
    outcome: [
      { status: 'won', label: 'Won', count: 0, percentage: 0, color: '#16A34A' },
      { status: 'open', label: 'Open', count: 0, percentage: 0, color: '#334155' },
      { status: 'lost', label: 'Lost', count: 0, percentage: 0, color: '#DC2626' },
    ],
    source: [],
    competitor: [],
    tag: [],
    territory: [],
    age: [],
    value_bracket: [],
    channel: [],
  },
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('LeadsAnalyticsView Frontend Suite (PRD Analytics de Leads)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (salesApi.getOpportunitiesAnalytics as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithClient(<LeadsAnalyticsView pipelineId={1} />);

    expect(screen.getByText('Carregando série temporal...')).toBeInTheDocument();
  });

  it('renders error state with retry button when query fails', async () => {
    (salesApi.getOpportunitiesAnalytics as jest.Mock).mockRejectedValue(
      new Error('Internal Server Error')
    );

    renderWithClient(<LeadsAnalyticsView pipelineId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar estatísticas do conjunto de leads')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('retry button triggers refetch', async () => {
    (salesApi.getOpportunitiesAnalytics as jest.Mock)
      .mockRejectedValueOnce(new Error('Internal Server Error'))
      .mockResolvedValueOnce(mockAnalyticsResponse);

    renderWithClient(<LeadsAnalyticsView pipelineId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByText('Carlos Vendedor')).toBeInTheDocument();
    });
  });

  it('renders KPI summary cards and breakdowns on success', async () => {
    (salesApi.getOpportunitiesAnalytics as jest.Mock).mockResolvedValue(mockAnalyticsResponse);

    renderWithClient(<LeadsAnalyticsView pipelineId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Vendedor')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 1.200.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.000,00')).toBeInTheDocument();
    expect(screen.getByText('14.5 days')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('Ana Comercial')).toBeInTheDocument();
    expect(screen.getByText('Kit Solar 5kWp')).toBeInTheDocument();
  });

  it('renders empty state cleanly when total_leads is zero without throwing', async () => {
    (salesApi.getOpportunitiesAnalytics as jest.Mock).mockResolvedValue(emptyAnalyticsResponse);

    renderWithClient(<LeadsAnalyticsView pipelineId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum dado temporal encontrado com estes filtros')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Nenhum responsável associado aos leads')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma origem informada')).toBeInTheDocument();
  });
});
