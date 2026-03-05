import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ActivityChart } from '@/app/review-dashboard/components/ActivityChart';

jest.mock('recharts', () => ({
  __esModule: true,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="recharts-responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="recharts-line-chart">{children}</div>
  ),
  Line: () => <div data-testid="recharts-line" />,
  XAxis: () => <div data-testid="recharts-x-axis" />,
  YAxis: () => <div data-testid="recharts-y-axis" />,
  CartesianGrid: () => <div data-testid="recharts-grid" />,
  Tooltip: () => <div data-testid="recharts-tooltip" />,
  Legend: () => <div data-testid="recharts-legend" />,
}));

describe('ActivityChart', () => {
  it('renders empty state without crashing when data is empty', () => {
    render(<ActivityChart data={[]} />);

    expect(screen.getByText('Gráficos em breve')).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-line-chart')).not.toBeInTheDocument();
  });

  it('renders empty state without crashing when all values are zero', () => {
    render(
      <ActivityChart
        data={[
          {
            date: '2026-03-01',
            profile_views: 0,
            whatsapp_clicks: 0,
            cta_clicks: 0,
          },
        ]}
      />
    );

    expect(screen.getByText('Gráficos em breve')).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-line-chart')).not.toBeInTheDocument();
  });

  it('renders chart when there is valid activity data', () => {
    render(
      <ActivityChart
        data={[
          {
            date: '2026-03-01',
            profile_views: 12,
            whatsapp_clicks: 3,
            cta_clicks: 1,
          },
        ]}
      />
    );

    expect(screen.getByTestId('recharts-line-chart')).toBeInTheDocument();
    expect(screen.queryByText('Gráficos em breve')).not.toBeInTheDocument();
  });
});
