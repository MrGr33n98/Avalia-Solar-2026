import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BrandPageCTAVisibility from './BrandPageCTAVisibility';
import { fetchApi } from '@/lib/api';
import type { Company } from '@/lib/api';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));
const toast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: (...args: unknown[]) => toast(...args) }) }));

const company = {
  id: 372,
  name: 'Empresa de Teste',
  has_paid_plan: true,
  quote_cta_enabled: true,
  whatsapp_enabled: true,
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('BrandPageCTAVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchApi as jest.Mock).mockResolvedValue({ quote_cta_enabled: false, whatsapp_enabled: true });
  });

  it('displays two independently configurable preferences', () => {
    render(<BrandPageCTAVisibility company={company} companyId="372" />);
    expect(screen.getByRole('checkbox', { name: 'Exibir Solicitar orçamento' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' })).toBeChecked();
  });

  it('sends a single company-scoped boolean update and does not alter the other field', async () => {
    render(<BrandPageCTAVisibility company={company} companyId="372" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Exibir Solicitar orçamento' }));
    await waitFor(() => expect(fetchApi).toHaveBeenCalledWith(
      '/company_dashboard/cta_visibility',
      expect.objectContaining({
        method: 'PATCH',
        params: { company_id: '372' },
        body: JSON.stringify({ quote_cta_enabled: false }),
      }),
    ));
    expect(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' })).toBeChecked();
  });

  it('blocks paid controls on the free plan even if preferences were previously true', () => {
    render(<BrandPageCTAVisibility company={{ ...company, has_paid_plan: false }} companyId="372" />);
    expect(screen.getByRole('checkbox', { name: 'Exibir Solicitar orçamento' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' })).not.toBeChecked();
  });

  it('rolls back when saving fails', async () => {
    (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
    render(<BrandPageCTAVisibility company={company} companyId="372" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Exibir WhatsApp' })).toBeChecked());
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});
