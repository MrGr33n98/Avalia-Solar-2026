import { fireEvent, render, screen } from '@testing-library/react';
import { CreatorReviewCard, type CreatorReview } from './CreatorReviewCard';

jest.mock('@/components/reviews/ReviewMediaGallery', () => ({
  ReviewMediaGallery: () => null,
}));

const mockReview = (pros: string[] = [], cons: string[] = []): CreatorReview => ({
  id: 1,
  created_at: '2026-08-18T00:00:00Z',
  rating: 4,
  headline: 'Ótima experiência',
  comment: 'Excelente atendimento e prazo.',
  company: { id: 10, name: 'GoodWe Brasil', logo_url: '/logos/goodwe.png' },
  pros,
  cons,
  buyer_tip: 'Recomendo solicitar orçamento antecipado',
});

describe('CreatorReviewCard', () => {
  it('renderiza inicialmente recolhido (collapsed) por padrão', () => {
    render(<CreatorReviewCard review={mockReview()} />);

    // Header visible
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('GoodWe Brasil')).toBeInTheDocument();

    // Details hidden initially
    expect(screen.queryByText('Ótima experiência')).not.toBeInTheDocument();
    expect(screen.queryByText('Excelente atendimento e prazo.')).not.toBeInTheDocument();
    expect(screen.queryByText('Recomendo solicitar orçamento antecipado')).not.toBeInTheDocument();
  });

  it('expande ao clicar no header e exibe detalhes do review', () => {
    render(<CreatorReviewCard review={mockReview(['Atendimento rápido'], ['Demorou para responder'])} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ótima experiência')).toBeInTheDocument();
    expect(screen.getByText('Excelente atendimento e prazo.')).toBeInTheDocument();
    expect(screen.getByText('Atendimento rápido')).toBeInTheDocument();
    expect(screen.getByText('Demorou para responder')).toBeInTheDocument();
    expect(screen.getByText('Recomendo solicitar orçamento antecipado')).toBeInTheDocument();
  });

  it('recolhe detalhes ao clicar novamente', () => {
    render(<CreatorReviewCard review={mockReview()} />);

    const button = screen.getByRole('button');

    // First click: expand
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ótima experiência')).toBeInTheDocument();

    // Second click: collapse
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Ótima experiência')).not.toBeInTheDocument();
  });

  it('trata company === null de forma segura com fallback', () => {
    const reviewWithoutCompany: CreatorReview = {
      ...mockReview(),
      company: null,
    };

    render(<CreatorReviewCard review={reviewWithoutCompany} />);

    expect(screen.getByText('Empresa não identificada')).toBeInTheDocument();
  });

  it('não renderiza blocos pros/cons quando listas estão vazias ao expandir', () => {
    render(<CreatorReviewCard review={mockReview([], [])} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('O que foi bom')).not.toBeInTheDocument();
    expect(screen.queryByText('O que melhorar')).not.toBeInTheDocument();
  });

  it('ignora marcadores JSON vazios ao expandir', () => {
    render(<CreatorReviewCard review={mockReview(['[]'], ['[]'])} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('[]')).not.toBeInTheDocument();
    expect(screen.queryByText('O que foi bom')).not.toBeInTheDocument();
    expect(screen.queryByText('O que melhorar')).not.toBeInTheDocument();
  });
});