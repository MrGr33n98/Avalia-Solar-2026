import { fireEvent, render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import ConquistasPage from './page';
import { track } from '@/lib/analytics/lazy';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const mockUseQuery = useQuery as jest.Mock;

const summary = {
  unlocked_count: 0,
  total_count: 0,
  xp_total: 0,
  completion_percentage: 0,
  next_suggested: null,
};

const badge = (id: string, state: 'locked' | 'unlocked') => ({
  id,
  name: id === 'profile_complete' ? 'Perfil completo' : '1ª avaliação aprovada',
  description: 'Critério da conquista',
  category: 'review',
  tier: 'bronze',
  state,
  unlocked: state === 'unlocked',
  progress: state === 'unlocked' ? 1 : 0,
  threshold: 1,
  xp: state === 'unlocked' ? 50 : 0,
  points: 50,
  unlocked_at: state === 'unlocked' ? '2026-11-18T00:00:00Z' : null,
  asset: {
    earned: '/assets/achievements/cards/01_review_approved_1.svg',
    locked: '/assets/achievements/cards_locked/01_review_approved_1_locked.svg',
  },
  action: 'write_review',
  share: state === 'unlocked' ? { verify_url: 'https://avaliasolar.com.br/conquistas/verificar/abc', token: 'abc' } : null,
});

describe('Reviewer achievements — G2-inspired catalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not celebrate an unseeded catalog or display invented achievements', () => {
    mockUseQuery.mockReturnValue({
      data: { schema_version: '2026-11-v1', summary, achievements: [], faq: [] },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    });

    render(<ConquistasPage />);

    expect(screen.getByText('Catálogo de conquistas temporariamente indisponível')).toBeInTheDocument();
    expect(screen.queryByText(/Parabéns/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^achievement-card-/)).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('achievement_tab_viewed', {
      surface: 'tab',
      unlocked_count: 0,
      total_count: 0,
    });
  });

  it('renders first-party SVG badges, compact filters and accurate zero progress', () => {
    mockUseQuery.mockReturnValue({
      data: {
        schema_version: '2026-11-v1',
        summary: { ...summary, total_count: 2 },
        achievements: [badge('review_approved_1', 'locked'), badge('profile_complete', 'unlocked')],
        faq: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    });

    render(<ConquistasPage />);

    expect(screen.getAllByTestId(/^achievement-card-/)).toHaveLength(2);
    expect(screen.getByRole('progressbar', { name: 'Progresso geral de conquistas' })).toHaveStyle({ width: '0%' });
    expect(screen.getByRole('button', { name: /Compartilhar conquista Perfil completo/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Bloqueadas/ }));
    expect(screen.getAllByTestId(/^achievement-card-/)).toHaveLength(1);
    expect(screen.getByText('1ª avaliação aprovada')).toBeInTheDocument();
  });
});
