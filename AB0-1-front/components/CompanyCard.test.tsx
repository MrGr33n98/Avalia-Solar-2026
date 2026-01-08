import { render, screen } from '@testing-library/react';
import CompanyCard from './CompanyCard';
import { Company } from '@/lib/api';

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

  it('exibe fallback de banner quando a URL é nula', () => {
    render(<CompanyCard company={mockCompanyNoImages} />);
    // Deve renderizar o placeholder
    const placeholder = screen.getByTestId('banner-placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('BSOL');
    // Não deve renderizar o TestImage do banner
    expect(screen.queryByTestId('company-banner')).not.toBeInTheDocument();
  });

  it('exibe fallback de logo quando a URL é nula', () => {
    render(<CompanyCard company={mockCompanyNoImages} />);
    // Deve renderizar o placeholder
    const placeholder = screen.getByTestId('logo-placeholder');
    expect(placeholder).toBeInTheDocument();
    // Não deve renderizar o TestImage do logo
    expect(screen.queryByTestId('company-logo')).not.toBeInTheDocument();
  });

  it('exibe o badge de verificação para empresas verificadas', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(screen.getByText('Verificada')).toBeInTheDocument();
  });

  it('aplica classes responsivas ao banner (object-contain em mobile, object-cover em desktop)', () => {
    render(<CompanyCard company={mockCompany} />);
    const bannerImg = screen.getByTestId('company-banner');
    expect(bannerImg).toHaveClass('object-contain');
    expect(bannerImg).toHaveClass('md:object-cover');
  });
});
