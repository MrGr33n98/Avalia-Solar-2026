import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsWorkspace from '@/components/sales/leads/LeadsWorkspace';

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (param: string) => (param === 'view' ? 'kanban' : null),
  }),
  usePathname: () => '/dashboard/sales/leads',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders workspace header, quick filters, and controls SalesCommandCenter props', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsWorkspace />
      </QueryClientProvider>
    );

    expect(screen.getByText('Leads Workspace')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sales-command-center')).toBeInTheDocument();
    expect(screen.getByText('QuickFilter: all')).toBeInTheDocument();

    const myLeadsBtn = screen.getByRole('button', { name: /Meus Leads/i });
    fireEvent.click(myLeadsBtn);
    expect(screen.getByText('QuickFilter: my_leads')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar lead por nome ou empresa...');
    fireEvent.change(searchInput, { target: { value: 'WEG' } });
    expect(screen.getByText('SearchQuery: WEG')).toBeInTheDocument();
  });
});
