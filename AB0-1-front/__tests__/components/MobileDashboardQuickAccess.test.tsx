import { fireEvent, render, screen } from '@testing-library/react';
import MobileDashboardQuickAccess from '@/app/dashboard/components/MobileDashboardQuickAccess';

const baseProps = {
  activeTab: 'overview',
  company: { verified: true },
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

describe('MobileDashboardQuickAccess', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza os quatro indicadores reais', () => {
    render(<MobileDashboardQuickAccess {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Visitas: 120' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avaliações: 14' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leads: 8' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conversão: 12,5%' })).toBeInTheDocument();
  });

  it('navega pelo indicador selecionado', () => {
    render(<MobileDashboardQuickAccess {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Avaliações: 14' }));
    expect(baseProps.onTabChange).toHaveBeenCalledWith('reviews');
  });

  it('marca o indicador ativo com aria-current', () => {
    render(<MobileDashboardQuickAccess {...baseProps} activeTab="reviews" />);
    expect(screen.getByRole('button', { name: 'Avaliações: 14' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
