import { render, screen } from '@testing-library/react';
import CompanyCTAGroup from '@/app/companies/[id]/components/CompanyCTAGroup';
import { Company } from '@/lib/api';

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: jest.fn().mockReturnValue(false),
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
  }),
}));

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const mockCompany: Company = {
  id: 100,
  name: 'WEG',
  slug: 'weg',
  phone: '4733330000',
  description: 'Soluções que impulsionam um futuro mais sustentável.',
  cta_whatsapp_enabled: true,
  cta_whatsapp_url: 'https://wa.me/5547999545370',
  has_paid_plan: true,
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
};

describe('CompanyCTAGroup', () => {
  it('renders two compact rows with paid Orçamento and WhatsApp, and public Comparar and Avaliar', () => {
    render(
      <CompanyCTAGroup company={mockCompany} canRequestQuote={true} />
    );

    expect(screen.getByText('Solicitar orçamento')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /no WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.getByText('Avaliar')).toBeInTheDocument();
  });
});
