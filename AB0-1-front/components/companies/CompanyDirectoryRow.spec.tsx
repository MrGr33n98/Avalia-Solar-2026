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
});
