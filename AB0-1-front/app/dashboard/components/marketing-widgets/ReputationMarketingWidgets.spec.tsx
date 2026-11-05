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
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('4,7');
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
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('Excelente atendimento');
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
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('background:#0A1F44');
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('width:120px;height:54px');

    fireEvent.click(screen.getByTestId('choose-star-variant-light'));
    expect(screen.getByTestId('choose-star-variant-light')).toHaveAttribute('aria-pressed', 'true');
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('background:#FFFFFF');
    expect((screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value).toContain('3,7');
  });

  it('centers and contains a rectangular WEG logo in summary, stars and customizer', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 3, average_rating: 3.7 }, data_status: 'complete' });
    const withLogo = {
      id: 372,
      name: 'WEG',
      slug: 'weg',
      logo_url: 'https://api.avaliasolar.com.br/assets/weg-wide.png',
    };
    render(<ReputationMarketingWidgets company={withLogo} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    const summaryAvatar = screen.getAllByTestId('marketing-widget-company-avatar')
      .find((avatar) => avatar.getAttribute('style')?.includes('width: 36px'));
    expect(summaryAvatar).toHaveStyle({ width: '36px', height: '36px', padding: '1px' });
    expect(summaryAvatar?.querySelector('img')).toHaveClass('object-contain', 'object-center', 'h-full', 'w-full', 'rounded-full');

    const darkBadge = screen.getByTestId('marketing-star-badge-navy');
    const navyAvatar = darkBadge.querySelector('[data-testid="marketing-widget-company-avatar"]');
    const navyImage = navyAvatar?.querySelector('img');
    expect(navyAvatar).toHaveStyle({ width: '22px', height: '22px', padding: '1px' });
    expect(navyAvatar).toHaveClass('rounded-full', 'bg-[#0B132B]');
    expect(navyImage).toHaveClass('object-contain', 'object-center', 'grayscale', 'invert', 'mix-blend-screen');
    expect(navyImage).toHaveAttribute('src', withLogo.logo_url);

    fireEvent.click(screen.getByTestId('select-widget-stars'));
    // A single 54px badge should not float inside a 154px tall empty canvas.
    const customizer = document.getElementById('widget-customizer')!;
    const compactStage = customizer.querySelector('[class*="min-h-"]');
    expect(compactStage).toHaveClass('min-h-[96px]');
    fireEvent.click(screen.getByTestId('choose-star-variant-navy'));
    const renderedHtml = (screen.getByLabelText('HTML gerado') as HTMLTextAreaElement).value;
    expect(renderedHtml).toContain('width:100%;height:100%');
    expect(renderedHtml).toContain('object-fit:contain');
    expect(renderedHtml).toContain('object-position:center center');
    expect(renderedHtml).toContain('filter:grayscale(1) invert(1) contrast(3)');
    expect(renderedHtml).toContain('background:#0B132B');
  });

  it('falls back to initials on a broken logo while retaining a neutral circular surface', async () => {
    const withLogo = {
      ...company,
      logo_url: 'https://api.avaliasolar.com.br/assets/unavailable.png',
    };
    render(<ReputationMarketingWidgets company={withLogo} companyId={372} />);
    const avatar = screen.getAllByTestId('marketing-widget-company-avatar')[0];
    const image = avatar.querySelector('img');
    expect(image).toHaveClass('object-contain');
    fireEvent.error(image!);
    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar).toHaveTextContent('KE');
    expect(avatar).toHaveClass('bg-white');
  });

  it('uses a safe initials fallback and does not publish stars with no approved reviews', async () => {
    render(<ReputationMarketingWidgets company={{ ...company, logo_url: 'javascript:alert(1)' }} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeDisabled());
    expect(screen.getAllByText('Sem avaliações').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('marketing-widget-company-avatar')[0].querySelector('img')).toBeNull();
  });

  it('preserves Avalia Solar BrandLogo, displays verification seal and toggles optional JSON-LD', async () => {
    stats.mockResolvedValue({ stats: { approved_reviews: 8, average_rating: 4.8 }, data_status: 'complete' });
    render(<ReputationMarketingWidgets company={company} companyId={372} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar HTML estático/ })).toBeEnabled());
    expect(screen.getAllByAltText('Avalia Solar').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Auditado por Avalia Solar/i).length).toBeGreaterThan(0);

    const textarea = screen.getByLabelText('HTML gerado') as HTMLTextAreaElement;
    expect(textarea.value).not.toContain('<script type="application/ld+json">');
    expect(textarea.value).toContain('data-avalia-verified="true"');

    fireEvent.click(screen.getByTestId('toggle-widget-jsonld'));
    expect(screen.getByTestId('toggle-widget-jsonld')).toHaveAttribute('aria-pressed', 'true');
    expect(textarea.value).toContain('<script type="application/ld+json">');
    expect(textarea.value).toContain('"@type":"AggregateRating"');
  });
});
