import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanyDirectoryConversionActions } from './CompanyDirectoryConversionActions';
import type { Company } from '@/lib/api';
import { openLeadModal } from '@/lib/lead-engine';
import { trackCTAClick } from '@/lib/analytics/track-cta';

jest.mock('@/lib/lead-engine', () => ({ openLeadModal: jest.fn() }));
jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({ sendIntentSignal: jest.fn() }));
jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => (
    <span data-testid="whatsapp-company-avatar">{name}</span>
  ),
}));

const paid = {
  id: 372,
  name: 'WEG',
  slug: 'weg',
  logo_url: 'https://example.com/logo.png',
  has_paid_plan: true,
  quote_cta_enabled: true,
  cta_whatsapp_enabled: true,
  cta_whatsapp_url: 'https://wa.me/5547999700506',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

const renderActions = (overrides: Partial<Company> = {}) => render(
  <CompanyDirectoryConversionActions company={{ ...paid, ...overrides }} />
);

describe('Directory conversion CTAs — canonical plan entitlement + saved preferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the avatar WhatsApp action and a compact quote CTA for a fully entitled company', () => {
    renderActions();
    const wa = screen.getByRole('link', { name: 'Falar com WEG no WhatsApp' });
    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });
    expect(wa).toHaveAttribute('href', 'https://wa.me/5547999700506');
    expect(wa).toHaveAttribute('target', '_blank');
    expect(wa).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(wa).toHaveClass('h-11', 'w-11');
    expect(screen.getByTestId('whatsapp-company-avatar')).toHaveTextContent('WEG');
    expect(quote).toHaveClass('min-h-11');
    expect(screen.getByTestId('directory-conversion-actions')).toContainElement(quote);
  });

  it('retains the existing quick quote wizard, without navigating to company profile', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar orçamento' }));
    expect(openLeadModal).toHaveBeenCalledTimes(1);
    expect(openLeadModal).toHaveBeenCalledWith({
      preferredCompanyId: 372,
      source: 'company_card',
      type: 'quick',
    });
    expect(trackCTAClick).toHaveBeenCalledWith(expect.objectContaining({
      companyId: '372', ctaType: 'quote', ctaLocation: 'other',
    }));
  });

  it('uses real external WhatsApp and the shared analytics event, without changing its URL', () => {
    renderActions();
    fireEvent.click(screen.getByRole('link', { name: 'Falar com WEG no WhatsApp' }));
    expect(trackCTAClick).toHaveBeenCalledWith(expect.objectContaining({
      companyId: '372', ctaType: 'whatsapp', ctaLocation: 'other',
    }));
  });

  it.each([
    ['free plan', { has_paid_plan: false }],
    ['missing entitlement', { feature_access: undefined }],
    ['trial status without paid confirmation', { has_paid_plan: undefined }],
  ])('fails closed for %s', (_label, overrides) => {
    const { container } = renderActions(overrides as Partial<Company>);
    expect(container).toBeEmptyDOMElement();
    expect(openLeadModal).not.toHaveBeenCalled();
  });

  it('honors quote preference disabled, keeping the entitled WhatsApp action', () => {
    renderActions({ quote_cta_enabled: false });
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Falar com WEG no WhatsApp' })).toBeInTheDocument();
  });

  it.each([
    ['WhatsApp flag off', { cta_whatsapp_enabled: false }],
    ['invalid URL', { cta_whatsapp_url: 'https://malicious.example/offer' }],
    ['no configured contact', { cta_whatsapp_url: null, whatsapp_url: null, whatsapp: null }],
    ['WhatsApp entitlement revoked', {
      feature_access: {
        custom_ctas: { state: 'enabled', value: true },
        whatsapp_contact_button: { state: 'locked', value: false },
      },
    }],
  ])('%s never leaks a WhatsApp contact', (_label, overrides) => {
    renderActions(overrides as Partial<Company>);
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
  });

  it('when only WhatsApp is allowed, quote is hidden', () => {
    renderActions({
      feature_access: {
        custom_ctas: { state: 'locked', value: false },
        whatsapp_contact_button: { state: 'enabled', value: true },
      },
    });
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Falar com WEG no WhatsApp' })).toBeInTheDocument();
  });

  it('does not infer WhatsApp from generic phone', () => {
    renderActions({ cta_whatsapp_url: null, whatsapp_url: null, whatsapp: null, phone: '47999545370' });
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
  });
});
