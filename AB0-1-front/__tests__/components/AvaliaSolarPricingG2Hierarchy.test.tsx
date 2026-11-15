import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AvaliaSolarPricingFiberyAdapted from '@/components/pricing/AvaliaSolarPricingFiberyAdapted';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Avalia Solar pricing — G2-inspired price presentation', () => {
  it('highlights the contracted annual totals rather than monthly equivalents', () => {
    render(<AvaliaSolarPricingFiberyAdapted showHeader={false} showFooter={false} />);

    expect(screen.getAllByText('R$ 590').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$ 1.500').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Equivale a R\$ 49,17\/mês/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Mais visibilidade para sua empresa/i })).toBeInTheDocument();
    expect(screen.getAllByText('Sob consulta').length).toBeGreaterThan(0);
  });

  it('keeps the billing cycle selector and checkout callback contract', () => {
    const onPlanSelect = jest.fn();
    render(
      <AvaliaSolarPricingFiberyAdapted
        showHeader={false}
        showFooter={false}
        onPlanSelect={onPlanSelect}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /6 meses/i })[0]);

    expect(screen.getAllByText('R$ 330').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$ 840').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /Escolher Pro/i })[0]);
    expect(onPlanSelect).toHaveBeenCalledWith('pro', 'six_months');
  });
});
