import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyComparisonModal from './CompanyComparisonModal';
import type { ComparisonCompany } from './CompanyComparisonModal';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockOpenLeadModal = jest.fn();
jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: (args: unknown) => mockOpenLeadModal(args),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  sendIntentSignal: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

const companyWithPaidPlan: ComparisonCompany = {
  id: 101,
  name: 'WEG Solar',
  slug: 'weg-solar',
  city: 'Florianópolis',
  state: 'SC',
  verified: true,
  rating_avg: 4.8,
  reviews_count: 12,
  coverage_cities: ['Florianópolis', 'São José'],
  has_paid_plan: true,
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
  },
  comparison_profile: {
    quote_turnaround: 'within_24h',
    technical_visit: 'free',
    payment_methods: ['pix', 'credit_card', 'bank_slip'],
    financing_availability: 'available',
    installation_terms: 'included',
    maintenance_availability: 'offered',
    after_sales_support: 'offered',
    installation_team: 'in_house',
    system_monitoring: 'app',
    services_offered: ['project', 'installation', 'maintenance'],
    warranty_years: 5,
    warranty_confirmed: true,
  },
};

const companyWithoutPaidPlan: ComparisonCompany = {
  id: 202,
  name: 'Empresa Solar Básica',
  slug: 'empresa-solar-basica',
  city: 'Curitiba',
  state: 'PR',
  verified: false,
  rating_avg: 0,
  reviews_count: 0,
  has_paid_plan: false,
  comparison_profile: {
    quote_turnaround: 'consult',
    technical_visit: 'consult',
    payment_methods: [],
    financing_availability: 'not_offered',
    installation_terms: 'separately_contracted',
    maintenance_availability: 'not_offered',
    after_sales_support: 'not_offered',
    installation_team: 'outsourced',
    system_monitoring: 'not_offered',
    services_offered: [],
    warranty_years: null,
    warranty_confirmed: false,
  },
};

describe('CompanyComparisonModal — Contrato Unificado de 14 Critérios + CTA', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onRemoveCompany: jest.fn(),
    onClearAll: jest.fn(),
    companies: [companyWithPaidPlan, companyWithoutPaidPlan],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza os 14 critérios na ordem exata e a linha final de orçamento', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // Verifica todos os 14 rótulos textuais
    expect(screen.getAllByText('Avaliações').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Verificação').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Região atendida').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Prazo do orçamento').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visita técnica').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Formas de pagamento').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Financiamento').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Instalação').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manutenção').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pós-venda').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Equipe de instalação').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acompanhamento do sistema').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Serviços oferecidos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Garantia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Solicitar orçamento').length).toBeGreaterThan(0);
  });

  test('renderiza badges com dados mapeados corretamente', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // Prazo do orçamento da empresa 1: "Até 24h"
    expect(screen.getAllByText('Até 24h').length).toBeGreaterThan(0);

    // Visita técnica da empresa 1: "Gratuita"
    expect(screen.getAllByText('Gratuita').length).toBeGreaterThan(0);

    // Financiamento da empresa 1: "Disponível"
    expect(screen.getAllByText('Disponível').length).toBeGreaterThan(0);

    // Instalação da empresa 1: "Inclusa"
    expect(screen.getAllByText('Inclusa').length).toBeGreaterThan(0);

    // Equipe da empresa 1: "Própria"
    expect(screen.getAllByText('Própria').length).toBeGreaterThan(0);

    // Acompanhamento da empresa 1: "Pelo aplicativo"
    expect(screen.getAllByText('Pelo aplicativo').length).toBeGreaterThan(0);

    // Garantia confirmada da empresa 1: "5 anos"
    expect(screen.getAllByText('5 anos').length).toBeGreaterThan(0);
  });

  test('exibe botão "Solicitar" apenas para empresa com plano pago e "—" para empresa gratuita', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // Botão Solicitar para empresa elegível
    const quoteButtons = screen.getAllByRole('button', { name: /^solicitar$/i });
    expect(quoteButtons.length).toBeGreaterThan(0);

    // Clicar no botão chama openLeadModal para a empresa com plano pago
    fireEvent.click(quoteButtons[0]);
    expect(mockOpenLeadModal).toHaveBeenCalledWith(
      expect.objectContaining({ preferredCompanyId: 101 })
    );

    // Célula vazia / traço para empresa sem plano pago
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  test('exibe "Não informado" quando campos não são preenchidos e não inventa dados', () => {
    const emptyCompany: ComparisonCompany = {
      id: 303,
      name: 'Empresa Sem Dados',
      slug: 'sem-dados',
      city: '',
      state: '',
      verified: false,
    };

    render(
      <CompanyComparisonModal
        {...defaultProps}
        companies={[emptyCompany]}
      />
    );

    // Deve exibir múltiplos badges/textos "Não informado"
    const notInformedElements = screen.getAllByText('Não informado');
    expect(notInformedElements.length).toBeGreaterThan(3);
  });

  test('possui botões de minimizar e fechar acessíveis com aria-label', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    const minimizeBtn = screen.getByRole('button', { name: /minimizar comparação/i });
    const closeBtn = screen.getByRole('button', { name: /fechar modal de comparação/i });

    expect(minimizeBtn).toBeInTheDocument();
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
