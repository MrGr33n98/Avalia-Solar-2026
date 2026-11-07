import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyCTAGroup from './CompanyCTAGroup';
import type { Company } from '@/lib/api';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { openLeadModal } from '@/lib/lead-engine';

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  sendIntentSignal: jest.fn(),
}));

const paidCompany = {
  id: 1,
  name: 'Empresa Teste',
  slug: 'empresa-teste',
  has_paid_plan: true,
  cta_whatsapp_enabled: true,
  cta_whatsapp_url: 'https://wa.me/5547999545370',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('CompanyCTAGroup — only paid conversion channels', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders quote + WhatsApp in one right-aligned shelf without duplicating quick actions', async () => {
    render(<CompanyCTAGroup company={paidCompany} canRequestQuote />);

    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });
    const whatsapp = screen.getByRole('link', { name: 'Falar com Empresa Teste no WhatsApp' });

    expect(quote).toHaveClass('h-11', '!min-h-11', 'w-full', 'text-[12px]', 'font-semibold');
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5547999545370');
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass(
      'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'
    );
    expect(document.getElementById('company-cta-group')).toHaveClass('justify-end');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Avaliar empresa/ })).not.toBeInTheDocument();

    fireEvent.click(whatsapp);
    expect(trackCTAClick).toHaveBeenCalledWith(expect.objectContaining({
      ctaType: 'whatsapp', ctaLocation: 'hero', companyId: '1',
    }));
    fireEvent.click(quote);
    await waitFor(() => expect(openLeadModal).toHaveBeenCalledWith(expect.objectContaining({
      preferredCompanyId: 1, source: 'company-hero',
    })));
  });

  it('Free: never renders paid conversion actions or empty CTA shelf', () => {
    const { container } = render(
      <CompanyCTAGroup company={{ ...paidCompany, has_paid_plan: false }} canRequestQuote />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['no WhatsApp entitlement', { feature_access: { custom_ctas: { state: 'enabled', value: true } } }],
    ['WhatsApp disabled', { cta_whatsapp_enabled: false }],
    ['no WhatsApp contact', { cta_whatsapp_url: null, whatsapp_url: null, whatsapp: null }],
    ['invalid external URL', { cta_whatsapp_url: 'https://evil.example/' }],
  ])('%s: preserves quote while suppressing WhatsApp', (_name, override) => {
    render(<CompanyCTAGroup company={{ ...paidCompany, ...override } as Company} canRequestQuote />);
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass('grid-cols-1');
  });

  it('quote blocked, WhatsApp entitlement active: renders WhatsApp only', () => {
    const company = {
      ...paidCompany,
      feature_access: {
        custom_ctas: { state: 'locked', value: false },
        whatsapp_contact_button: { state: 'enabled', value: true },
      },
    } as unknown as Company;
    render(<CompanyCTAGroup company={company} canRequestQuote />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /no WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass('grid-cols-1');
  });

  it.each([
    [true, true, true, true],
    [true, false, true, false],
    [false, true, false, true],
    [false, false, false, false],
  ])('saved preferences quote=%s WhatsApp=%s => effective quote=%s WhatsApp=%s',
    (quote, whatsapp, expectsQuote, expectsWhatsapp) => {
      const company = {
        ...paidCompany, quote_cta_enabled: quote, cta_whatsapp_enabled: whatsapp,
      } as Company;
      const { container } = render(<CompanyCTAGroup company={company} canRequestQuote />);
      expect(Boolean(screen.queryByRole('button', { name: 'Solicitar orçamento' }))).toBe(expectsQuote);
      expect(Boolean(screen.queryByRole('link', { name: /no WhatsApp/ }))).toBe(expectsWhatsapp);
      expect(Boolean(screen.queryByTestId('company-primary-ctas'))).toBe(expectsQuote || expectsWhatsapp);
      if (!expectsQuote && !expectsWhatsapp) expect(container).toBeEmptyDOMElement();
    }
  );
});
