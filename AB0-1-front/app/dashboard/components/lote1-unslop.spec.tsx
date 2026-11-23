import React from 'react';
import { render, screen } from '@testing-library/react';
import LeadsOpportunities from './LeadsOpportunities';
import ReviewsManagement from './ReviewsManagement';
import { companyDashboardApi, dashboardApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  companyDashboardApi: {
    getLeads: jest.fn(),
  },
  dashboardApi: {
    getSocialProofReviews: jest.fn(),
    getSocialProofStats: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('Lote 1: LeadsOpportunities Unslop & Astryx Tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with dashboard semantic tokens and accessible container', async () => {
    (companyDashboardApi.getLeads as jest.Mock).mockResolvedValueOnce({
      data: [],
      meta: { pagination: { total: 0, total_pages: 0, current_page: 1 } },
    });

    render(<LeadsOpportunities companyId="372" />);

    const section = screen.getByRole('region', { name: /solicitações recebidas/i });
    expect(section).toBeInTheDocument();
    expect(section.className).toContain('border-[hsl(var(--dashboard-border))]');
    expect(section.className).not.toContain('#dde1e6');
  });

  it('renders accessible empty state with role="status"', async () => {
    (companyDashboardApi.getLeads as jest.Mock).mockResolvedValueOnce({
      data: [],
      meta: { pagination: { total: 0, total_pages: 0, current_page: 1 } },
    });

    render(<LeadsOpportunities companyId="372" />);

    const emptyText = await screen.findByText(/nenhuma solicitação neste período/i);
    expect(emptyText).toBeInTheDocument();
    const emptyContainer = emptyText.closest('div');
    expect(emptyContainer).toHaveAttribute('role', 'status');
  });

  it('renders period filter buttons with proper aria-pressed and semantic tokens', async () => {
    (companyDashboardApi.getLeads as jest.Mock).mockResolvedValueOnce({
      data: [],
      meta: { pagination: { total: 0, total_pages: 0, current_page: 1 } },
    });

    render(<LeadsOpportunities companyId="372" />);

    const button6m = screen.getByRole('button', { name: '6 meses' });
    expect(button6m).toHaveAttribute('aria-pressed', 'true');
    expect(button6m.className).toContain('bg-[hsl(var(--dashboard-accent))]');
    expect(button6m.className).not.toContain('#0b2d4f');
  });
});

describe('Lote 1: ReviewsManagement Unslop & Astryx Tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reviews management with semantic tokens and accessible fallback table', async () => {
    (dashboardApi.getSocialProofStats as jest.Mock).mockResolvedValueOnce({
      stats: {
        total_reviews: 5,
        approved_reviews: 5,
        pending_reviews: 0,
        rejected_reviews: 0,
        in_analysis_reviews: 0,
        featured_reviews: 1,
        verified_reviews: 3,
        average_rating: 4.8,
        response_rate: 100,
        unanswered_reviews: 0,
        nps_score: 80,
        nps_responses: 4,
        rating_distribution: { '5': 4, '4': 1 },
        monthly_evolution: { '2026-10': 2, '2026-11': 3 },
        monthly_rating: { '2026-10': 5.0, '2026-11': 4.7 },
        sentiment_distribution: { positive: 5 },
        source_distribution: { direct: 5 },
        criteria_averages: [],
        first_review_at: '2026-10-01T10:00:00Z',
        last_review_at: '2026-11-20T10:00:00Z',
      },
    });

    (dashboardApi.getSocialProofReviews as jest.Mock).mockResolvedValueOnce({
      reviews: [],
      permissions: { can_reply: true, can_feature: true },
    });

    render(<ReviewsManagement companyId="372" />);

    const heading = await screen.findByText('O que seus clientes estão dizendo');
    expect(heading).toBeInTheDocument();

    // Verify accessible screen reader table for monthly trend
    const srTable = screen.getByText('Evolução mensal de avaliações e nota média');
    expect(srTable).toBeInTheDocument();
  });
});
