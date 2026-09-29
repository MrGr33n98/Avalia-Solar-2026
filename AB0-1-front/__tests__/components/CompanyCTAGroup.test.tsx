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
};

describe('CompanyCTAGroup', () => {
  it('renders primary 3-CTA row: Solicitar contato, Comparar, and Avaliar empresa', () => {
    render(
      <CompanyCTAGroup company={mockCompany} canRequestQuote={true} />
    );

    expect(screen.getByText('Solicitar contato')).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.getByText('Avaliar empresa')).toBeInTheDocument();
  });
});
