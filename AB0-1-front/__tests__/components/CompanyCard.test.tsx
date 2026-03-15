import { render, screen } from '@testing-library/react';
import CompanyCard from '@/components/CompanyCard';
import { Company } from '@/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <svg data-testid="star-icon" />,
  StarHalf: () => <svg data-testid="star-half-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
  Building: () => <svg data-testid="building-icon" />,
  Share2: () => <svg data-testid="share-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  BadgeCheck: () => <svg data-testid="badge-check-icon" />,
  Scale: () => <svg data-testid="scale-icon" />,
  MessageCircle: () => <svg data-testid="message-circle-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  CreditCard: () => <svg data-testid="credit-card-icon" />,
  Facebook: () => <svg data-testid="facebook-icon" />,
  Instagram: () => <svg data-testid="instagram-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  Twitter: () => <svg data-testid="twitter-icon" />,
}));

describe('CompanyCard', () => {
  const mockCompany: Company = {
    id: 1,
    name: 'Energia Solar LTDA',
    logo_url: 'https://example.com/logo.jpg',
    banner_url: 'https://example.com/banner.jpg',
    description: 'Especialistas em instalacao de paineis solares com mais de 10 anos de experiencia',
    city: 'Sao Paulo',
    state: 'SP',
    average_rating: 4.5,
    rating_count: 120,
    website: 'https://example.com',
    category_name: 'Paineis Solares',
  };

  it('renders main company info', () => {
    render(<CompanyCard company={mockCompany} />);

    const companyLinks = screen.getAllByRole('link', { name: /Energia Solar LTDA/i });
    const profileLink = companyLinks.find((link) => (link as HTMLAnchorElement).getAttribute('href') === '/companies/energia-solar-ltda');
    expect(profileLink).toBeTruthy();
    expect(screen.getByText(/Sao Paulo, SP/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Paineis Solares/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\(120\)/)).toBeInTheDocument();
  });

  it('omits location when city/state are missing', () => {
    const minimalCompany: Company = {
      id: 2,
      name: 'Minimal Company',
      average_rating: 0,
      rating_count: 0,
    };

    render(<CompanyCard company={minimalCompany} />);
    expect(screen.queryByText(/Sao Paulo/i)).not.toBeInTheDocument();
  });

  it('renders fallback description when missing', () => {
    const companyWithMissingData: Company = {
      id: 3,
      name: 'Incomplete Company',
      average_rating: 3.0,
      rating_count: 5,
    };

    render(<CompanyCard company={companyWithMissingData} />);
    expect(screen.getByText(/Visite o perfil/i)).toBeInTheDocument();
  });

  it('exibe WhatsApp quando active_admin esta ativo', () => {
    const setupCompany: Company = {
      ...mockCompany,
      id: 10,
      status: 'active',
      verified: true,
      whatsapp_enabled: true,
      whatsapp: '+55 31 99876-5432',
      has_paid_plan: true,
      plan_status: 'active',
      active_admin: true,
    };

    render(<CompanyCard company={setupCompany} />);

    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /or.amento/i })).not.toBeInTheDocument();
  });

  it('usa feature_access.custom_ctas como fonte canonica para liberar CTA premium', () => {
    const setupCompany: Company = {
      ...mockCompany,
      id: 13,
      active_admin: false,
      whatsapp_enabled: false,
      whatsapp: '',
      feature_access: {
        custom_ctas: {
          state: 'enabled',
          value: true,
        },
      },
    };

    render(<CompanyCard company={setupCompany} />);

    expect(screen.getByRole('button', { name: /or.amento/i })).toBeInTheDocument();
  });

  it('prioriza feature_access bloqueado mesmo se active_admin legado estiver true', () => {
    const setupCompany: Company = {
      ...mockCompany,
      id: 14,
      active_admin: true,
      whatsapp_enabled: true,
      whatsapp: '+55 31 99876-5432',
      feature_access: {
        custom_ctas: {
          state: 'locked',
          value: false,
        },
      },
    };

    render(<CompanyCard company={setupCompany} />);

    expect(screen.queryByRole('button', { name: /WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /or.amento/i })).not.toBeInTheDocument();
  });

  it('exibe Orcamento quando active_admin esta ativo e WhatsApp indisponivel', () => {
    const setupCompany: Company = {
      ...mockCompany,
      id: 11,
      status: 'active',
      verified: true,
      whatsapp_enabled: false,
      whatsapp: '',
      has_paid_plan: true,
      plan_status: 'active',
      active_admin: true,
    };

    render(<CompanyCard company={setupCompany} />);

    expect(screen.getByRole('button', { name: /or.amento/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /WhatsApp/i })).not.toBeInTheDocument();
  });

  it('displays rating in x.x/5.0 format', () => {
    const companyWithRating: Company = {
      id: 4,
      name: 'Rated Company',
      average_rating: 4.2,
      rating_count: 25,
      city: 'Rio de Janeiro',
      state: 'RJ'
    };

    render(<CompanyCard company={companyWithRating} />);

    // Check for the new rating format
    expect(screen.getByText('4.2/5.0')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('displays "Sem avaliações" for companies without rating', () => {
    const companyWithoutRating: Company = {
      id: 5,
      name: 'Unrated Company',
      average_rating: 0,
      rating_count: 0,
      city: 'Brasília',
      state: 'DF'
    };

    render(<CompanyCard company={companyWithoutRating} />);

    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
  });

  it('handles different rating field names correctly', () => {
    const companyWithRatingAvg: Company = {
      id: 6,
      name: 'Rating Avg Company',
      rating_avg: 3.8,
      rating_count: 12,
      city: 'Salvador',
      state: 'BA'
    };

    render(<CompanyCard company={companyWithRatingAvg} />);

    expect(screen.getByText('3.8/5.0')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('displays rating without count in compact mode', () => {
    const companyWithRating: Company = {
      id: 7,
      name: 'Compact Company',
      average_rating: 4.7,
      rating_count: 88,
      city: 'Fortaleza',
      state: 'CE'
    };

    render(<CompanyCard company={companyWithRating} compact />);

    expect(screen.getByText('4.7/5.0')).toBeInTheDocument();
    // In compact mode, rating count should not be displayed
    expect(screen.queryByText('(88)')).not.toBeInTheDocument();
  });

  it('esconde WhatsApp/Orcamento quando active_admin esta desativado', () => {
    const inactiveCompany: Company = {
      ...mockCompany,
      id: 12,
      status: 'inactive',
      verified: false,
      whatsapp_enabled: true,
      whatsapp: '+55 31 99876-5432',
      has_paid_plan: false,
      plan_status: 'inactive',
      active_admin: false,
    };

    render(<CompanyCard company={inactiveCompany} />);

    expect(screen.queryByRole('button', { name: /WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /or.amento/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar/i })).toBeInTheDocument();
  });
});
