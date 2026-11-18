import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SolutionsWorkspace } from './SolutionsWorkspace';
import { UserSolutionChip } from '@/components/profile/UserSolutionChip';

jest.mock('@/components/profile/AddUserSolutionModal', () => ({
  AddUserSolutionModal: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Adicionar solução sustentável">
        <button type="button" onClick={() => onOpenChange(false)}>
          Fechar modal
        </button>
      </div>
    ) : null,
}));

jest.mock('@/components/review-dashboard/brands/BrandsWorkspace', () => ({
  BrandsWorkspace: () => <div data-testid="brands-workspace">Brands Workspace Mock</div>,
}));

jest.mock('@/components/review-dashboard/experience/ExperienceWorkspace', () => ({
  ExperienceWorkspace: () => <div data-testid="experience-workspace">Experience Workspace Mock</div>,
}));

const mockUseDashboardContext = jest.fn();

jest.mock('@/app/review-dashboard/DashboardLayoutClient', () => ({
  useDashboardContext: () => mockUseDashboardContext(),
}));

describe('SolutionsWorkspace — PR0 Baseline Truthful UI & IBM Carbon Compact', () => {
  const baseContext = {
    solutions: [],
    solutionsLoading: false,
    solutionsError: null,
    addSolution: jest.fn(),
    removeSolution: jest.fn(),
    removingSolutionId: null,
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardContext.mockReturnValue(baseContext);
  });

  it('nunca exibe copy falsa de +20 pontos no Green Score nem impacto ambiental fictício', () => {
    render(<SolutionsWorkspace />);

    expect(screen.queryByText(/\+20/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suas soluções impactam o futuro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CO₂ evitado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Energia limpa/i)).not.toBeInTheDocument();
    expect(screen.getByText(/avaliações aprovadas, votos úteis/i)).toBeInTheDocument();
  });

  it('não exibe status falso "Em análise" quando soluções são apenas autodeclaradas (verified=false)', () => {
    mockUseDashboardContext.mockReturnValue({
      ...baseContext,
      solutions: [
        {
          id: '1',
          name: 'Inversor Residencial',
          type: 'product',
          category: 'Energia Solar',
          verified: false,
          created_at: '2026-11-10T10:00:00Z',
        },
      ],
    });

    render(<SolutionsWorkspace />);

    expect(screen.queryByText('Em análise')).not.toBeInTheDocument();
    expect(screen.getByText('Uso declarado')).toBeInTheDocument();
    expect(screen.getByText('Inversor Residencial')).toBeInTheDocument();
  });

  it('exibe selo Verificada apenas quando backend retorna verified=true', () => {
    mockUseDashboardContext.mockReturnValue({
      ...baseContext,
      solutions: [
        {
          id: '2',
          name: 'Módulo Solar X',
          type: 'technology',
          category: 'Energia Solar',
          verified: true,
        },
      ],
    });

    render(<SolutionsWorkspace />);

    expect(screen.getByText('Verificada')).toBeInTheDocument();
  });

  it('usa monograma tipográfico ou logo real em vez de ícone genérico de marca', () => {
    mockUseDashboardContext.mockReturnValue({
      ...baseContext,
      solutions: [
        {
          id: '10',
          name: 'Sistema Solar Alfa',
          type: 'technology',
          category: 'Energia Solar',
          verified: false,
        },
        {
          id: '11',
          name: 'Marca Beta',
          type: 'company',
          category: 'Baterias',
          verified: false,
          logo_url: 'https://cdn.example.com/beta.png',
        },
      ],
    });

    const { container } = render(<SolutionsWorkspace />);

    expect(screen.getByLabelText('Solução: Sistema Solar Alfa')).toHaveTextContent('SS');
    const img = container.querySelector('img[src="https://cdn.example.com/beta.png"]');
    expect(img).toBeInTheDocument();
  });

  it('exibe indisponível (—) nos KPIs em estado de erro de API, nunca zero fictício', () => {
    mockUseDashboardContext.mockReturnValue({
      ...baseContext,
      solutions: [],
      solutionsError: 'Não foi possível carregar suas soluções.',
    });

    render(<SolutionsWorkspace />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar suas soluções.');
    const strip = screen.getByLabelText('Resumo de soluções');
    expect(strip).toHaveTextContent('—');
    expect(strip).not.toHaveTextContent('0');
  });

  it('permite abrir o modal de adicionar solução a partir do empty state', () => {
    render(<SolutionsWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar primeira solução' }));
    expect(screen.getByRole('dialog', { name: 'Adicionar solução sustentável' })).toBeInTheDocument();
  });

  it('UserSolutionChip usa monograma ou logo real sem ícones genéricos', () => {
    render(
      <UserSolutionChip
        solution={{
          id: '99',
          name: 'Fronius Brasil',
          type: 'company',
          category: 'Energia Solar',
          verified: false,
        }}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Solução: Fronius Brasil')).toHaveTextContent('FB');
  });

  it('permite alternar entre as abas do Hub incluindo Minha experiência e projetos', () => {
    render(<SolutionsWorkspace initialHubTab="experience" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minha experiência e projetos');
    expect(screen.getByTestId('experience-workspace')).toBeInTheDocument();
  });
});

