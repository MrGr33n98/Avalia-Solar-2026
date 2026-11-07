import { render, screen } from '@testing-library/react';
import CompanyCTAGroup from '@/app/companies/[id]/components/CompanyCTAGroup';
import type { Company } from '@/lib/api';

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  sendIntentSignal: jest.fn(),
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

describe('CompanyCTAGroup — regression', () => {
  it('renders only two conversion actions; research and social actions live in the header', () => {
    render(<CompanyCTAGroup company={mockCompany} canRequestQuote />);
    expect(screen.getByText('Solicitar orçamento')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /no WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByText('Comparar')).not.toBeInTheDocument();
    expect(screen.queryByText('Avaliar')).not.toBeInTheDocument();
  });
});
