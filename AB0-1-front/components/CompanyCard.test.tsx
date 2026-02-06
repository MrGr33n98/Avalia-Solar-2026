import { render, screen } from '@testing-library/react';
import CompanyCard from './CompanyCard';
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

describe('CompanyCard Image Rendering', () => {
  const mockCompany: Company = {
    id: 1,
    name: 'Solar Tech',
    description: 'Empresa líder em energia solar',
    website: 'https://solartech.com',
    phone: '(11) 99999-9999',
    address: 'Rua Solar, 123',
    city: 'São Paulo',
    state: 'SP',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    status: 'active',
    verified: true,
    has_paid_plan: true,
    whatsapp_enabled: true,
    whatsapp_url: 'https://wa.me/5511999999999',
    // Imagens válidas
    banner_url: 'http://localhost:3001/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBidz09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--24e65330368c7075775317737380922881079310/banner.jpg',
    logo_url: 'http://localhost:3001/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBidz09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--24e65330368c7075775317737380922881079310/logo.jpg'
  };

  const mockCompanyNoImages: Company = {
    ...mockCompany,
    id: 2,
    name: 'BSOL',
    banner_url: null,
    logo_url: null
  };

  it('renderiza o banner corretamente quando a URL está disponível', () => {
    render(<CompanyCard company={mockCompany} />);
    const banner = screen.getByTestId('company-banner');
    expect(banner).toBeInTheDocument();
    // TestImage renderiza uma img com src correspondente (pode ser processado pelo next/image)
    // Verificamos se o elemento existe.
  });

  it('renderiza o logo corretamente quando a URL está disponível', () => {
    render(<CompanyCard company={mockCompany} />);
    const logo = screen.getByTestId('company-logo');
    expect(logo).toBeInTheDocument();
  });

  it('exibe o banner padrão quando a URL é nula', () => {
    render(<CompanyCard company={mockCompanyNoImages} />);
    const banner = screen.getByTestId('company-banner');
    expect(banner).toBeInTheDocument();
  });

  it('exibe logo com placeholder quando a URL e nula', () => {
    render(<CompanyCard company={mockCompanyNoImages} />);
    // Com getFullImageUrl, ainda renderiza a imagem usando placeholder interno
    expect(screen.getByTestId('company-logo')).toBeInTheDocument();
  });

  it('exibe o badge de verificação para empresas verificadas', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(screen.getByText('Verificada')).toBeInTheDocument();
  });

  it('aplica classe de cobertura ao banner', () => {
    render(<CompanyCard company={mockCompany} />);
    const bannerImg = screen.getByTestId('company-banner');
    expect(bannerImg).toHaveClass('object-cover');
  });
});
