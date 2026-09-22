import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RankingData } from '@/lib/api';
import { RankingMethodologyDialog } from './RankingMethodologyDialog';

const definition: RankingData['definition'] = {
  definition_version: 'organic-performance-v2',
  purpose: 'organic_performance',
  sponsored_included: false,
  score_definition: 'Trust Score × 10 + engajamento recente.',
  tie_breaker: 'Ranking Score, Trust Score e número de avaliações.',
  computed_at: '2026-09-22T10:30:00Z',
  data_through: '2026-09-21T23:59:59Z',
  quality_flags: [],
  eligibility_definition: 'Empresas ativas com Ranking Score calculado no escopo selecionado.',
};

function renderDialog(qualityFlags: string[] = []) {
  return render(
    <RankingMethodologyDialog
      definition={definition}
      qualityFlags={qualityFlags}
      officialScope={{ type: 'global', category_id: null }}
      comparisonScope={{
        active: true,
        state: 'SC',
        city: null,
        sector: null,
        category_id: null,
        criterion_slug: null,
      }}
      quadrantMeta={{
        x_axis_definition: 'Autoridade de Confiança',
        y_axis_definition: 'Poder de Execução',
      }}
    />
  );
}

function activateTab(tab: HTMLElement) {
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.mouseUp(tab, { button: 0 });
  fireEvent.click(tab);
}

describe('RankingMethodologyDialog', () => {
  it('abre, apresenta o título e fecha pelo botão Entendi', async () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o ranking?' }));

    expect(screen.getByRole('dialog')).toHaveClass('max-h-[95vh]');
    expect(
      screen.getByRole('heading', { name: 'Como funciona o ranking orgânico?' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explica fórmula, comparação e independência comercial', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o ranking?' }));

    expect(screen.getByText('Ranking oficial e comparação')).toBeInTheDocument();
    expect(
      screen.getByText('Planos comerciais, anúncios e patrocínio não alteram a posição orgânica.')
    ).toBeInTheDocument();

    const formulaTab = screen.getByRole('tab', { name: 'Fórmula' });
    activateTab(formulaTab);

    await waitFor(() => expect(formulaTab).toHaveAttribute('data-state', 'active'));
    expect(screen.getByText('Como a pontuação é formada')).toBeInTheDocument();
    expect(screen.getByText('Exemplo ilustrativo')).toBeInTheDocument();
    expect(
      screen.getByText('Os valores acima não representam dados reais da sua empresa.')
    ).toBeInTheDocument();
  });

  it('exibe datas, versão e flags traduzidas sem expor código bruto', async () => {
    renderDialog(['snapshot_stale']);
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o ranking?' }));
    const transparencyTab = screen.getByRole('tab', { name: 'Transparência' });
    activateTab(transparencyTab);

    await waitFor(() => expect(transparencyTab).toHaveAttribute('data-state', 'active'));
    expect(screen.getAllByText('21/09/2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('organic-performance-v2').length).toBeGreaterThan(0);
    expect(screen.getByText('Atualização pendente')).toBeInTheDocument();
    expect(screen.queryByText('snapshot_stale')).not.toBeInTheDocument();
  });

  it('leva para a metodologia completa', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o ranking?' }));

    expect(screen.getByRole('link', { name: 'Ver metodologia completa' })).toHaveAttribute(
      'href',
      '/como-funciona-o-ranking'
    );
  });
});
