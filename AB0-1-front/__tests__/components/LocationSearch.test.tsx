import { render, screen, fireEvent } from '@testing-library/react';
import LocationSearch from '@/components/LocationSearch';
import { useLocationData } from '@/hooks/useLocationData';

// Mock hook
jest.mock('@/hooks/useLocationData', () => ({
  useLocationData: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check">Check</span>,
  ChevronsUpDown: () => <span data-testid="icon-chevrons">Chevrons</span>,
  MapPin: () => <span data-testid="icon-map-pin">MapPin</span>,
  Search: () => <span data-testid="icon-search">Search</span>,
}));

// Mock UI components if complex, but here we can rely on testing-library to render them if they are accessible.
// However, Popover and Command often rely on Radix UI which might need mocks or proper environment setup.
// For simplicity, we assume standard rendering but if it fails we might need to mock Popover/Command.
// Let's try to mock the UI components to isolate logic.

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="location-trigger">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover">
      {/* Simulate trigger click to open content */}
      <div onClick={() => onOpenChange && onOpenChange(!open)} data-testid="popover-trigger-wrapper">
        {Array.isArray(children) ? children[0] : children}
      </div>
      {open && <div data-testid="popover-content">{Array.isArray(children) ? children[1] : null}</div>}
    </div>
  ),
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandInput: ({ placeholder }: any) => <input placeholder={placeholder} data-testid="command-input" />,
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div data-testid="command-group">
      <h3>{heading}</h3>
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect }: any) => (
    <div onClick={onSelect} data-testid="command-item">
      {children}
    </div>
  ),
}));

describe('LocationSearch', () => {
  const mockFetchStates = jest.fn();
  const mockFetchCities = jest.fn();

  beforeEach(() => {
    (useLocationData as jest.Mock).mockReturnValue({
      states: ['SP', 'RJ'],
      cities: ['São Paulo', 'Campinas'],
      fetchStates: mockFetchStates,
      fetchCities: mockFetchCities,
    });
  });

  it('renders correctly', () => {
    render(<LocationSearch />);
    expect(screen.getByTestId('location-trigger')).toBeInTheDocument();
  });

  it('opens popover on click and shows states', () => {
    render(<LocationSearch />);
    fireEvent.click(screen.getByTestId('location-trigger'));
    
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar estado...')).toBeInTheDocument();
    expect(screen.getByText('SP')).toBeInTheDocument();
    expect(screen.getByText('RJ')).toBeInTheDocument();
  });

  it('calls onLocationSelect when state and city are selected', () => {
    const onSelect = jest.fn();
    render(<LocationSearch onLocationSelect={onSelect} />);
    
    // Open
    fireEvent.click(screen.getByTestId('location-trigger'));
    
    // Select State 'SP'
    // In our mock, CommandItem calls onSelect when clicked
    // We need to find the specific item.
    // The items render the text.
    const spItem = screen.getByText('SP').closest('div[data-testid="command-item"]');
    fireEvent.click(spItem!);
    
    // Should call fetchCities
    expect(mockFetchCities).toHaveBeenCalledWith('SP');
    
    // Should switch to cities view
    // Since we mocked useLocationData to return static cities, they should be visible now if the component re-renders or updates view state.
    // The component uses internal state for view.
    
    // Expect city input placeholder
    expect(screen.getByPlaceholderText('Buscar cidade...')).toBeInTheDocument();
    
    // Select City 'São Paulo'
    const cityItem = screen.getByText('São Paulo').closest('div[data-testid="command-item"]');
    fireEvent.click(cityItem!);
    
    expect(onSelect).toHaveBeenCalledWith({ state: 'SP', city: 'São Paulo' });
  });
});
