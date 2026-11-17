import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ReviewsPreview from '@/app/companies/[id]/components/ReviewsPreview';
import type { Company } from '@/lib/api';

jest.mock('@/components/company/ReviewWhatsAppButton', () => ({
  __esModule: true,
  default: () => null,
}));

const baseCompany = {
  id: 372,
  name: 'Empresa de teste',
  slug: 'empresa-de-teste',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
} as Company;

function renderReviewsPreview(rating: number, count: number) {
  const company: Company = {
    ...baseCompany,
    rating_avg: rating,
    rating_count: count,
  };

  render(
    <ReviewsPreview
      company={company}
      reviews={[]}
      reviewsLoading={false}
      onTabChange={jest.fn()}
    />
  );
}

describe('ReviewsPreview — estrelas da reputação geral', () => {
  it('preenche quatro estrelas para nota 4.0 com seis avaliações', () => {
    renderReviewsPreview(4, 6);

    const rating = screen.getByRole('img', { name: 'Avaliação: 4.0 de 5 estrelas' });
    const icons = within(rating).getAllByTestId('star-icon');

    expect(icons).toHaveLength(5);
    expect(icons.filter((icon) => icon.classList.contains('fill-yellow-400'))).toHaveLength(4);
    expect(icons.filter((icon) => icon.classList.contains('fill-gray-200'))).toHaveLength(1);
    expect(screen.getByText('(6 opiniões)')).toBeInTheDocument();
  });

  it('exibe meia estrela para nota 4.5', () => {
    renderReviewsPreview(4.5, 6);

    const rating = screen.getByRole('img', { name: 'Avaliação: 4.5 de 5 estrelas' });
    const icons = within(rating).getAllByTestId('star-icon');

    expect(icons).toHaveLength(5);
    expect(icons.filter((icon) => icon.classList.contains('lucide-star-half'))).toHaveLength(1);
  });

  it('preenche cinco estrelas para nota 5.0', () => {
    renderReviewsPreview(5, 6);

    const rating = screen.getByRole('img', { name: 'Avaliação: 5.0 de 5 estrelas' });
    const icons = within(rating).getAllByTestId('star-icon');

    expect(icons).toHaveLength(5);
    expect(icons.every((icon) => icon.classList.contains('fill-yellow-400'))).toBe(true);
  });

  it('não exibe estrelas ou resumo numérico sem avaliações', () => {
    renderReviewsPreview(5, 0);

    expect(screen.queryByRole('img', { name: /Avaliação: .* de 5 estrelas/ })).not.toBeInTheDocument();
    expect(screen.queryByText('(0 opiniões)')).not.toBeInTheDocument();
  });
  it('altera somente o CTA do estado vazio; mantém Avaliar no cabeçalho e abre a aba', () => {
    const onTabChange = jest.fn();
    render(
      <ReviewsPreview
        company={{ ...baseCompany, rating_avg: 0, rating_count: 0 }}
        reviews={[]}
        reviewsLoading={false}
        onTabChange={onTabChange}
      />
    );

    const emptyCta = screen.getByRole('button', { name: 'Deixe aqui sua Avaliação' });
    expect(emptyCta).toHaveAttribute('data-testid', 'brand-empty-review-cta');
    expect(emptyCta).toHaveClass('rounded-full', 'min-h-12', 'bg-[#F2F4F6]');
    expect(emptyCta.querySelector('svg')).toHaveClass('lucide-message-circle');
    const headerCta = screen.getByRole('link', { name: /Avaliar/ });
    expect(headerCta).toHaveAttribute('href', '/companies/empresa-de-teste/review');
    expect(headerCta).toHaveTextContent('Avaliar');
    fireEvent.click(emptyCta);
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('reviews');
  });

  it('não mostra a chamada longa quando já existem avaliações', () => {
    renderReviewsPreview(4.9, 8);
    expect(screen.queryByRole('button', { name: 'Deixe aqui sua Avaliação' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar/ })).toHaveTextContent('Avaliar');
  });

});
