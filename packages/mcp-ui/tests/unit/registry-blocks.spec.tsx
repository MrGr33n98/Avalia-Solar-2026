import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../src/bridge/host-adapter';
import { SolarCompanyCard } from '../../src/blocks/SolarCompanyCard';
import { SolarCompanyList } from '../../src/blocks/SolarCompanyList';
import { ReviewDistribution } from '../../src/blocks/ReviewDistribution';
import { EvidenceCard } from '../../src/blocks/EvidenceCard';
import { CompanyComparisonTable } from '../../src/blocks/CompanyComparisonTable';
import {
  FIXTURE_COMPARE,
  FIXTURE_INTEGRATORS,
  FIXTURE_REPUTATION_LARGE,
  FIXTURE_REPUTATION_ZERO,
} from '../../src/fixtures/staging-fixtures';

const [alfa, beta, helios] = FIXTURE_INTEGRATORS.data.integrators;

function withHost(node: React.ReactElement) {
  return render(<HostProvider appName="registry-blocks-test">{node}</HostProvider>);
}

describe('Spec 021 — SolarCompanyCard (data/actions/appearance/control)', () => {
  beforeEach(() => {
    delete window.__AVALIA_MCP_HARNESS__;
  });

  it('separa sede de cobertura declarada e não inventa nota quando não há avaliações', () => {
    withHost(
      <SolarCompanyCard
        data={{ company: beta }}
        actions={{}}
        control={{ selected: false, canSelect: true }}
      />
    );
    const card = screen.getByRole('article', { name: beta.name });
    expect(within(card).getByText(/Joinville – SC/)).toBeInTheDocument();
    expect(within(card).getByText(/Cobertura não informada/)).toBeInTheDocument();
    expect(within(card).getByText('Sem avaliações (0)')).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/R\$|€|EUR|estoque|carrinho/i);
  });

  it('oculta ações indisponíveis em vez de simular sucesso', () => {
    withHost(
      <SolarCompanyCard data={{ company: alfa }} actions={{}} control={{ selected: false, canSelect: true }} />
    );
    expect(screen.queryByRole('button', { name: /Ver perfil/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Ver reputação/ })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: /Comparar/ })).toBeNull();
  });

  it('emite ações com o ID estável da empresa', () => {
    const onViewProfile = vi.fn();
    const onViewReputation = vi.fn();
    const onToggleCompare = vi.fn();
    withHost(
      <SolarCompanyCard
        data={{ company: helios }}
        actions={{ onViewProfile, onViewReputation, onToggleCompare }}
        control={{ selected: false, canSelect: true }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: `Ver perfil de ${helios.name}` }));
    fireEvent.click(screen.getByRole('button', { name: `Ver reputação de ${helios.name}` }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Comparar/ }));
    expect(onViewProfile).toHaveBeenCalledWith(helios);
    expect(onViewReputation).toHaveBeenCalledWith(helios);
    expect(onToggleCompare).toHaveBeenCalledWith(helios.id, true);
    expect(screen.getByRole('checkbox', { name: /Comparar/ })).toHaveAttribute('id', `compare-${helios.id}`);
  });

  it('bloqueia nova seleção quando o limite foi atingido, mas permite desmarcar', () => {
    withHost(
      <>
        <SolarCompanyCard
          data={{ company: alfa }}
          actions={{ onToggleCompare: vi.fn() }}
          control={{ selected: false, canSelect: false }}
        />
        <SolarCompanyCard
          data={{ company: helios }}
          actions={{ onToggleCompare: vi.fn() }}
          control={{ selected: true, canSelect: false }}
        />
      </>
    );
    const [first, second] = screen.getAllByRole('checkbox', { name: /Comparar/ });
    expect(first).toBeDisabled();
    expect(second).not.toBeDisabled();
  });
});

describe('Spec 021 — SolarCompanyList', () => {
  it('renderiza por ID, respeita limite 2–3 e variante grid', () => {
    const onToggleCompare = vi.fn();
    const { container } = withHost(
      <SolarCompanyList
        data={{ companies: FIXTURE_INTEGRATORS.data.integrators }}
        actions={{ onToggleCompare }}
        appearance={{ variant: 'grid' }}
        control={{ selectedIds: [3, 4, 5], maxSelected: 3 }}
      />
    );
    const list = container.querySelector('[data-registry-item="solar-company-list"]');
    expect(list).toHaveAttribute('data-variant', 'grid');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    screen.getAllByRole('checkbox', { name: /Comparar/ }).forEach((box) => expect(box).toBeChecked());
  });

  it('desabilita seleção extra quando já há 3 selecionadas', () => {
    withHost(
      <SolarCompanyList
        data={{ companies: FIXTURE_INTEGRATORS.data.integrators }}
        actions={{ onToggleCompare: vi.fn() }}
        control={{ selectedIds: [3, 4], maxSelected: 2 }}
      />
    );
    const boxes = screen.getAllByRole('checkbox', { name: /Comparar/ });
    expect(boxes[2]).toBeDisabled();
    expect(boxes[0]).not.toBeDisabled();
  });

  it('lista vazia não renderiza artigos fictícios', () => {
    withHost(<SolarCompanyList data={{ companies: [] }} actions={{}} control={{ selectedIds: [] }} />);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
});

describe('Spec 021 — ReviewDistribution', () => {
  it('não exibe distribuição nem nota quando não há avaliações aprovadas', () => {
    render(
      <ReviewDistribution
        data={{
          totalApproved: FIXTURE_REPUTATION_ZERO.data.total_approved,
          distribution: FIXTURE_REPUTATION_ZERO.data.rating_distribution,
        }}
      />
    );
    expect(screen.queryByLabelText('Distribuição de notas')).toBeNull();
    expect(screen.getByText(/Nota não atribuída/)).toBeInTheDocument();
  });

  it('mostra contagens agregadas de 5 a 1 sem inventar buckets ausentes', () => {
    render(
      <ReviewDistribution
        data={{ totalApproved: 3, distribution: { '5': 2, '4': 1 } }}
      />
    );
    const group = screen.getByLabelText('Distribuição de notas');
    const rows = within(group).getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-level'))).toEqual(['5', '4', '3', '2', '1']);
    expect(rows[0]).toHaveTextContent('2');
    expect(rows[2]).toHaveTextContent('0');
  });

  it('usa os dados reais do fixture grande', () => {
    render(
      <ReviewDistribution
        data={{
          totalApproved: FIXTURE_REPUTATION_LARGE.data.total_approved,
          distribution: FIXTURE_REPUTATION_LARGE.data.rating_distribution,
        }}
      />
    );
    expect(screen.getByLabelText('Distribuição de notas')).toBeInTheDocument();
  });
});

describe('Spec 021 — EvidenceCard', () => {
  it('exibe origem, data em BRT e limitações; não cria identificador quando ausente', () => {
    const { container } = render(
      <EvidenceCard
        data={{
          sourceType: 'company_declared',
          dataAsOf: '2026-11-24T03:59:12Z',
          limitations: ['Cidade da sede não comprova cobertura de atendimento.'],
        }}
      />
    );
    expect(screen.getByText(/Dados públicos declarados pelas empresas/)).toBeInTheDocument();
    expect(screen.getByText(/24\/11\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Cidade da sede não comprova/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/asev_|Evidência nº|ID:/);
  });

  it('mantém o valor original quando a data é inválida', () => {
    render(<EvidenceCard data={{ sourceType: 'unknown', dataAsOf: 'data-invalida', limitations: [] }} />);
    expect(screen.getByText(/data-invalida/)).toBeInTheDocument();
    expect(screen.getByText(/Fonte pública não especificada/)).toBeInTheDocument();
  });
});

describe('Spec 021 — CompanyComparisonTable', () => {
  it('mantém critérios do contrato, marca desconhecido e nunca elege vencedor', () => {
    withHost(<CompanyComparisonTable data={FIXTURE_COMPARE.data} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(screen.getAllByText('Não informado').length).toBeGreaterThanOrEqual(2);
    expect(document.body.textContent).not.toMatch(/vencedor|melhor empresa|recomendad/i);
  });

  it('remove empresa mantendo no mínimo 2 e permite restaurar (rollback local)', () => {
    withHost(<CompanyComparisonTable data={FIXTURE_COMPARE.data} />);
    fireEvent.click(screen.getByRole('button', { name: /Remover Helios Sul Energia Solar/ }));
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^Remover / })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Restaurar empresas/ }));
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });
});
