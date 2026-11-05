import React from 'react';
import { render, screen } from '@testing-library/react';
import PlanAndSubscription from '@/app/dashboard/components/PlanAndSubscription';
import { fetchApiSafe } from '@/lib/api-client';
import { billingApi, type BillingPlan } from '@/lib/api/billing';

jest.mock('@/lib/api-client', () => ({ fetchApiSafe: jest.fn() }));
jest.mock('@/lib/api/billing', () => ({
  billingApi: {
    getPlans: jest.fn(),
    getSubscription: jest.fn(),
    createPortalSession: jest.fn(),
  },
}));

const samplePlans = [
  { id: 12, slug: 'essential', name: 'Essencial', features: {}, summary: 'Presença profissional' },
  { id: 49, slug: 'pro', name: 'Pro', features: {}, summary: 'Vitrine completa' },
] as BillingPlan[];

const entitlements = {
  plan: { id: 12, name: 'Essencial', tier: 'essential' },
  features: {
    company_categories_limit: { state: 'enabled', value: 6, group: 'public_profile' },
    webhooks: { state: 'locked', value: false, group: 'insights' },
  },
  usage: { company_categories_limit: 2 },
};

describe('Plano e Assinatura — contrato e permissões', () => {
  beforeEach(() => {
    (fetchApiSafe as jest.Mock).mockResolvedValue(entitlements);
    (billingApi.getSubscription as jest.Mock).mockResolvedValue(null);
    (billingApi.getPlans as jest.Mock).mockResolvedValue(samplePlans);
  });
  afterEach(() => jest.clearAllMocks());

  it('renders EntitlementService plan/features object and real quota without crashing', async () => {
    const onSelectPlan = jest.fn();
    render(<PlanAndSubscription companyId="1190" onSelectPlan={onSelectPlan} />);
    expect(await screen.findByText('Recursos do seu plano')).toBeInTheDocument();
    expect(screen.getByText('Categorias atendidas').textContent || '').not.toContain('not available');
    expect(screen.getByText(/Utilizado: 2/)).toBeInTheDocument();
    expect(screen.getByText('Disponível no upgrade')).toBeInTheDocument();
    expect(fetchApiSafe).toHaveBeenCalledWith(
      'company_dashboard/subscription?company_id=1190',
      expect.objectContaining({ retries: 0 })
    );
  });

  it('displays explicit permission state rather than mislabeling paid plan inactive', async () => {
    (billingApi.getSubscription as jest.Mock).mockRejectedValue({ status: 403 });
    render(<PlanAndSubscription companyId="1190" />);
    expect(await screen.findByText('Gerenciamento de pagamentos restrito')).toBeInTheDocument();
    expect(screen.getByText('Não confirmado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerenciar pagamento' })).not.toBeInTheDocument();
  });

  it('shows subscription dates only when billing returned actual records', async () => {
    (billingApi.getSubscription as jest.Mock).mockResolvedValue({
      id: 10,
      company_id: 1190,
      plan_id: 12,
      plan: samplePlans[0],
      status: 'active',
      current_period_end: '2027-05-05T12:00:00.000Z',
      cancel_at_period_end: false,
    });
    render(<PlanAndSubscription companyId="1190" />);
    expect(await screen.findByText('05 de maio de 2027')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerenciar pagamento' })).toBeInTheDocument();
  });

  it('fails safely on a malformed server contract', async () => {
    (fetchApiSafe as jest.Mock).mockResolvedValue({ plan_tier: 'pro', features: [] });
    render(<PlanAndSubscription companyId="1190" />);
    expect(await screen.findByText(/servidor retornou um contrato de planos inválido/)).toBeInTheDocument();
    expect(screen.queryByText('Ativa')).not.toBeInTheDocument();
  });

  it('does not mix subscriptions when company changes mid-request', async () => {
    let resolveFirst!: (value: unknown) => void;
    (fetchApiSafe as jest.Mock)
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ...entitlements, plan: { name: 'Pro', tier: 'pro', id: 49 } });
    const { rerender } = render(<PlanAndSubscription companyId="1190" />);
    rerender(<PlanAndSubscription companyId="1290" />);
    expect(await screen.findByRole('heading', { name: 'Plano atual: Pro' })).toBeInTheDocument();
    resolveFirst(entitlements);
    expect(screen.getByRole('heading', { name: 'Plano atual: Pro' })).toBeInTheDocument();
  });
});
