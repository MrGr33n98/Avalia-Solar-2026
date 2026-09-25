import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BannersSponsorship from '@/app/dashboard/components/BannersSponsorship';
import { fetchBannerApi } from '@/lib/api-banner-client';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';

jest.mock('@/lib/api-banner-client', () => ({
  fetchBannerApi: jest.fn(),
}));

jest.mock('@/hooks/useCompanyFeatures', () => ({
  useCompanyFeatures: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ _fill, _unoptimized, alt, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

describe('BannersSponsorship — Swiss SaaS UI/UX V2', () => {
  const mockDashboardData = {
    quota: {
      active_used: 1,
      active_limit: 3,
      active_remaining: 2,
      can_activate: true,
      can_create_draft: true,
    },
    summary: {
      impressions: 1200,
      clicks: 48,
      ctr: 4,
      leads: 6,
      investment_cents: 25000,
      cpc_cents: 520,
    },
    operational_health: {
      status: 'healthy',
      reportable_events_24h: 48,
      discarded_events_24h: 0,
      divergent_banners_yesterday: 0,
      lag_minutes: 4,
    },
    time_series: [
      { day: '2026-08-08', impressions: 320, clicks: 12 },
      { day: '2026-08-09', impressions: 410, clicks: 17 },
      { day: '2026-08-10', impressions: 470, clicks: 19 },
    ],
    placements: [
      {
        key: 'home_top',
        label: 'Topo da Home',
        status: 'active',
        dimensions: [728, 90],
        commercial: 'Disponível',
      },
    ],
    banners: [
      {
        id: 101,
        title: 'Campanha Solar Topo',
        thumbnail_url: '/banner-solar.webp',
        link_url: 'https://exemplo.com.br',
        banner_type: 'image',
        operational_status: 'active',
        moderation_status: 'approved',
        position: 'home_top',
        slot_key: 'slot-1',
        target_states: ['SC'],
        target_cities: ['Florianópolis'],
        starts_at: '2026-09-01T00:00:00Z',
        ends_at: '2026-09-30T23:59:59Z',
        days_remaining: 5,
        performance: {
          impressions: 1200,
          clicks: 48,
          ctr: 4,
          leads: 6,
          investment_cents: 25000,
        },
        active_addons: [],
        allowed_actions: ['edit', 'pause', 'buy_addon'],
        delivery_health: {
          status: 'healthy',
          blockers: [],
          checks: [],
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCompanyFeatures as jest.Mock).mockReturnValue({
      features: {
        promo_banner: { state: 'enabled', value: true },
      },
      loading: false,
    });
    (fetchBannerApi as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/company_dashboard/banners') {
        return Promise.resolve(mockDashboardData);
      }
      if (endpoint === '/company_dashboard/banners/export_alerts') {
        return Promise.resolve({ alerts: [] });
      }
      return Promise.resolve({});
    });
  });

  it('renderiza o header Swiss SaaS com breadcrumb, título e ações principais', async () => {
    render(<BannersSponsorship companyId="372" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Campanhas Patrocinadas' })).toBeInTheDocument();
    });

    expect(screen.getByText('Divulgação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova campanha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guia rápido/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Período do gráfico/i })).toBeInTheDocument();
  });

  it('renderiza exatamente os 4 cards de KPI com dados reais e sem tendências inventadas', async () => {
    render(<BannersSponsorship companyId="372" />);

    await waitFor(() => {
      expect(screen.getAllByText(/1[.,]?200/).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Impressões').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cliques/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Leads').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CTR').length).toBeGreaterThan(0);

    // Valida que NÃO inventamos tendências fictícias
    expect(screen.queryByText(/vs período anterior/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+12%/i)).not.toBeInTheDocument();
  });

  it('renderiza a Campanha em Destaque determinística e a tabela Minhas Campanhas', async () => {
    render(<BannersSponsorship companyId="372" />);

    await waitFor(() => {
      expect(screen.getByText('Campanha em destaque')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Campanha Solar Topo').length).toBeGreaterThan(0);
    expect(screen.getByText('Minhas campanhas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar campanha.../i)).toBeInTheDocument();
    expect(screen.getByText('5 dias restantes')).toBeInTheDocument();
  });

  it('renderiza os widgets da sidebar direita (Dica, Quota de campanhas, Seus anúncios, Saúde)', async () => {
    render(<BannersSponsorship companyId="372" />);

    await waitFor(() => {
      expect(screen.getByText('Quota de campanhas')).toBeInTheDocument();
    });

    expect(screen.getByText('Dica de boas práticas')).toBeInTheDocument();
    expect(screen.getByText('Seus anúncios')).toBeInTheDocument();
    expect(screen.getAllByText('Saúde da medição').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operação normal').length).toBeGreaterThan(0);
  });

  it('alterna o diagnóstico técnico com o botão Ver Diagnóstico Técnico', async () => {
    render(<BannersSponsorship companyId="372" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ver Diagnóstico Técnico' })).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: 'Ver Diagnóstico Técnico' });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Eventos válidos 24h:/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Ocultar Diagnóstico Técnico')).toBeInTheDocument();
  });
});
