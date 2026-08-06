import { render, screen } from '@testing-library/react';
import MobileDashboardQuickAccess from '@/app/dashboard/components/MobileDashboardQuickAccess';

const baseProps = {
  activeTab: 'overview',
  company: { verified: true },
  onTabChange: jest.fn(),
  onOpenNavigation: jest.fn(),
};

describe('MobileDashboardQuickAccess', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza estado vazio compacto sem duplicar o CTA contextual', () => {
    render(<MobileDashboardQuickAccess {...baseProps} stats={null} />);
    const state = screen.getByTestId('reputation-empty-state');
    expect(state).toHaveClass('max-h-[120px]');
    expect(screen.queryByRole('button', { name: 'Coletar' })).not.toBeInTheDocument();
  });

  it('renderiza métricas reais e empresa verificada quando há avaliações', () => {
    render(
      <MobileDashboardQuickAccess
        {...baseProps}
        stats={{
          profileViews: 120,
          leadsReceived: 8,
          reviewsCount: 14,
          averageRating: 4.7,
          conversionRate: 6.6,
        }}
      />
    );
    expect(screen.getByTestId('reputation-summary')).toBeInTheDocument();
    expect(screen.getByText('Nota 4,7')).toBeInTheDocument();
    expect(screen.getByText('Verificada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avaliações: 14' })).not.toHaveAttribute(
      'aria-current'
    );
  });
});
