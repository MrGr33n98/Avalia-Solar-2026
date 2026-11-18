import { render, screen } from '@testing-library/react';
import ConquistasPage from './page';
import { useDashboardContext } from '../DashboardLayoutClient';
import { track } from '@/lib/analytics/lazy';

jest.mock('../DashboardLayoutClient', () => ({
  useDashboardContext: jest.fn(),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const mockUseDashboardContext = useDashboardContext as jest.Mock;

describe('ConquistasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders truthful empty fallback values when no gamification data is available', () => {
    mockUseDashboardContext.mockReturnValue({
      summary: null,
      reviews: [],
    });

    render(<ConquistasPage />);

    expect(track).toHaveBeenCalledWith('achievement_tab_viewed', { surface: 'tab' });

    // Assert that no fake numbers (130, 50) or fake level ('Prata') are rendered
    expect(screen.queryByText('130')).not.toBeInTheDocument();
    expect(screen.queryByText('50')).not.toBeInTheDocument();
    expect(screen.queryByText('Prata')).not.toBeInTheDocument();

    // Assert placeholder ' — ' is rendered for empty metrics
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThanOrEqual(4);

    expect(
      screen.getByText('Nenhuma conquista encontrada nesta categoria.')
    ).toBeInTheDocument();
  });

  it('renders real gamification metrics and achievements when provided by API', () => {
    mockUseDashboardContext.mockReturnValue({
      summary: {
        gamification: {
          green_score: 85,
          earned_points: 120,
          level: { name: 'Ouro', key: 'gold', next: null, progress: 100, threshold: 100 },
          achievements: [
            {
              id: 'review_approved_1',
              title: '1ª avaliação aprovada',
              description: 'Sua primeira avaliação foi aprovada.',
              state: 'conquistado',
              unlocked: true,
            },
            {
              id: 'profile_complete',
              title: 'Perfil completo',
              description: 'Perfil 100% preenchido.',
              state: 'bloqueado',
              unlocked: false,
            },
          ],
        },
      },
      reviews: [],
    });

    render(<ConquistasPage />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Ouro')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();

    expect(screen.getByText('1ª avaliação aprovada')).toBeInTheDocument();
    expect(screen.getByText('Perfil completo')).toBeInTheDocument();
    expect(screen.getByText('Desbloqueada')).toBeInTheDocument();
    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
  });
});

