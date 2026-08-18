import { render, screen } from '@testing-library/react';
import { CreatorReviewCard, type CreatorReview } from './CreatorReviewCard';

jest.mock('@/components/reviews/ReviewMediaGallery', () => ({
  ReviewMediaGallery: () => null,
}));

const review = (pros: string[], cons: string[]): CreatorReview => ({
  id: 1,
  created_at: '2026-08-18T00:00:00Z',
  rating: 4,
  headline: 'Avaliação',
  pros,
  cons,
});

describe('CreatorReviewCard', () => {
  it('não renderiza blocos quando listas estão vazias', () => {
    render(<CreatorReviewCard review={review([], [])} />);

    expect(screen.queryByText('O que foi bom')).not.toBeInTheDocument();
    expect(screen.queryByText('O que melhorar')).not.toBeInTheDocument();
  });

  it('ignora marcadores JSON vazios', () => {
    render(<CreatorReviewCard review={review(['[]'], ['[]'])} />);

    expect(screen.queryByText('[]')).not.toBeInTheDocument();
    expect(screen.queryByText('O que foi bom')).not.toBeInTheDocument();
    expect(screen.queryByText('O que melhorar')).not.toBeInTheDocument();
  });

  it('renderiza somente bloco com conteúdo real', () => {
    render(<CreatorReviewCard review={review(['Atendimento rápido'], [])} />);

    expect(screen.getByText('Atendimento rápido')).toBeInTheDocument();
    expect(screen.getByText('O que foi bom')).toBeInTheDocument();
    expect(screen.queryByText('O que melhorar')).not.toBeInTheDocument();
  });

  it('renderiza pros e cons reais', () => {
    render(<CreatorReviewCard review={review(['Atendimento rápido'], ['Demorou para responder'])} />);

    expect(screen.getByText('O que foi bom')).toBeInTheDocument();
    expect(screen.getByText('O que melhorar')).toBeInTheDocument();
  });
});