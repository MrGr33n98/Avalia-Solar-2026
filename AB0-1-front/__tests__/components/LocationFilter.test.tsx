import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationFilter } from '../../components/LocationFilter';
import { companiesApiSafe } from '../../lib/api-client';

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  companiesApiSafe: {
    getStates: jest.fn(),
    getCities: jest.fn(),
  },
}));

// Mock hook to use API mocks implicitly
jest.mock('../../hooks/useLocationData', () => {
  const originalModule = jest.requireActual('../../hooks/useLocationData');
  return {
    ...originalModule,
    // We are mocking useLocationData logic by mocking the API calls it makes
    // But since the component imports the hook, and the hook uses the API,
    // mocking the API is the best integration test approach.
    // However, for unit testing the component in isolation without waiting for hook asyncs,
    // we can mock the hook return value.
    useLocationData: () => {
      const [states, setStates] = React.useState<string[]>([]);
      const [cities, setCities] = React.useState<string[]>([]);

      // Simulate fetch effect
      React.useEffect(() => {
        setStates(['SP', 'RJ']);
      }, []);

      const fetchCities = jest.fn((state) => {
        if (state === 'SP') setCities(['São Paulo', 'Campinas']);
        else setCities([]);
      });

      return {
        states: ['SP', 'RJ'],
        cities: cities, // This will be dynamic in real hook
        loadingStates: false,
        loadingCities: false,
        error: null,
        fetchCities: fetchCities,
        refreshStates: jest.fn(),
      };
    },
  };
});

describe('LocationFilter', () => {
  const mockOnStateChange = jest.fn();
  const mockOnCityChange = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders state select', () => {
    render(
      <LocationFilter
        onStateChange={mockOnStateChange}
        onCityChange={mockOnCityChange}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  // Note: Radix UI Select is hard to test with simple fireEvent because of portals.
  // We focus on basic rendering and structure here.

  it('displays clear button when filter is active', () => {
    render(
      <LocationFilter
        onStateChange={mockOnStateChange}
        onCityChange={mockOnCityChange}
        onClear={mockOnClear}
        initialState="SP"
      />
    );
    expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    render(
      <LocationFilter
        onStateChange={mockOnStateChange}
        onCityChange={mockOnCityChange}
        onClear={mockOnClear}
        initialState="SP"
      />
    );

    fireEvent.click(screen.getByText('Limpar filtros'));
    expect(mockOnClear).toHaveBeenCalled();
  });
});
