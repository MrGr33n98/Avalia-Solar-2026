import { render, screen } from '@testing-library/react';

import { CategoryCardsErrorBoundary } from '@/components/landing/CategoryCardsErrorBoundary';

function BrokenCategoryGrid() {
  throw new Error('render boom');
}

describe('CategoryCardsErrorBoundary', () => {
  it('shows fallback UI when child render throws', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <CategoryCardsErrorBoundary>
        <BrokenCategoryGrid />
      </CategoryCardsErrorBoundary>
    );

    expect(screen.getByText('Nao foi possivel renderizar os cards de categoria.')).toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
