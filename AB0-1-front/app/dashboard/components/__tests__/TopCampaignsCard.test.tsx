import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopCampaignsCard from '../TopCampaignsCard';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api');

describe('TopCampaignsCard', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockCampaigns = [
    {
      id: 1,
      utm_campaign: 'Solar 2024',
      utm_source: 'google',
      utm_medium: 'cpc',
      total_visits: 1000,
      total_cta_clicks: 250,
      total_leads: 100,
      conversion_rate: 10.0,
      last_seen_at: '2024-01-15'
    }
  ];

  it('displays campaigns when data is loaded', async () => {
    (fetchApi as jest.Mock).mockResolvedValue({ campaigns: mockCampaigns });

    render(
      <TopCampaignsCard companyId="123" />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Solar 2024')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  it('shows empty state when no campaigns', async () => {
    (fetchApi as jest.Mock).mockResolvedValue({ campaigns: [] });

    render(
      <TopCampaignsCard companyId="123" />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/Adicione parâmetros UTM/)).toBeInTheDocument();
    });
  });
});
