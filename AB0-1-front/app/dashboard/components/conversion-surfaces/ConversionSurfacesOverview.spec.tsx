import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConversionSurfacesOverview from './ConversionSurfacesOverview';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
const query = fetchApi as jest.Mock;

const sample = {
  company_id: 372, registry_version: '2.0.0', as_of: '2026-11-06T12:00:00Z',
  data_status: 'unavailable' as const,
  summary: {
    catalog_candidates: 24, certified_live_surfaces: 0, applicable_surfaces: 8,
    active_surface_count: 0, active_quote_points: 0, active_whatsapp_points: 0,
    observed_surface_count: null, impressions: null, quote_clicks: null,
    whatsapp_clicks: null, quote_submissions: null,
  },
  surfaces: [{
    surface_id: 'CV-HOME-REC', group: 'Landing', route: '/',
    lifecycle: 'active', certified: false, applicable: true,
    channels: { quote: { state: 'awaiting_certification', enabled: false, reason: 'awaiting_certification' } },
    observed: { data_status: 'unavailable', impressions: null, quote_clicks: null, whatsapp_clicks: null },
  }],
};

describe('ConversionSurfacesOverview', () => {
  beforeEach(() => { jest.clearAllMocks(); query.mockResolvedValue(sample); });

  it('renders four compact indicators and does not convert unavailable analytics to zero', async () => {
    render(<ConversionSurfacesOverview companyId="372" />);
    await waitFor(() => expect(screen.getByText('CV-HOME-REC')).toBeInTheDocument());
    const rail = screen.getByTestId('conversion-surface-kpis');
    expect(rail).toHaveTextContent('Elegíveis');
    expect(rail).toHaveTextContent('Ativos');
    expect(rail).toHaveTextContent('Vistos');
    expect(rail).toHaveTextContent('Cliques');
    expect(screen.getByText(/não significa zero/i)).toBeInTheDocument();
    expect(query).toHaveBeenCalledWith('/company_dashboard/conversion_surfaces',
      expect.objectContaining({ method: 'GET', params: { company_id: '372', period: '30d' } }));
  });

  it('keeps distinct channel filters and scoped periods', async () => {
    render(<ConversionSurfacesOverview companyId="372" />);
    await screen.findByText('CV-HOME-REC');
    fireEvent.click(screen.getByRole('tab', { name: 'WhatsApp' }));
    expect(screen.queryByText('CV-HOME-REC')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    await waitFor(() => expect(query).toHaveBeenCalledWith('/company_dashboard/conversion_surfaces',
      expect.objectContaining({ params: { company_id: '372', period: '7d' } })));
  });

  it('does not expose data returned for a different tenant', async () => {
    query.mockResolvedValueOnce({ ...sample, company_id: 999 });
    render(<ConversionSurfacesOverview companyId="372" />);
    await screen.findByRole('alert');
    expect(screen.queryByText('CV-HOME-REC')).not.toBeInTheDocument();
  });
});
