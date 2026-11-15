import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CompanyReviewsSummarySheet, normalizeRatingDistribution } from './CompanyReviewsSummarySheet';
import { companiesApi, reviewsApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  companiesApi: { getById: jest.fn() },
  reviewsApi: { getAll: jest.fn() },
}));

const companyGet = companiesApi.getById as jest.Mock;
const reviewsGet = reviewsApi.getAll as jest.Mock;

const defaultProps = {
  isOpen: true,
  onOpenChange: jest.fn(),
  companyName: 'Growatt Brasil',
  reviewsPath: '/companies/growatt-brasil#reviews',
  reviewActionPath: '/companies/growatt-brasil#review',
};

describe('CompanyReviewsSummarySheet V2 — dados reais e UX responsivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    companyGet.mockResolvedValue(null);
    reviewsGet.mockResolvedValue([]);
  });

  it('exibe estado vazio honesto quando empresa tem 0 avaliações, ignorando dados fantasmas', () => {
    render(
      <CompanyReviewsSummarySheet
        {...defaultProps}
        ratingAvg={null}
        ratingCount={0}
        sentiment={{ positive: 100, neutral: 0, negative: 0 }}
        recommendationRate={100}
      />
    );
    expect(screen.getByText('Growatt Brasil')).toBeInTheDocument();
    expect(screen.getByText('Avaliações da comunidade')).toBeInTheDocument();
    expect(screen.getByText('Ainda não há avaliações')).toBeInTheDocument();
    expect(screen.getByText(/Sua experiência pode ajudar outras pessoas a escolher/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar esta empresa/i })).toBeInTheDocument();
    expect(screen.queryByText(/100% dos clientes recomendam/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Positivo')).not.toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText(/avaliações registradas/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver todas as avaliações/i })).not.toBeInTheDocument();
    expect(companyGet).not.toHaveBeenCalled();
  });

  it('exibe métricas existentes e CTAs com links preservados', () => {
    render(
      <CompanyReviewsSummarySheet
        {...defaultProps}
        ratingAvg={4.8}
        ratingCount={24}
        sentiment={{ positive: 85, neutral: 10, negative: 5 }}
        recommendationRate={92}
      />
    );
    expect(screen.getByText('4,8')).toBeInTheDocument();
    expect(screen.getByText('24 avaliações registradas')).toBeInTheDocument();
    expect(screen.getByLabelText('Nota 4,8 de 5 estrelas')).toBeInTheDocument();
    expect(screen.getByText('Sentimento das avaliações')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('Recomendação')).toBeInTheDocument();
    expect(screen.getByText(/dos clientes recomendam/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todas as avaliações/i })).toHaveAttribute('href', defaultProps.reviewsPath);
    expect(screen.getByRole('link', { name: /Avaliar esta empresa/i })).toHaveAttribute('href', defaultProps.reviewActionPath);
  });

  it('abre com layout mobile bottom sheet e desktop painel à direita, sem alterar a Brand Page', () => {
    render(<CompanyReviewsSummarySheet {...defaultProps} ratingAvg={4} ratingCount={6} />);
    const panel = screen.getByTestId('reviews-summary-sheet');
    expect(panel).toHaveClass('h-[min(90dvh,780px)]', 'sm:right-0', 'sm:h-dvh');
    expect(screen.getByTestId('reviews-summary-scroll-region')).toHaveClass('overflow-y-auto');
    expect(screen.getByText('Distribuição por estrelas indisponível')).toBeInTheDocument();
  });

  it('lê somente ao abrir, exibe histograma oficial e depoimento aprovado sem inventar nomes', async () => {
    companyGet.mockResolvedValue({
      id: 72,
      review_aggregates: {
        global: {
          average_rating: 4.2,
          total_reviews: 6,
          scores_distribution: { '5': 3, '4': 2, '3': 1, '2': 0, '1': 0 },
        },
      },
    });
    reviewsGet.mockResolvedValue([{
      id: 81,
      rating: 4,
      comment: 'Ótima experiência no projeto.',
      status: 'approved',
      verified: true,
      public_reviewer_name: 'Cliente Solar',
      granular_scores: [{ title: 'Atendimento', score: 4, weight: 1 }],
    }]);

    render(<CompanyReviewsSummarySheet {...defaultProps} companyId={72} ratingAvg={3.0} ratingCount={2} />);

    await waitFor(() => {
      expect(screen.getByText('6 avaliações registradas')).toBeInTheDocument();
      expect(screen.getByTestId('review-rating-distribution')).toBeInTheDocument();
    });
    expect(screen.getByText('4,2')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: '5 estrelas' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('meter', { name: '4 estrelas' })).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByRole('meter', { name: '3 estrelas' })).toHaveAttribute('aria-valuenow', '17');
    expect(screen.getByText('Cliente Solar')).toBeInTheDocument();
    expect(screen.getByText('Cliente verificado')).toBeInTheDocument();
    expect(screen.getByText('Ótima experiência no projeto.')).toBeInTheDocument();
    expect(screen.getByText('Atendimento:')).toBeInTheDocument();
    expect(companyGet).toHaveBeenCalledWith(72);
    expect(reviewsGet).toHaveBeenCalledWith({ company_id: 72, status: 'approved', limit: 1 });
    expect(companyGet).toHaveBeenCalledTimes(1);
    expect(reviewsGet).toHaveBeenCalledTimes(1);
  });

  it('não atribui selo verificado a quem não possui confirmação', async () => {
    companyGet.mockResolvedValue(null);
    reviewsGet.mockResolvedValue([{
      id: 12, rating: 5, status: 'approved', public_reviewer_name: 'Avaliador Público', verified: false,
      comment: 'Tudo certo.',
    }]);
    render(<CompanyReviewsSummarySheet {...defaultProps} companyId={13} ratingAvg={5} ratingCount={1} />);
    expect(await screen.findByText('Avaliador Público')).toBeInTheDocument();
    expect(screen.getByText('Avaliação publicada')).toBeInTheDocument();
    expect(screen.queryByText('Cliente verificado')).not.toBeInTheDocument();
  });

  it('não calcula porcentagens com distribuições incompletas ou inconsistentes', () => {
    expect(normalizeRatingDistribution(null, 6)).toBeNull();
    expect(normalizeRatingDistribution({ '5': 3, '4': 1, '3': 1, '2': 0, '1': 0 }, 6)).toBeNull();
    expect(normalizeRatingDistribution({ '5': 6, '4': -1, '3': 0, '2': 0, '1': 1 }, 6)).toBeNull();
    expect(normalizeRatingDistribution({ '5': 6, '4': 0, '3': 0, '2': 0, '1': 0 }, 0)).toBeNull();
  });

  it('não altera a média nem cria distribuição quando as chamadas falham', async () => {
    companyGet.mockRejectedValue(new Error('API indisponível'));
    reviewsGet.mockRejectedValue(new Error('API indisponível'));

    render(<CompanyReviewsSummarySheet {...defaultProps} companyId={82} ratingAvg={4.1} ratingCount={13} />);
    await waitFor(() => expect(companyGet).toHaveBeenCalled());
    expect(screen.getByText('4,1')).toBeInTheDocument();
    expect(screen.getByText('13 avaliações registradas')).toBeInTheDocument();
    expect(screen.queryByTestId('review-rating-distribution')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todas as avaliações/i })).toBeInTheDocument();
  });

  it('não executa consultas enquanto o sheet permanece fechado', () => {
    render(<CompanyReviewsSummarySheet {...defaultProps} isOpen={false} companyId={23} ratingAvg={4.5} ratingCount={4} />);
    expect(companyGet).not.toHaveBeenCalled();
    expect(reviewsGet).not.toHaveBeenCalled();
  });
});
