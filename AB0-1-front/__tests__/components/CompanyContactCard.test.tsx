import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyContactCard from '@/app/companies/[id]/components/CompanyContactCard';
import { Company } from '@/lib/api';
import { openSignupGate } from '@/lib/signup-gate';
import { trackCTAClick } from '@/lib/analytics/track-cta';

const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/signup-gate', () => ({
  openSignupGate: jest.fn(),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useCopyIntent: jest.fn(() => ({
    onCopy: jest.fn(),
  })),
  useHoverIntent: jest.fn(() => ({
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
  })),
}));

const mockCompany: Company = {
  id: 101,
  slug: 'weg-solar',
  name: 'WEG Solar',
  city: 'Jaraguá do Sul',
  state: 'SC',
  status: 'active',
  verified: true,
  category: 'energia-solar',
  description: 'Fabricante de soluções solares',
  website: 'https://www.weg.net/',
  phone: '0800 701 0701',
  email: 'energia@weg.net',
  address: 'Av. Prefeito Waldemar Grubba, 3300',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('CompanyContactCard (2x2 Grid Composition)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });
  });

  it('renders 2x2 grid composition matching the screenshot with all 4 items and labels', () => {
    render(<CompanyContactCard company={mockCompany} />);

    // Header
    expect(screen.getByText('Informações de Contato')).toBeInTheDocument();

    // 4 items values
    expect(screen.getByText('0800 701 0701')).toBeInTheDocument();
    expect(screen.getByText('energia@weg.net')).toBeInTheDocument();
    expect(screen.getByText('www.weg.net')).toBeInTheDocument();
    expect(screen.getByText('Jaraguá do Sul, SC')).toBeInTheDocument();

    // 4 items labels in Title Case
    expect(screen.getByText('Telefone comercial')).toBeInTheDocument();
    expect(screen.getByText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
  });

  it('masks phone and email for unauthenticated users and triggers signup gate on click', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<CompanyContactCard company={mockCompany} />);

    // Should show masked values
    expect(screen.getByText('0800 7****')).toBeInTheDocument();
    expect(screen.getByText('ene****@weg.net')).toBeInTheDocument();

    // Should render "Ver" badges
    const verBadges = screen.getAllByText('Ver');
    expect(verBadges).toHaveLength(2);

    // Clicking masked phone opens signup gate
    const phoneLink = screen.getByText('0800 7****').closest('a');
    expect(phoneLink).toBeInTheDocument();
    fireEvent.click(phoneLink!);

    expect(openSignupGate).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'contact_reveal',
        title: 'Crie sua conta para ver os contatos',
      })
    );
  });

  it('tracks CTA click when authenticated user clicks phone', async () => {
    render(<CompanyContactCard company={mockCompany} />);

    const phoneLink = screen.getByText('0800 701 0701').closest('a');
    fireEvent.click(phoneLink!);

    expect(trackCTAClick).toHaveBeenCalledWith(
      expect.objectContaining({
        ctaType: 'phone',
        ctaLocation: 'sidebar',
        companyId: '101',
        companyName: 'WEG Solar',
      })
    );
  });

  it('tracks CTA click when user clicks website', async () => {
    render(<CompanyContactCard company={mockCompany} />);

    const websiteLink = screen.getByText('www.weg.net').closest('a');
    fireEvent.click(websiteLink!);

    expect(trackCTAClick).toHaveBeenCalledWith(
      expect.objectContaining({
        ctaType: 'website',
        ctaLocation: 'sidebar',
        companyId: '101',
        companyName: 'WEG Solar',
      })
    );
  });

  it('renders null when company has no contact information', () => {
    const emptyCompany: Company = {
      ...mockCompany,
      phone: '',
      whatsapp: '',
      email: '',
      email_public: '',
      website: '',
      city: '',
      state: '',
      address: '',
    };

    const { container } = render(<CompanyContactCard company={emptyCompany} />);
    expect(container.firstChild).toBeNull();
  });

  it('supports hiding the header when hideHeader prop is true', () => {
    render(<CompanyContactCard company={mockCompany} hideHeader />);
    expect(screen.queryByText('Informações de Contato')).not.toBeInTheDocument();
    expect(screen.getByText('0800 701 0701')).toBeInTheDocument();
  });
});
