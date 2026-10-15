import { render, screen, fireEvent } from '@testing-library/react';
import CompareSummary from '@/components/compare/CompareSummary';
import CompareTable from '@/components/compare/CompareTable';
import { mapCompanyToCompareCompany } from '@/components/compare/mapCompanyToCompareCompany';

const makeCompany = (overrides: Record<string, unknown> = {}) =>
  mapCompanyToCompareCompany({
    id: 1,
    name: 'WEG',
    slug: 'weg',
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: 4.5,
    rating_count: 50,
    verified: true,
    has_paid_plan: true,
    feature_access: {
      custom_ctas: { state: 'enabled', value: true },
    },
    ...overrides,
  });

describe('CompareSummary (Correção 01)', () => {
  it('renderiza matriz comparativa de síntese com cabeçalho, indicadores e botões', () => {
    const comp1 = makeCompany({
      id: 1,
      name: 'WEG',
      verified: true,
      rating_avg: 4.5,
      response_time_sla: '~2h',
    });
    const comp2 = makeCompany({
      id: 2,
      name: 'GoodWe Brasil',
      verified: false,
      rating_avg: 4.4,
      coverage_cities: ['São Paulo', 'Campinas'],
    });

    render(<CompareSummary companies={[comp1, comp2]} />);

    expect(screen.getByRole('heading', { name: 'Resumo da comparação' })).toBeInTheDocument();
    expect(screen.getByText('Dados públicos')).toBeInTheDocument();

    // 4 indicadores obrigatórios
    expect(screen.getByText('Verificação')).toBeInTheDocument();
    expect(screen.getByText('Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Nota média')).toBeInTheDocument();
    expect(screen.getByText('Resposta')).toBeInTheDocument();

    // Dados reais das empresas
    expect(screen.getByText('WEG')).toBeInTheDocument();
    expect(screen.getByText('GoodWe Brasil')).toBeInTheDocument();
    expect(screen.getByText('Verificada')).toBeInTheDocument();
    expect(screen.getByText('Não verificada')).toBeInTheDocument();
    expect(screen.getByText('2 regiões')).toBeInTheDocument();
    expect(screen.getByText('4,5 de 5')).toBeInTheDocument();
    expect(screen.getByText('4,4 de 5')).toBeInTheDocument();

    // Botões de navegação rápida
    const profileButtons = screen.getAllByRole('link', { name: /Ver perfil/i });
    expect(profileButtons.length).toBeGreaterThanOrEqual(2);

    // Nota de rodapé no mesmo painel
    expect(
      screen.getByText(/Resumo calculado apenas com informações públicas disponíveis/i)
    ).toBeInTheDocument();
  });
});

describe('CompareTable (Correção 02, 03, 04)', () => {
  it('renderiza cabeçalho de 3 colunas com proporções equilibradas (28%/36%/36%) e botão X discreto', () => {
    const onRemove = jest.fn();
    const onQuote = jest.fn();
    const comp1 = makeCompany({ id: 1, name: 'GoodWe Brasil' });
    const comp2 = makeCompany({ id: 2, name: 'WEG' });

    const { container } = render(
      <CompareTable companies={[comp1, comp2]} onRemove={onRemove} onQuote={onQuote} />
    );

    // Proporções das colunas (28% / 36% / 36%)
    const cols = container.querySelectorAll('colgroup col');
    expect(cols[0]).toHaveClass('w-[28%]');
    expect(cols[1]).toHaveClass('w-[36%]');
    expect(cols[2]).toHaveClass('w-[36%]');

    // Nomes das empresas sempre visíveis
    expect(screen.getByText('GoodWe Brasil')).toBeInTheDocument();
    expect(screen.getByText('WEG')).toBeInTheDocument();

    // Botão X discreto de remoção
    const removeButtons = screen.getAllByRole('button', { name: /Remover .* da comparação/i });
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0]).toHaveClass('rounded-full');

    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('exibe CTA Solicitar orçamento somente para empresa elegível (plano pago)', () => {
    const onQuote = jest.fn();
    const paidCompany = makeCompany({
      id: 1,
      name: 'Empresa Paga',
      has_paid_plan: true,
      feature_access: { custom_ctas: { state: 'enabled', value: true } },
    });
    const freeCompany = makeCompany({
      id: 2,
      name: 'Empresa Gratuita',
      has_paid_plan: false,
      feature_access: undefined,
    });

    render(
      <CompareTable
        companies={[paidCompany, freeCompany]}
        onRemove={jest.fn()}
        onQuote={onQuote}
      />
    );

    // Deve exibir CTA apenas para a empresa paga
    const quoteButtons = screen.getAllByRole('button', { name: 'Solicitar orçamento' });
    expect(quoteButtons).toHaveLength(1);

    fireEvent.click(quoteButtons[0]);
    expect(onQuote).toHaveBeenCalledWith(paidCompany);

    // Ambas exibem o link "Ver perfil completo"
    const profileLinks = screen.getAllByText(/Ver perfil completo/i);
    expect(profileLinks).toHaveLength(2);
  });

  it('expande e recolhe seções do accordion preservando critérios', () => {
    const comp1 = makeCompany({ id: 1 });
    const comp2 = makeCompany({ id: 2 });

    render(
      <CompareTable
        companies={[comp1, comp2]}
        onRemove={jest.fn()}
        onQuote={jest.fn()}
      />
    );

    const sectionToggle = screen.getByRole('button', { name: /Avaliação geral/i });
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'true');

    // Clica para recolher
    fireEvent.click(sectionToggle);
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'false');

    // Clica para expandir novamente
    fireEvent.click(sectionToggle);
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'true');
  });
});
