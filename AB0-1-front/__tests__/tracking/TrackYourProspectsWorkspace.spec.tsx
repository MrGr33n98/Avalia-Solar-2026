import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackingAttributionWorkspace from '../../app/dashboard/components/tracking/TrackingAttributionWorkspace';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockProspectsData = {
  status: 'ready' as const,
  range: { from: '2026-09-15', to: '2026-10-15' },
  summary: {
    clicks: 142,
    verified_landings: 89,
    form_submissions: 18,
    confirmed_conversions: 12,
    landing_rate: 62.7,
    conversion_rate: 13.5,
    trends: {
      clicks_change_pct: 15.2,
      landings_change_pct: 8.4,
      conversions_change_pct: 20.0,
    },
  },
  timeseries: [
    { date: '2026-10-01', clicks: 10, verified_landings: 7, conversions: 1 },
    { date: '2026-10-02', clicks: 14, verified_landings: 9, conversions: 2 },
  ],
  source_breakdown: [
    { source: 'profile', label: 'Perfil no Marketplace', clicks: 80, verified_landings: 50, conversions: 8, percentage: 56.3 },
    { source: 'compare', label: 'Comparador Solar', clicks: 62, verified_landings: 39, conversions: 4, percentage: 43.7 },
  ],
  records: [
    {
      id: 'click-uuid-001',
      clicked_at: '2026-10-14T14:30:00Z',
      source_context: 'profile',
      source_label: 'Perfil no Marketplace',
      destination_type: 'website',
      target_url: 'https://empresa.com.br/energia-solar',
      evidence_status: 'lead_confirmed' as const,
      session_id: 'session-uuid-001',
      landing_verified_at: '2026-10-14T14:30:15Z',
      referrer_host: 'app.avaliasolar.com.br',
      duration_seconds: 185,
      events_count: 3,
      account_name: 'Não identificado',
      country: 'Brasil',
    },
  ],
  pagination: {
    current_page: 1,
    per_page: 15,
    total_count: 1,
    total_pages: 1,
  },
  tag_info: {
    configured: true,
    active: true,
    public_key: 'pk_live_sample_key_1234567890',
    allowed_origins: ['https://empresa.com.br'],
    snippet_url: 'https://api.avaliasolar.com.br/api/v1/public/sales/tracking/pk_live_sample_key_1234567890.js',
    last_seen_at: '2026-10-14T15:00:00Z',
    status: 'healthy' as const,
    settings: {
      ga4: { measurement_id: 'G-ABC12345XX' },
      custom_ids: { enabled: true },
    },
  },
  integrations: {
    ga4: {
      status: 'connected' as const,
      measurement_id: 'G-ABC12345XX',
    },
    custom_ids: {
      allowed_keys: ['user_id', 'crm_lead_id', 'account_id', 'proposal_id'],
      enabled: true,
    },
  },
};

describe('TrackYourProspectsWorkspace (PR 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      isFetching: false,
      data: mockProspectsData,
      refetch: jest.fn(),
    });
  });

  it('renderiza o cabeçalho shell com título e breadcrumb', () => {
    render(<TrackingAttributionWorkspace companyId="372" company={{ id: 372, name: '77 Sol' }} />);

    expect(screen.getByRole('heading', { name: /track your prospects/i })).toBeInTheDocument();
    expect(screen.getByText('Performance >')).toBeInTheDocument();
    expect(screen.getByText('77 Sol')).toBeInTheDocument();
  });

  it('exibe as 6 abas principais da especificação', () => {
    render(<TrackingAttributionWorkspace companyId="372" />);

    expect(screen.getByRole('tab', { name: /visão geral/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /jornada/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /contas e visitantes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /instalação da tag/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /integrações/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /configurações/i })).toBeInTheDocument();
  });

  it('renderiza os 4 metric cards com valores canônicos e denominadores', () => {
    render(<TrackingAttributionWorkspace companyId="372" />);

    expect(screen.getByText('142')).toBeInTheDocument(); // Cliques
    expect(screen.getByText('89')).toBeInTheDocument(); // Chegadas
    expect(screen.getByText('12')).toBeInTheDocument(); // Conversões
    expect(screen.getByText('13.5%')).toBeInTheDocument(); // Taxa de conversão
    expect(screen.getByText(/62.7% do total/i)).toBeInTheDocument(); // Taxa de chegada
  });

  it('permite alternar para a aba de instalação e exibe snippet e status de saúde', () => {
    render(<TrackingAttributionWorkspace companyId="372" />);

    const installTab = screen.getByRole('tab', { name: /instalação da tag/i });
    fireEvent.click(installTab);

    expect(screen.getByText(/snippet javascript oficial/i)).toBeInTheDocument();
    expect(screen.getByText(/tag ativa e saudável/i)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/empresa.com.br/i)).toBeInTheDocument();
  });

  it('permite alternar para a aba de integrações e exibe GA4 e custom IDs', () => {
    render(<TrackingAttributionWorkspace companyId="372" />);

    const integrationsTab = screen.getByRole('tab', { name: /integrações/i });
    fireEvent.click(integrationsTab);

    expect(screen.getByText(/google analytics 4/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('G-ABC12345XX')).toBeInTheDocument();
    expect(screen.getByText(/identificadores customizados/i)).toBeInTheDocument();
  });
});
