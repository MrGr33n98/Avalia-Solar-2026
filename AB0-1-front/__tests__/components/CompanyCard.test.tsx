import { render, screen, within } from '@testing-library/react';
import CompanyCard from '@/components/CompanyCard';
import { Company } from '@/lib/api';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <svg data-testid="star-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
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
    description:
      'Especialistas em instalação de painéis solares com mais de 10 anos de experiência',
    city: 'São Paulo',
    state: 'SP',
    average_rating: 4.5,
    rating_count: 120,
    business_hours: 'Seg-Sex 8h às 18h',
    payment_methods: ['Cartão de Crédito', 'Boleto', 'PIX'],
    website: 'https://example.com',
    social_links: {
      facebook: 'https://facebook.com/example',
      instagram: 'https://instagram.com/example',
    },
    category_name: 'Painéis Solares',
  };

  it('renders company with all data', () => {
    render(<CompanyCard company={mockCompany} />);

    // Main company link (usa regex porque o accessible name pode incluir mais conteúdo)
    const companyLink = screen.getByRole('link', { name: /Energia Solar LTDA/i });
    expect(companyLink).toHaveAttribute('href', '/companies/1');

    // Rating and reviews
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/120 avaliações/)).toBeInTheDocument();

    // Location with map-pin
    const locationElement = screen.getByText(/São Paulo - SP/);
    expect(
      within(locationElement.closest('div') as HTMLElement).getByTestId('map-pin-icon')
    ).toBeInTheDocument();

    // Payment methods
    expect(
      screen.getByText(/Cartão de Crédito, Boleto, PIX/i)
    ).toBeInTheDocument();

    // Social links (usando getByRole + href check)
    expect(screen.getByRole('link', { name: /globe/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute(
      'href',
      'https://facebook.com/example'
    );
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute(
      'href',
      'https://instagram.com/example'
    );
  });

  it('handles company without optional data', () => {
    const minimalCompany: Company = {
      id: 2,
      name: 'Minimal Company',
      average_rating: 0,
      rating_count: 0,
    };

    render(<CompanyCard company={minimalCompany} />);

    // Main company link
    const companyLink = screen.getByRole('link', { name: /Minimal Company/i });
    expect(companyLink).toHaveAttribute('href', '/companies/2');

    // Rating
    expect(screen.getByText(/0\.0/)).toBeInTheDocument();

    // Optional fields não devem aparecer
    expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/avaliações/)).not.toBeInTheDocument();
  });

  it('renders social links correctly', () => {
    render(<CompanyCard company={mockCompany} />);

    const facebookLink = screen.getByRole('link', { name: /facebook/i });
    expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/example');

    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/example');
  });

  it('shows default values when data is missing', () => {
    const companyWithMissingData: Company = {
      id: 3,
      name: 'Incomplete Company',
      average_rating: 3.0,
      rating_count: 5,
    };

    render(<CompanyCard company={companyWithMissingData} />);

    // Default description
    expect(screen.getByText(/no description/i)).toBeInTheDocument();

    // Default payment methods não devem aparecer
    expect(screen.queryByTestId('credit-card-icon')).not.toBeInTheDocument();
  });

  it('exibe botões de WhatsApp e Solicitar Orçamento quando setup completo', () => {
    const setupCompany: Company = {
      ...mockCompany,
      id: 10,
      status: 'active',
      verified: true,
      whatsapp_enabled: true,
      whatsapp: '+55 31 99876-5432',
      has_paid_plan: true,
      plan_status: 'active',
    };

    render(<CompanyCard company={setupCompany} />);

    // Botão WhatsApp presente
    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
    // Botão Solicitar Orçamento presente
    expect(screen.getByRole('button', { name: /Solicitar Orçamento/i })).toBeInTheDocument();
  });

  it('não exibe WhatsApp/Orçamento quando setup está incompleto', () => {
    const incompleteCompany: Company = {
      ...mockCompany,
      id: 11,
      status: 'inactive',
      verified: false,
      whatsapp_enabled: false,
      whatsapp: '',
      has_paid_plan: false,
      plan_status: 'inactive',
    };

    render(<CompanyCard company={incompleteCompany} />);

    // Botões não devem aparecer
    expect(screen.queryByRole('button', { name: /WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Solicitar Orçamento/i })).not.toBeInTheDocument();
    // Nenhum fallback renderizado
    expect(screen.queryByText(/Contatos indisponíveis/i)).not.toBeInTheDocument();
  });
});
