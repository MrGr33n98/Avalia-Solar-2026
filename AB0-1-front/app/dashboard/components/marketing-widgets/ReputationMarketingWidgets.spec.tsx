import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReputationMarketingWidgets from './ReputationMarketingWidgets';
import { dashboardApi, companyDashboardApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  dashboardApi: { getSocialProofStats: jest.fn(), getSocialProofReviews: jest.fn() },
  companyDashboardApi: { getRanking: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));

const stats = dashboardApi.getSocialProofStats as jest.Mock;
const reviews = dashboardApi.getSocialProofReviews as jest.Mock;
const ranking = companyDashboardApi.getRanking as jest.Mock;
const company = { id: 372, name: 'KAJU Energia Solar', slug: 'kaju-energia-solar' };

describe('Widgets de Reputação (mobile-first)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    stats.mockResolvedValue({ stats: { approved_reviews: 0, average_rating: 0 }, data_status: 'complete' });
    reviews.mockResolvedValue({
      reviews: [],
      permissions: { can_feature_reviews: false, social_proof_enabled: false },
      data_status: 'complete',
    });
    ranking.mockResolvedValue({ status: 'locked', mode: 'preview', ranking: { position: null, population: null } });
  });

  it('renders four types, with no fake 4.8 rating or 128 testimonials', async () => {
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    expect(screen.getByTestId('widgets-catalog').querySelectorAll('article')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Ranking Avalia Solar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resumo de Avaliações' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Widget de Estrelas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Widget de Depoimentos' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeDisabled());
    expect(screen.getAllByText(/Nenhum depoimento aprovado/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('4,8')).not.toBeInTheDocument();
  });

  it('enables HTML snapshot only when real approved reviews exist', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 12, average_rating: 4.7 }, data_status: 'complete' });
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('4,7'));
    fireEvent.click(screen.getByRole('button', { name: /Copiar HTML estático/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    expect(String((navigator.clipboard.writeText as jest.Mock).mock.calls[0][0])).toContain('captura estática');
  });

  it('never publishes a preview or locked ranking as official positioning', async () => {
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    fireEvent.click(screen.getByTestId('select-widget-ranking'));
    await waitFor(() => expect(ranking).toHaveBeenCalledWith('372'));
    expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeDisabled();
    expect(screen.getByText(/só pode ser exibido quando a API confirmar/i)).toBeInTheDocument();
  });

  it('selects a validated featured approved testimonial only when social proof is allowed', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 2, average_rating: 5 }, data_status: 'complete' });
    reviews.mockResolvedValue({
      reviews: [{ id: 1, comment: 'Excelente atendimento', featured: true, status: 'approved', rating: 5, user_name: 'Ana' }],
      permissions: { can_feature_reviews: true, social_proof_enabled: true }, data_status: 'complete',
    });
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    fireEvent.click(screen.getByTestId('select-widget-testimonial'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('Excelente atendimento'));
  });

  it('does not share data from previous company after company switch', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 15, average_rating: 4.8 }, data_status: 'complete' });
    const { rerender } = render(<ReputationMarketingWidgets company={company} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    stats.mockResolvedValue({ stats: { approved_reviews: 0, average_rating: 0 }, data_status: 'complete' });
    rerender(<ReputationMarketingWidgets company={{ id: 1190, name: 'Outra Empresa', slug: 'outra-empresa' }} companyId={1190} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeDisabled());
    expect(screen.getByLabelText('HTML gerado')).toHaveValue('');
  });

  it('renders three G2-sized badges in the catalog and circular company logos in the summary', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 3, average_rating: 3.7 }, data_status: 'complete' });
    const withLogo = {
      ...company,
      logo_url: 'https://api.avaliasolar.com.br/rails/active_storage/blobs/weg-logo.png',
    };
    render(<ReputationMarketingWidgets company={withLogo} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    for (const variant of ['blue', 'navy', 'light']) {
      const badge = screen.getByTestId('marketing-star-badge-' + variant);
      expect(badge).toHaveStyle({ width: '120px', height: '54px' });
    }
    const avatars = screen.getAllByTestId('marketing-widget-company-avatar');
    expect(avatars.length).toBeGreaterThanOrEqual(4);
    expect(avatars[0].querySelector('img')).toHaveAttribute('src', withLogo.logo_url);
  });

  it('changes the exported star badge variant without changing the approved rating', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 3, average_rating: 3.7 }, data_status: 'complete' });
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    fireEvent.click(screen.getByTestId('select-widget-stars'));
    expect(screen.getByTestId('star-variant-chooser')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('choose-star-variant-navy'));
    expect(screen.getByTestId('choose-star-variant-navy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('background:#0A1F44'));
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('width:120px;height:54px'));

    fireEvent.click(screen.getByTestId('choose-star-variant-light'));
    expect(screen.getByTestId('choose-star-variant-light')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('background:#FFFFFF'));
    expect(screen.getByLabelText('HTML gerado')).toHaveValue(expect.stringContaining('3,7'));
  });

  it('uses a safe initials fallback and does not publish stars with no approved reviews', async () => {
    render(<ReputationMarketingWidgets company={{ ...company, logo_url: 'javascript:alert(1)' }} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeDisabled());
    expect(screen.getAllByText('Sem avaliações').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('marketing-widget-company-avatar')[0].querySelector('img')).toBeNull();
  });
});
