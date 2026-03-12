import { fireEvent, render, screen } from '@testing-library/react';
import MobileDashboardQuickAccess from '@/app/dashboard/components/MobileDashboardQuickAccess';

jest.mock('@/app/dashboard/components/CommandMenu', () => ({
  CommandMenu: ({ onSelectTab }: { onSelectTab: (tabId: string) => void }) => (
    <button type="button" data-testid="mobile-command-menu" onClick={() => onSelectTab('reviews')}>
      command-menu
    </button>
  ),
}));

describe('MobileDashboardQuickAccess', () => {
  const baseProps = {
    activeTab: 'overview',
    company: {
      id: 372,
      name: 'WEG',
      verified: true,
    },
    stats: {
      profileViews: 120,
      leadsReceived: 8,
      reviewsCount: 14,
      averageRating: 4.7,
      conversionRate: 12.5,
    },
    onTabChange: jest.fn(),
    onOpenNavigation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the five priority actions for mobile', () => {
    render(<MobileDashboardQuickAccess {...baseProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Ranking Performance')).toBeInTheDocument();
    expect(screen.getByText('Selo de Confiança')).toBeInTheDocument();
  });

  it('opens secondary navigation through the more button', () => {
    render(<MobileDashboardQuickAccess {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^menu$/i }));
    expect(baseProps.onOpenNavigation).toHaveBeenCalledTimes(1);
  });

  it('hides quick actions whose tabs are hidden by feature access', () => {
    render(<MobileDashboardQuickAccess {...baseProps} visibleTabIds={['overview', 'reviews', 'trust-widget']} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Selo de Confiança')).toBeInTheDocument();
    expect(screen.queryByText('Oportunidades')).not.toBeInTheDocument();
    expect(screen.queryByText('Ranking Performance')).not.toBeInTheDocument();
  });
});
