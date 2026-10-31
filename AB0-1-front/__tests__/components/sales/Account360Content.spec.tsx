import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Account360Content from '@/components/sales/companies/Account360Content';
import type { DetailedAccount } from '@/lib/api/sales/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard/sales/accounts/3',
  useSearchParams: () => ({
    get: jest.fn((key: string) => (key === 'tab' ? 'overview' : null)),
    toString: () => 'tab=overview',
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Vendedor Teste', email: 'vendedor@avaliasolar.com.br' },
    token: 'fake-token',
  }),
}));

const mockAccount: DetailedAccount = {
  id: 3,
  name: 'Solar Tech Brasil',
  domain: 'solartech.com.br',
  website: 'https://solartech.com.br',
  city: 'Florianópolis',
  state: 'SC',
  segment: 'Integrador / Instalador',
  status: 'prospecting',
  owner_name: 'Ana Silva',
  owner_id: 1,
  fit_score: null,
  data_quality: null,
  next_best_action: {
    action_type: 'identify_decision_maker',
    title: 'Mapear decisores da conta',
    priority: 'high',
    reason: 'Conta sem decisores cadastrados.',
    cta_label: 'Adicionar Decisor',
  },
  contacts: [
    {
      id: 10,
      first_name: 'Carlos',
      last_name: 'Mendes',
      email: 'carlos@solartech.com.br',
      phone: '48999998888',
      whatsapp: '48999998888',
      job_title: 'Diretor Comercial',
      decision_role: 'Decisor Econômico',
      is_primary: true,
    },
  ],
  opportunities: [
    {
      id: 20,
      name: 'Projeto Usina 50kW',
      value_cents: 15000000,
      probability: 70,
      status: 'open',
    },
  ],
  activities: [
    {
      id: 30,
      activity_type: 'call',
      subject: 'Primeiro alinhamento telefônico',
      occurred_at: '2026-10-30T10:00:00Z',
    },
  ],
  tasks: [],
  marketplace: {
    id: 99,
    name: 'Solar Tech Brasil',
    slug: 'solar-tech-brasil',
    rating_avg: 4.8,
    rating_count: 12,
    verified: true,
    claimed: true,
    claim_status: 'claimed',
  },
  summary: {
    contacts_count: 1,
    opportunities_count: 1,
    open_opportunities_count: 1,
    open_pipeline_value_cents: 15000000,
    won_opportunities_count: 0,
    won_pipeline_value_cents: 0,
    activities_count: 1,
    tasks_count: 0,
    emails_sent_count: 0,
    emails_opened_count: 0,
  },
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Account360Content', () => {
  it('renderiza ficha completa no modo full_page com dados reais e sem dependência de modal', () => {
    renderWithClient(<Account360Content accountId={3} mode="full_page" initialAccount={mockAccount} />);

    // Nome da conta e identificador
    expect(screen.getByRole('heading', { name: 'Solar Tech Brasil' })).toBeInTheDocument();
    expect(screen.getByText('Conta Comercial #3')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Integrador / Instalador')).toBeInTheDocument();
    expect(screen.getByText('Selo Verificado')).toBeInTheDocument();
    expect(screen.getByText('Perfil Reivindicado')).toBeInTheDocument();

    // Next Best Action real do backend
    expect(screen.getByText('Mapear decisores da conta')).toBeInTheDocument();
    expect(screen.getByText('Conta sem decisores cadastrados.')).toBeInTheDocument();

    // Valores sem fallback fictício (fit_score e data_quality nulos renderizam 'Não calculado')
    const uncalculatedElements = screen.getAllByText('Não calculado');
    expect(uncalculatedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renderiza botão "Abrir Ficha Completa" no modo quick_view', () => {
    renderWithClient(<Account360Content accountId={3} mode="quick_view" initialAccount={mockAccount} />);

    expect(screen.getByText('Abrir Ficha Completa')).toBeInTheDocument();
  });
});
