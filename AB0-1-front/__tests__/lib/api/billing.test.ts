import { billingApi } from '@/lib/api/billing';
import { fetchApiSafe } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  fetchApiSafe: jest.fn(),
}));

describe('billingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchApiSafe as jest.Mock).mockResolvedValue({ checkout_url: 'https://checkout.stripe.com/pay/cs_test' });
  });

  it('sends an Idempotency-Key when creating a checkout session', async () => {
    await billingApi.createCheckoutSession(
      10,
      2,
      'https://www.avaliasolar.com.br/dashboard?checkout=success',
      'https://www.avaliasolar.com.br/pricing'
    );

    expect(fetchApiSafe).toHaveBeenCalledWith(
      'billing/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          company_id: 10,
          plan_id: 2,
          billing_cycle: 'monthly',
          success_url: 'https://www.avaliasolar.com.br/dashboard?checkout=success',
          cancel_url: 'https://www.avaliasolar.com.br/pricing',
        }),
      })
    );
  });
});
