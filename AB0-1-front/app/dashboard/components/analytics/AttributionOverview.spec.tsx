import { render, screen } from '@testing-library/react';
import AttributionOverview from './AttributionOverview';

let mockAttributionData: Record<string, unknown>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mockAttributionData,
    isLoading: false,
    isError: false,
  }),
}));

describe('AttributionOverview', () => {
  beforeEach(() => {
    mockAttributionData = {
      data_status: 'ready',
      summary: {
        visits: 15,
        cta_clicks: 0,
        leads: 0,
        attribution_coverage_pct: 85.5,
      },
      channels: [
        { channel_group: 'AI Referral', source: 'chatgpt.com', visits: 12, leads: 0 },
        { channel_group: 'Organic Search', source: 'google', visits: 3, leads: 0 },
      ],
      cta_matrix: [],
    };
  });

  it('renderiza "Visitas de aquisição" e tooltip explicativo', () => {
    render(<AttributionOverview companyId="372" premium={true} />);

    expect(screen.getByText('Visitas de aquisição')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();

    expect(screen.getByText('AI Referral · chatgpt.com')).toBeInTheDocument();
    expect(screen.getByText('Organic Search · google')).toBeInTheDocument();

    expect(screen.queryByText(/Internal/)).not.toBeInTheDocument();
    expect(screen.queryByText(/System\/Auth/)).not.toBeInTheDocument();
  });
});
