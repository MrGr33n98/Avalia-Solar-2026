import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadsMapKpiBar } from '@/components/sales/leads/map/LeadsMapKpiBar';
import { LeadsMapToolbar } from '@/components/sales/leads/map/LeadsMapToolbar';
import { LeadsMapView } from '@/components/sales/leads/views/LeadsMapView';
import { salesApi } from '@/lib/api/sales/client';

jest.mock('@/lib/api/sales/client', () => ({
  salesApi: {
    getOpportunitiesMap: jest.fn(),
    getOpportunities: jest.fn(),
  },
}));

// Mock dynamic Leaflet Canvas to prevent window/navigator issues in JSDOM
jest.mock('next/dynamic', () => () => {
  const MockComponent = () => <div data-testid="mock-leads-map-canvas">Mocked Leaflet Canvas</div>;
  return MockComponent;
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Leads Map View & Components (PRD V1)', () => {
  describe('LeadsMapKpiBar', () => {
    it('renders all 4 metric cards correctly with formatted BRL values', () => {
      const summary = {
        total_filtered: 125,
        mappable: 100,
        unmapped: 25,
        missing_city_state: 15,
        unsupported_municipality: 10,
        total_value_cents: 580000000,
        mapped_value_cents: 490000000,
      };

      render(<LeadsMapKpiBar summary={summary} municipalitiesCount={12} />);

      expect(screen.getByTestId('leads-map-kpi-bar')).toBeInTheDocument();
      expect(screen.getByText('Total Filtrado')).toBeInTheDocument();
      expect(screen.getByText('125')).toBeInTheDocument();
      expect(screen.getByText('R$ 5.800.000')).toBeInTheDocument();

      expect(screen.getByText('No Mapa')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('R$ 4.900.000')).toBeInTheDocument();

      expect(screen.getByText('Sem Posição')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();

      expect(screen.getByText('Cobertura')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('LeadsMapToolbar', () => {
    it('renders fit bounds button and approximate centroid badge', () => {
      const onFitBounds = jest.fn();
      const onSwitchView = jest.fn();

      render(
        <LeadsMapToolbar
          onFitBounds={onFitBounds}
          onSwitchView={onSwitchView}
          municipalitiesCount={8}
        />
      );

      const fitBtn = screen.getByTestId('leads-map-fit-bounds-button');
      expect(fitBtn).toBeInTheDocument();
      fireEvent.click(fitBtn);
      expect(onFitBounds).toHaveBeenCalledTimes(1);

      const listBtn = screen.getByTestId('leads-map-switch-list-button');
      fireEvent.click(listBtn);
      expect(onSwitchView).toHaveBeenCalledWith('list');

      expect(screen.getByText('8 cidades')).toBeInTheDocument();
      expect(screen.getByText(/Centroide aproximado/i)).toBeInTheDocument();
    });
  });

  describe('LeadsMapView Orchestrator', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders loading skeleton when fetching data', () => {
      (salesApi.getOpportunitiesMap as jest.Mock).mockReturnValue(new Promise(() => {}));

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <LeadsMapView />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('leads-map-view-loading')).toBeInTheDocument();
    });

    it('renders empty state when there are no mappable locations', async () => {
      (salesApi.getOpportunitiesMap as jest.Mock).mockResolvedValue({
        summary: {
          total_filtered: 0,
          mappable: 0,
          unmapped: 0,
          missing_city_state: 0,
          unsupported_municipality: 0,
          total_value_cents: 0,
          mapped_value_cents: 0,
        },
        locations: [],
        meta: {
          location_source: 'offline_city_centroids',
          location_dataset_version: 'current',
          as_of: new Date().toISOString(),
          filters_applied: [],
        },
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <LeadsMapView />
        </QueryClientProvider>
      );

      expect(await screen.findByText('Nenhum Município Mapeável Encontrado')).toBeInTheDocument();
    });

    it('renders map canvas when mappable locations are returned', async () => {
      (salesApi.getOpportunitiesMap as jest.Mock).mockResolvedValue({
        summary: {
          total_filtered: 15,
          mappable: 15,
          unmapped: 0,
          missing_city_state: 0,
          unsupported_municipality: 0,
          total_value_cents: 75000000,
          mapped_value_cents: 75000000,
        },
        locations: [
          {
            key: 'BR:MT:cuiaba',
            country: 'BR',
            state: 'MT',
            city: 'Cuiabá',
            latitude: -15.6,
            longitude: -56.1,
            precision: 'municipality_centroid',
            lead_count: 15,
            value_cents: 75000000,
            status_counts: { open: 15 },
          },
        ],
        meta: {
          location_source: 'offline_city_centroids',
          location_dataset_version: 'current',
          as_of: new Date().toISOString(),
          filters_applied: ['pipeline_id'],
        },
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <LeadsMapView />
        </QueryClientProvider>
      );

      expect(await screen.findByTestId('mock-leads-map-canvas')).toBeInTheDocument();
      expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('1 cidade')).toBeInTheDocument();
    });
  });
});
