import { render, screen, fireEvent } from '@testing-library/react';
import RoleBasedDashboardLayout from '@/app/dashboard/components/RoleBasedDashboardLayout';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/proposals',
  useSearchParams: () => new URLSearchParams('company_id=9001'),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'company_admin', email: 'admin@avaliasolar.com.br' },
    loading: false,
  }),
}));

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({
    activeCompany: { id: 9001, name: 'Empresa Teste' },
    companies: [{ id: 9001, name: 'Empresa Teste' }],
    isLoading: false,
  }),
}));

jest.mock('@/app/dashboard/hooks/useCompanyDashboardData', () => ({
  useCompanyDashboardData: () => ({
    loading: false,
    company: { id: 9001, name: 'Empresa Teste' },
    stats: {},
    featureAccess: {},
    featureAccessLoading: false,
  }),
}));

// Mock simplificado do EnterpriseSidebar para testar onTabChange (default export)
jest.mock('@/app/dashboard/components/EnterpriseSidebar', () => ({
  __esModule: true,
  default: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <div data-testid="enterprise-sidebar">
      <button onClick={() => onTabChange('info')}>Aba Info (Alias)</button>
      <button onClick={() => onTabChange('reviews')}>Aba Reviews</button>
      <button onClick={() => onTabChange('live-inbox')}>Aba Inbox (Rota)</button>
    </div>
  ),
}));

describe('RoleBasedDashboardLayout - Navegação de abas', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('canonicaliza alias ao navegar para aba do dashboard', () => {
    render(
      <RoleBasedDashboardLayout activeTab="proposals">
        <div>Conteúdo da página</div>
      </RoleBasedDashboardLayout>
    );

    fireEvent.click(screen.getByText('Aba Info (Alias)'));
    // info deve ser canonicalizado para product-general
    expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=product-general');
  });

  it('navega para abas padrão do dashboard mantendo rota canônica', () => {
    render(
      <RoleBasedDashboardLayout activeTab="proposals">
        <div>Conteúdo da página</div>
      </RoleBasedDashboardLayout>
    );

    fireEvent.click(screen.getByText('Aba Reviews'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=reviews');
  });

  it('navega para rotas independentes quando a aba é uma rota', () => {
    render(
      <RoleBasedDashboardLayout activeTab="proposals">
        <div>Conteúdo da página</div>
      </RoleBasedDashboardLayout>
    );

    fireEvent.click(screen.getByText('Aba Inbox (Rota)'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/inbox');
  });
});
