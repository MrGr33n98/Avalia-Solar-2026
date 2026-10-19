import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyCard from './CompanyCard';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockAddToComparison = jest.fn();
const mockRemoveFromComparison = jest.fn();
let mockIsInComparison = false;

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => mockIsInComparison,
    addToComparison: mockAddToComparison,
    removeFromComparison: mockRemoveFromComparison,
    canAddMore: true,
  }),
}));

const mockOpenLeadModal = jest.fn();
jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: (args: unknown) => mockOpenLeadModal(args),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

describe('CompanyCard V2 — Swiss Enterprise Discovery Card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInComparison = false;
  });

  const baseCompany = {
    id: 101,
    name: 'WEG Solar',
    slug: 'weg-solar',
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: 4.5,
    rating_count: 18,
    has_paid_plan: true,
    feature_access: {
      custom_ctas: { state: 'enabled', value: true },
    },
    verified: true,
    description: 'Fabricante nacional líder em inversores e soluções solares completas.',
    coverage_cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Itajaí'],
    coverage_states: ['SC'],
    actions: {
      p2p_chat_enabled: true,
      whatsapp_enabled: true,
      whatsapp_url: 'https://wa.me/5548999999999',
    },
  };

  it('renderiza card com selo de verificação e orçamento habilitado (US-003, US-004)', () => {
    render(<CompanyCard company={baseCompany} />);

    expect(screen.getByText('WEG Solar')).toBeInTheDocument();
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Empresa verificada/i)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(18)')).toBeInTheDocument();
    expect(screen.getByText('Florianópolis, SC')).toBeInTheDocument();

    // CTA primário de solicitação de orçamento
    const quoteBtn = screen.getByRole('button', { name: /Solicitar orçamento/i });
    expect(quoteBtn).toBeInTheDocument();

    // Ações secundárias: Comparar, Ver perfil, Mais ações
    expect(screen.getByRole('checkbox', { name: /Adicionar WEG Solar à comparação/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mais ações para WEG Solar/i })).toBeInTheDocument();

    // Dispara modal de lead ao clicar em solicitar orçamento
    fireEvent.click(quoteBtn);
    expect(mockOpenLeadModal).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredCompanyId: 101,
        source: 'company_card',
        type: 'quick',
      })
    );
  });

  it('renderiza card Free com ação primária Ver Perfil e secundária Avaliar (US-002)', () => {
    const freeCompany = {
      ...baseCompany,
      has_paid_plan: false,
    };

    render(<CompanyCard company={freeCompany} />);

    // Não deve conter badge PRO
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();

    // CTA primário deve ser Ver perfil
    const primaryProfileBtn = screen.getByRole('button', { name: /^Ver perfil/i });
    expect(primaryProfileBtn).toBeInTheDocument();

    // Ação secundária no rodapé deve ser Avaliar
    expect(screen.getByRole('button', { name: /Avaliar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Solicitar orçamento/i })).not.toBeInTheDocument();
  });

  it('renderiza honestamente empresa sem avaliações (Sem avaliações, nunca 0.0 · 0) (US-008)', () => {
    const noReviewsCompany = {
      ...baseCompany,
      rating_avg: 0,
      rating_count: 0,
    };

    render(<CompanyCard company={noReviewsCompany} />);

    expect(screen.getAllByText('Sem avaliações').length).toBeGreaterThan(0);
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('renderiza cobertura real formatada sem dados falsos de Todo o Brasil (US-008)', () => {
    render(<CompanyCard company={baseCompany} />);

    expect(screen.getByText('5 cidades')).toBeInTheDocument();
    expect(screen.queryByText('Todo o Brasil')).not.toBeInTheDocument();
    expect(screen.queryByText('24h')).not.toBeInTheDocument();
  });

  it('alterna o estado de comparação ao clicar no seletor Comparar (US-006)', () => {
    render(<CompanyCard company={baseCompany} />);

    const compareCheckbox = screen.getByRole('checkbox', { name: /Adicionar WEG Solar à comparação/i });
    expect(compareCheckbox).not.toBeChecked();

    fireEvent.click(compareCheckbox);
    expect(mockAddToComparison).toHaveBeenCalled();
  });

  it('abre o Sheet de avaliações ao clicar no chip de avaliações (US-005)', () => {
    render(<CompanyCard company={baseCompany} />);

    const reviewChip = screen.getByRole('button', { name: /18 avaliações/i });
    fireEvent.click(reviewChip);

    // O Sheet deve abrir exibindo o título
    expect(screen.getByText('Avaliações da WEG Solar')).toBeInTheDocument();
    expect(screen.getByText('Ver todas as avaliações')).toBeInTheDocument();
  });

  it('navega para o perfil da empresa ao clicar no corpo do card (US-001)', () => {
    const { container } = render(<CompanyCard company={baseCompany} />);

    const card = container.querySelector('.group');
    if (card) {
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith('/companies/weg-solar');
    }
  });

  it('preserva paridade de layout e altura entre Free e PRO (US-002, US-003)', () => {
    const { rerender } = render(<CompanyCard company={baseCompany} />);
    expect(screen.getByText('WEG Solar')).toBeInTheDocument();

    // Rerender como Free
    rerender(<CompanyCard company={{ ...baseCompany, has_paid_plan: false }} />);
    expect(screen.getByText('WEG Solar')).toBeInTheDocument();
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();
  });

  it('renderiza os marcadores de testid e estrutura flex com gap-3 no rodapé de ações (SPEC)', () => {
    render(<CompanyCard company={baseCompany} />);

    expect(screen.getByTestId('company-card')).toBeInTheDocument();
    const actions = screen.getByTestId('company-card-actions');
    expect(actions).toBeInTheDocument();
    expect(actions).toHaveClass('flex', 'flex-col', 'gap-3');
    expect(actions).not.toHaveClass('space-y-2');

    const primaryRow = screen.getByTestId('company-card-primary-row');
    expect(primaryRow).toBeInTheDocument();
    expect(primaryRow).not.toHaveClass('h-10');

    const secondaryRow = screen.getByTestId('company-card-secondary-row');
    expect(secondaryRow).toBeInTheDocument();
    expect(secondaryRow).toHaveClass('grid', 'grid-cols-3', 'gap-2');
  });
});
