import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlogFiltersBar } from '@/components/blog/BlogFiltersBar';
import userEvent from '@testing-library/user-event';

// Mock useRouter and useSearchParams
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn((key) => {
      if (key === 'q') return '';
      if (key === 'category') return 'all';
      return null;
    }),
    toString: jest.fn(() => ''),
  }),
}));

const mockCategories = [
  { id: 1, name: 'Solar Panels', slug: 'solar-panels', count: 10 },
  { id: 2, name: 'Inverters', slug: 'inverters', count: 5 },
  { id: 3, name: 'Batteries', slug: 'batteries', count: 8 },
  { id: 4, name: 'Installation', slug: 'installation', count: 12 },
  { id: 5, name: 'Financing', slug: 'financing', count: 3 },
  { id: 6, name: 'Maintenance', slug: 'maintenance', count: 7 },
];

describe('BlogFiltersBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input and sort dropdown', () => {
    render(<BlogFiltersBar categories={mockCategories} />);
    expect(screen.getByPlaceholderText('Buscar artigos...')).toBeInTheDocument();
    expect(screen.getByText('Mais recentes')).toBeInTheDocument();
  });

  it('renders categories as tabs', () => {
    render(<BlogFiltersBar categories={mockCategories} />);
    expect(screen.getByText('Tudo')).toBeInTheDocument();
    expect(screen.getByText('Solar Panels')).toBeInTheDocument();
    expect(screen.getByText('Inverters')).toBeInTheDocument();
  });

  it('navigates on category click', async () => {
    render(<BlogFiltersBar categories={mockCategories} />);
    const categoryTab = screen.getByText('Solar Panels');
    fireEvent.click(categoryTab);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('category=1'));
  });

  it('updates search input and navigates on debounce', async () => {
    render(<BlogFiltersBar categories={mockCategories} />);
    const input = screen.getByPlaceholderText('Buscar artigos...');
    await userEvent.type(input, 'Tesla');
    
    expect(input).toHaveValue('Tesla');
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=Tesla'));
    }, { timeout: 1000 });
  });

  // Note: Testing scroll behavior in JSDOM is tricky as layout is not fully simulated.
  // We can check if arrows are rendered initially (based on our logic they might be hidden if scrollWidth == clientWidth).
  // We'll mock the ref behavior if needed, but for now we test interaction logic.
});
