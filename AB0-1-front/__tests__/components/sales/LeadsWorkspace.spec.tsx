import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsWorkspace from '@/components/sales/leads/LeadsWorkspace';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (param: string) => (param === 'view' ? 'kanban' : null),
    toString: () => 'view=kanban',
  }),
  usePathname: () => '/dashboard/sales/leads',
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, prefetch: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Sales User', email: 'sales@avaliasolar.com.br', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('@/components/sales/SalesCommandCenter', () => {
  return function MockSalesCommandCenter(props: any) {
    return (
      <div data-testid="mock-sales-command-center">
        <span>InitialView: {props.initialView}</span>
        <span>SearchQuery: {props.searchQuery}</span>
        <span>QuickFilter: {props.activeQuickFilter}</span>
      </div>
    );
  };
});

describe('LeadsWorkspace', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockReplace.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders responsive 2-row header with Leads title, no redundant badge, and primary actions', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsWorkspace />
      </QueryClientProvider>
    );

    // Title is 'Leads' without redundant 'Avalia Solar CRM' badge inside header
    const heading = screen.getByRole('heading', { level: 1, name: /Leads/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/^Leads$/i);
    expect(screen.getByText('Gestão de oportunidades comerciais')).toBeInTheDocument();

    // Primary & secondary actions
    expect(screen.getByRole('button', { name: /Adicionar Lead/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar leads via CSV/i })).toBeInTheDocument();

    // Embedded SalesCommandCenter
    expect(screen.getByTestId('mock-sales-command-center')).toBeInTheDocument();
    expect(screen.getByText('QuickFilter: all')).toBeInTheDocument();

    // Filter switching
    const myLeadsBtn = screen.getByRole('button', { name: /Meus Leads/i });
    fireEvent.click(myLeadsBtn);
    expect(screen.getByText('QuickFilter: my_leads')).toBeInTheDocument();

    // Search query passed down
    const searchInput = screen.getByPlaceholderText('Buscar lead por nome ou empresa...');
    fireEvent.change(searchInput, { target: { value: 'WEG' } });
    expect(screen.getByText('SearchQuery: WEG')).toBeInTheDocument();
  });

  it('switches views and updates route query params', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsWorkspace />
      </QueryClientProvider>
    );

    const listTab = screen.getByRole('button', { name: /Lista/i });
    fireEvent.click(listTab);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('view=list')
    );
  });
});
