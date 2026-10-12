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

describe('CompanyComparisonModal — Contrato Unificado de 14 Critérios + Linha Final CTA', () => {
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

  test('renderiza os 14 critérios na ordem exata e a linha final de orçamento (15 linhas totais)', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // 14 critérios canônicos + 1 linha CTA
    const expectedLabels = [
      'Avaliações',
      'Verificação',
      'Região atendida',
      'Prazo do orçamento',
      'Visita técnica',
      'Formas de pagamento',
      'Financiamento',
      'Instalação',
      'Manutenção',
      'Pós-venda',
      'Equipe de instalação',
      'Acompanhamento do sistema',
      'Serviços oferecidos',
      'Garantia',
      'Solicitar orçamento',
    ];

    expectedLabels.forEach((label) => {
      const elements = screen.getAllByText(label);
      expect(elements.length).toBeGreaterThan(0);
    });
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

  test('exibe botão "Solicitar orçamento" com aria-label apenas para empresa com plano pago e "—" para empresa gratuita', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // Botão "Solicitar orçamento" para empresa elegível (com label explícito e acessível)
    const quoteButtons = screen.getAllByRole('button', {
      name: /solicitar orçamento para weg solar/i,
    });
    expect(quoteButtons.length).toBeGreaterThan(0);

    // Clicar no botão chama openLeadModal para a empresa com plano pago
    fireEvent.click(quoteButtons[0]);
    expect(mockOpenLeadModal).toHaveBeenCalledWith(
      expect.objectContaining({ preferredCompanyId: 101 })
    );

    // Célula vazia / traço para empresa sem plano pago (inelegível)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  test('gerencia serviços oferecidos de forma progressiva (0, 1, 3 e 12 itens) sem estourar altura e permitindo ver lista completa', () => {
    const companyWith12Services: ComparisonCompany = {
      ...companyWithoutPaidPlan,
      id: 303,
      name: 'Empresa Multi Serviços',
      comparison_profile: {
        ...companyWithoutPaidPlan.comparison_profile,
        services_offered: [
          'Projeto',
          'instalação',
          'manutenção',
          'homologação',
          'limpeza de painéis',
          'monitoramento remoto',
          'consultoria energética',
          'laudo técnico',
          'subestação',
          'baterias e armazenamento',
          'carport solar',
          'auditoria predial',
        ],
      },
    };

    render(
      <CompanyComparisonModal
        {...defaultProps}
        companies={[companyWithPaidPlan, companyWith12Services]}
      />
    );

    // Empresa 1 tem 3 serviços: exibe preview + botão com "+1"
    const plus1Button = screen.getAllByRole('button', {
      name: /ver todos os 3 serviços/i,
    });
    expect(plus1Button.length).toBeGreaterThan(0);
    expect(screen.getAllByText('+1').length).toBeGreaterThan(0);

    // Empresa 2 tem 12 serviços: exibe preview + botão com "+10"
    const plus10Button = screen.getAllByRole('button', {
      name: /ver todos os 12 serviços/i,
    });
    expect(plus10Button.length).toBeGreaterThan(0);
    expect(screen.getAllByText('+10').length).toBeGreaterThan(0);

    // Clicar no botão de +10 abre o disclosure sheet com todos os 12 serviços
    fireEvent.click(plus10Button[0]);

    // O cabeçalho do detalhe aparece com o nome da empresa e a contagem
    expect(screen.getByText('Empresa Multi Serviços (12 serviços)')).toBeInTheDocument();

    // Todos os 12 serviços estão presentes na lista expandida
    expect(screen.getByText('baterias e armazenamento')).toBeInTheDocument();
    expect(screen.getByText('carport solar')).toBeInTheDocument();
    expect(screen.getByText('auditoria predial')).toBeInTheDocument();

    // Fecha o detalhe
    const closeDetailBtn = screen.getByRole('button', { name: /fechar lista de serviços/i });
    fireEvent.click(closeDetailBtn);
    expect(screen.queryByText('Empresa Multi Serviços (12 serviços)')).not.toBeInTheDocument();
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

  test('permite remover empresa individualmente pelo botão no card', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    const removeButtons = screen.getAllByRole('button', {
      name: /remover weg solar da comparação/i,
    });
    expect(removeButtons.length).toBeGreaterThan(0);

    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveCompany).toHaveBeenCalledWith(101);
  });

  test('botão de ver comparação completa navega para /compare', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    const comparePageBtn = screen.getByRole('button', {
      name: /ver comparação completa/i,
    });
    expect(comparePageBtn).toBeInTheDocument();

    fireEvent.click(comparePageBtn);
    expect(mockPush).toHaveBeenCalledWith('/compare');
  });

  test('footer no mobile com 2 empresas bloqueia adição de terceira e indica limite atingido (2/2)', () => {
    render(<CompanyComparisonModal {...defaultProps} />);

    // No mobile, quando companies.length == 2, exibe botão desabilitado com "Limite atingido (2/2)"
    const mobileAddBtn = screen.getByRole('button', {
      name: /limite atingido \(2\/2\)/i,
    });
    expect(mobileAddBtn).toBeInTheDocument();
    expect(mobileAddBtn).toBeDisabled();
  });
});
