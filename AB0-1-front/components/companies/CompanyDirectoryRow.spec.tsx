import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyDirectoryRow } from './CompanyDirectoryRow';
import { track } from '@/lib/analytics/consolidated';

const mockToggleComparison = jest.fn();
let mockIsInComparison = false;
let mockCanAddMore = true;

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => mockIsInComparison,
    toggleComparison: mockToggleComparison,
    canAddMore: mockCanAddMore,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, email: 'test@example.com' },
  }),
}));

jest.mock('@/lib/api/favorites', () => ({
  favoritesApi: {
    create: jest.fn().mockResolvedValue({ success: true }),
    removeByItem: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt = '',
    fill,
    priority,
    unoptimized,
    ...props
  }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

describe('CompanyDirectoryRow — Mobile Compact Directory Row', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInComparison = false;
    mockCanAddMore = true;
  });

  const sampleCompany = {
    id: 42,
    name: 'Solar Tech Brasil',
    slug: 'solar-tech-brasil',
    logo_url: 'https://example.com/logo.png',
    verified: true,
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: 4.9,
    rating_count: 32,
  };

  it('renderiza dados da empresa, nota, contagem e localização', () => {
    render(<CompanyDirectoryRow company={sampleCompany} />);

    expect(screen.getByText('Solar Tech Brasil')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(32)')).toBeInTheDocument();
    expect(screen.getByText('Florianópolis, SC')).toBeInTheDocument();
    expect(screen.getByTestId('verified-badge-wrapper')).toBeInTheDocument();
  });

  it('exibe "Sem avaliações" quando a empresa não possui avaliações', () => {
    const unratedCompany = {
      ...sampleCompany,
      rating_avg: 0,
      rating_count: 0,
      verified: false,
    };

    render(<CompanyDirectoryRow company={unratedCompany} />);

    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    expect(screen.queryByTestId('verified-badge-wrapper')).not.toBeInTheDocument();
  });

  it('permite alternar comparação ao clicar no checkbox de comparação', () => {
    render(<CompanyDirectoryRow company={sampleCompany} />);

    const compareCheckbox = screen.getByRole('checkbox', { name: /comparação/i });
    expect(compareCheckbox).not.toBeChecked();

    fireEvent.click(compareCheckbox);
    expect(mockToggleComparison).toHaveBeenCalledTimes(1);
    expect(mockToggleComparison).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        name: 'Solar Tech Brasil',
      })
    );
  });

  it('desabilita checkbox quando limite de comparação é atingido e empresa não está inclusa', () => {
    mockCanAddMore = false;
    mockIsInComparison = false;

    render(<CompanyDirectoryRow company={sampleCompany} />);

    const compareCheckbox = screen.getByRole('checkbox', { name: /comparação/i });
    expect(compareCheckbox).toBeDisabled();
  });

  it('possui link acessível apontando para a página canônica da empresa e dispara analytics no clique', () => {
    render(<CompanyDirectoryRow company={sampleCompany} index={2} />);

    const mainLink = screen.getByRole('link', { name: /ver perfil de solar tech brasil/i });
    expect(mainLink).toBeInTheDocument();
    expect(mainLink).toHaveAttribute('href', expect.stringContaining('/companies/solar-tech-brasil'));

    fireEvent.click(mainLink);
    expect(track).toHaveBeenCalledWith('company_list_row_clicked', {
      company_id: 42,
      company_name: 'Solar Tech Brasil',
      position: 2,
    });
  });

  it('exibe badge de Patrocinado e motivo de recomendação quando presentes', () => {
    const enrichedCompany = {
      ...sampleCompany,
      sponsored: true,
      recommendation_reason: { label: 'Atende Florianópolis' },
    };

    render(<CompanyDirectoryRow company={enrichedCompany} />);

    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
    expect(screen.getByText('Atende Florianópolis')).toBeInTheDocument();
  });

  it('organiza ações de conversão no topo e localização/favoritos/comparar no rodapé', () => {
    render(<CompanyDirectoryRow company={sampleCompany} />);

    const top = screen.getByTestId('directory-card-top');
    const bottom = screen.getByTestId('directory-card-bottom');

    expect(top).toContainElement(screen.getByText('Solar Tech Brasil'));
    expect(top).toContainElement(screen.getByText('4.9'));
    expect(bottom).toContainElement(screen.getByText('Florianópolis, SC'));
    expect(bottom).toContainElement(screen.getByRole('button', { name: 'Adicionar aos favoritos' }));
    expect(bottom).toContainElement(screen.getByRole('checkbox', { name: /comparação/i }));
    expect(screen.getByText('Comparar')).toBeVisible();
    expect(top).not.toContainElement(screen.getByRole('checkbox', { name: /comparação/i }));
  });

  it('aplica gates existentes e mantém WhatsApp/Orçamento apenas na linha superior', () => {
    const paidCompany = {
      ...sampleCompany,
      has_paid_plan: true,
      quote_cta_enabled: true,
      cta_whatsapp_enabled: true,
      cta_whatsapp_url: 'https://wa.me/5547999700506',
      feature_access: {
        custom_ctas: { state: 'enabled', value: true },
        whatsapp_contact_button: { state: 'enabled', value: true },
      },
    };

    render(<CompanyDirectoryRow company={paidCompany} />);
    const top = screen.getByTestId('directory-card-top');
    const bottom = screen.getByTestId('directory-card-bottom');
    expect(top).toContainElement(screen.getByRole('link', { name: /Falar com Solar Tech Brasil no WhatsApp/ }));
    expect(top).toContainElement(screen.getByRole('button', { name: 'Solicitar orçamento' }));
    expect(bottom).not.toContainElement(screen.getByRole('button', { name: 'Solicitar orçamento' }));
  });

  it('oculta CTAs premium em plano gratuito sem afetar os controles de comparação', () => {
    const freeCompany = {
      ...sampleCompany,
      has_paid_plan: false,
      quote_cta_enabled: true,
      cta_whatsapp_enabled: true,
      cta_whatsapp_url: 'https://wa.me/5547999700506',
    };
    render(<CompanyDirectoryRow company={freeCompany} />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /comparação/i })).toBeInTheDocument();
  });

  it('preserva localização estendida de sede e atendimento sem confundi-la com reputação', () => {
    render(<CompanyDirectoryRow company={sampleCompany} selectedState="MT" />);
    expect(screen.getByTestId('directory-card-bottom')).toHaveTextContent('Sede em Florianópolis, SC • Atende MT');
    expect(screen.getByTestId('directory-card-top')).not.toHaveTextContent('Atende MT');
  });
});
