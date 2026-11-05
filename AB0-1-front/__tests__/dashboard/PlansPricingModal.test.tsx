import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlansPricingModal } from '@/app/dashboard/components/PlansPricingModal';
import { billingApi } from '@/lib/api/billing';
import type { BillingPlan } from '@/lib/api/billing';

jest.mock('@/lib/api/billing', () => ({
  billingApi: { getPlans: jest.fn() },
}));

const plans = [
  { id: 1, slug: 'free', name: 'Gratuito', features: {}, summary: 'Perfil básico' },
  { id: 12, slug: 'essential', name: 'Essencial', features: { custom_ctas: true }, summary: 'Presença premium' },
  { id: 41, slug: 'pro', name: 'Pro', features: { media_gallery: true }, summary: 'Visibilidade comercial' },
  { id: 54, slug: 'enterprise', name: 'Enterprise', features: {}, summary: 'Sob medida' },
] as BillingPlan[];

describe('PlansPricingModal — upgrade real', () => {
  beforeEach(() => {
    (billingApi.getPlans as jest.Mock).mockResolvedValue(plans);
  });

  afterEach(() => jest.clearAllMocks());

  it('loads real plan IDs and keeps current plan unavailable for duplicate checkout', async () => {
    const onSelectPlan = jest.fn();
    render(<PlansPricingModal open onOpenChange={jest.fn()} currentPlanTier="free" onSelectPlan={onSelectPlan} />);
    expect(await screen.findByRole('heading', { name: 'Essencial' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enterprise' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plano atual: Gratuito' })).toBeDisabled();
    expect(screen.getByText('R$ 590,00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar plano: Essencial' }));
    expect(onSelectPlan).toHaveBeenCalledWith(plans[1], 'twelve_months');
  });

  it('passes a six-month period to checkout rather than only changing displayed prices', async () => {
    const onSelectPlan = jest.fn();
    render(<PlansPricingModal open onOpenChange={jest.fn()} currentPlanTier="free" onSelectPlan={onSelectPlan} />);
    await screen.findByRole('heading', { name: 'Essencial' });
    fireEvent.click(screen.getByRole('tab', { name: '6 meses' }));
    expect(screen.getByText('R$ 330,00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar plano: Pro' }));
    expect(onSelectPlan).toHaveBeenCalledWith(plans[2], 'six_months');
  });

  it('fails closed when plan catalogue is unavailable', async () => {
    (billingApi.getPlans as jest.Mock).mockRejectedValue(new Error('network'));
    const onSelectPlan = jest.fn();
    render(<PlansPricingModal open onOpenChange={jest.fn()} currentPlanTier="free" onSelectPlan={onSelectPlan} />);
    expect(await screen.findByText('O catálogo de planos não está disponível no momento. Nenhuma contratação foi iniciada.')).toBeInTheDocument();
    expect(onSelectPlan).not.toHaveBeenCalled();
  });
});
