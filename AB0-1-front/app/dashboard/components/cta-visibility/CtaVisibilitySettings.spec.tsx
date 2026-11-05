import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import '@testing-library/jest-dom';
import CtaVisibilitySettings from './CtaVisibilitySettings';
import { fetchApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
    <a {...props}>{children}</a>,
}));

const fetchMock = fetchApi as jest.Mock;
const active = {
  company_id: 372,
  preferences: { quote_cta_enabled: true, whatsapp_enabled: true },
  availability: { quote: true, whatsapp: true, whatsapp_configured: true },
  effective: { quote: true, whatsapp: true },
  version: 0,
};

describe('Brand Page CTA visibility controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockImplementation((_url, options) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ...active, version: 1,
          preferences: JSON.parse(options.body),
        });
      }
      return Promise.resolve(active);
    });
  });

  it('loads the correct tenant and previews both eligible channels', async () => {
    render(<CtaVisibilitySettings companyId="372" />);
    await waitFor(() => expect(screen.getByTestId('cta-checkbox-quote_cta_enabled')).toBeChecked());
    expect(screen.getByTestId('cta-checkbox-whatsapp_enabled')).toBeChecked();
    expect(screen.getByTestId('cta-preview')).toHaveTextContent('Solicitar orçamento');
    expect(screen.getByTestId('cta-preview')).toHaveTextContent('WhatsApp');
    expect(fetchMock).toHaveBeenCalledWith('/company_dashboard/cta_visibility',
      expect.objectContaining({ method: 'GET', params: { company_id: '372' } }));
  });

  it('supports either single CTA or no contact CTA without removing compare/review', async () => {
    render(<CtaVisibilitySettings companyId="372" />);
    const quote = await screen.findByTestId('cta-checkbox-quote_cta_enabled');
    const whatsapp = screen.getByTestId('cta-checkbox-whatsapp_enabled');
    fireEvent.click(quote);
    expect(screen.getByTestId('cta-preview')).not.toHaveTextContent('Solicitar orçamento');
    expect(screen.getByTestId('cta-preview')).toHaveTextContent('WhatsApp');
    fireEvent.click(whatsapp);
    expect(screen.getByTestId('cta-preview')).not.toHaveTextContent('WhatsApp');
    expect(screen.getByTestId('cta-preview')).toHaveTextContent('Comparar');
    expect(screen.getByTestId('cta-preview')).toHaveTextContent('Avaliar');
    fireEvent.click(screen.getByTestId('save-cta-visibility'));
    await waitFor(() => expect(track).toHaveBeenCalledWith('company_cta_visibility_saved',
      expect.objectContaining({ company_id: '372' })));
    const request = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PATCH');
    expect(JSON.parse(request[1].body)).toMatchObject({
      quote_cta_enabled: false, whatsapp_enabled: false, expected_version: 0,
    });
  });

  it('rolls back a failed update and reports failure without showing it as published', async () => {
    fetchMock.mockImplementation((_url, options) => options?.method === 'PATCH'
      ? Promise.reject(new Error('409')) : Promise.resolve(active));
    render(<CtaVisibilitySettings companyId="372" />);
    const checkbox = await screen.findByTestId('cta-checkbox-quote_cta_enabled');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('save-cta-visibility'));
    await waitFor(() => expect(screen.getByText(/não foram publicadas/)).toBeInTheDocument());
    expect(checkbox).toBeChecked();
    expect(track).toHaveBeenCalledWith('company_cta_visibility_save_failed', expect.any(Object));
  });

  it('disables enabling unavailable channels but permits turning an old preference off', async () => {
    fetchMock.mockResolvedValueOnce({
      ...active,
      preferences: { quote_cta_enabled: false, whatsapp_enabled: true },
      availability: { quote: false, whatsapp: false, whatsapp_configured: false },
      effective: { quote: false, whatsapp: false },
    });
    render(<CtaVisibilitySettings companyId="372" />);
    const quote = await screen.findByTestId('cta-checkbox-quote_cta_enabled');
    const whatsapp = screen.getByTestId('cta-checkbox-whatsapp_enabled');
    expect(quote).toBeDisabled();
    expect(whatsapp).toBeEnabled();
    expect(screen.getByTestId('cta-preview')).not.toHaveTextContent('WhatsApp');
    expect(screen.getByTestId('cta-preview')).not.toHaveTextContent('Solicitar orçamento');
  });

  it('does not display tenant A preferences when switching to tenant B', async () => {
    const { rerender } = render(<CtaVisibilitySettings companyId="372" />);
    await waitFor(() => expect(screen.getByTestId('cta-checkbox-quote_cta_enabled')).toBeChecked());
    fetchMock.mockImplementation((_url, opts) => opts.params.company_id === '1190'
      ? Promise.resolve({ ...active, company_id: 1190,
          preferences: { quote_cta_enabled: false, whatsapp_enabled: false } })
      : Promise.resolve(active));
    rerender(<CtaVisibilitySettings companyId="1190" />);
    await waitFor(() => expect(screen.getByTestId('cta-checkbox-quote_cta_enabled')).not.toBeChecked());
    expect(screen.getByTestId('cta-checkbox-whatsapp_enabled')).not.toBeChecked();
  });
});
