import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlansPricingModal } from '@/app/dashboard/components/PlansPricingModal';

describe('PlansPricingModal', () => {
  it('renders modal with all 4 official plans and correct reference prices when open', () => {
    const handleSelectPlan = jest.fn();
    render(
      <PlansPricingModal
        open={true}
        onOpenChange={jest.fn()}
        currentPlanTier="free"
        onSelectPlan={handleSelectPlan}
      />
    );

    // Title
    expect(screen.getByText('Escolha o plano ideal para sua empresa')).toBeInTheDocument();

    // 4 Plans
    expect(screen.getByRole('heading', { level: 3, name: 'Gratuito' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Essencial' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Enterprise' })).toBeInTheDocument();

    // Pro Featured Badge
    expect(screen.getByText('⭐ MAIS VENDIDO')).toBeInTheDocument();

    // Annual prices by default
    expect(screen.getByText('R$ 590')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500')).toBeInTheDocument();

    // Current plan button is disabled
    expect(screen.getByRole('button', { name: 'Plano Atual' })).toBeDisabled();

    // Select Essencial
    const essencialButton = screen.getByRole('button', { name: 'Escolher Essencial' });
    fireEvent.click(essencialButton);
    expect(handleSelectPlan).toHaveBeenCalledWith('essential');

    // Select Pro
    const proButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
    fireEvent.click(proButton);
    expect(handleSelectPlan).toHaveBeenCalledWith('pro');
  });

  it('switches between annual and monthly equivalent billing view', () => {
    render(
      <PlansPricingModal
        open={true}
        onOpenChange={jest.fn()}
        currentPlanTier="free"
      />
    );

    // Switch to monthly equivalent
    const monthlyToggle = screen.getByRole('button', { name: /mensal equivalente/i });
    fireEvent.click(monthlyToggle);

    expect(screen.getByText('R$ 49,17')).toBeInTheDocument();
    expect(screen.getByText('R$ 125,00')).toBeInTheDocument();
  });
});
