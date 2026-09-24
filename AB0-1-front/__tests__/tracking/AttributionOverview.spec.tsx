import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttributionOverview from '../../app/dashboard/components/analytics/AttributionOverview';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AttributionOverview', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renderiza o bloco de resumo com 4 KPIs e suporte a colapso', () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        data_status: 'ready',
        summary: {
          visits: 78,
          cta_clicks: 1,
          leads: 0,
          attribution_coverage_pct: 100,
        },
        channels: [{ channel_group: 'Paid Search', source: 'google', medium: 'cpc', visits: 50, leads: 0 }],
        cta_matrix: [{ channel_group: 'Paid Search', source: 'google', whatsapp: 1, quote: 0, total_clicks: 1, leads: 0 }],
        campaigns: [{ source: 'google', medium: 'cpc', campaign: 'verao', visits: 50, leads: 0 }],
        landing_pages: [{ landing_path: '/companies/solar-plus', visits: 50 }],
      },
    });

    render(<AttributionOverview companyId="42" premium />);

    expect(screen.getByText('Origem & Atribuição')).toBeInTheDocument();
    expect(screen.getByText('Visitas de aquisição')).toBeInTheDocument();
    expect(screen.getAllByText('CTAs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Leads').length).toBeGreaterThan(0);
    expect(screen.getByText('Cobertura de atribuição')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /recolher detalhes de origem e atribuição/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // 4 KPIs continuam visíveis mesmo quando recolhido
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('navega para o workspace ao clicar em Abrir Tracking & Atribuição', () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        data_status: 'ready',
        summary: { visits: 10, cta_clicks: 2, leads: 1, attribution_coverage_pct: 100 },
      },
    });

    render(<AttributionOverview companyId="42" premium />);

    const openBtn = screen.getByRole('button', { name: /abrir tracking & atribuição/i });
    fireEvent.click(openBtn);

    expect(mockPush).toHaveBeenCalledWith('/dashboard?company_id=42&tab=tracking-attribution');
  });
});
