import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import CreateLeadModal from './CreateLeadModal';
import SalesCommandCenter from '@/components/sales/SalesCommandCenter';
import { salesApi } from '@/lib/api/sales/client';
import { ApiPipelineBoard } from '@/lib/api/sales/types';

jest.mock('@/components/sales/CRMCommandPalette', () => () => null);
jest.mock('@/components/sales/Opportunity360View', () => () => null);
jest.mock('@/components/sales/opportunities/CreateOpportunityDialog', () => () => null);
jest.mock('@/components/sales/filters/LeadFilterDrawer', () => () => null);
jest.mock('@/components/sales/filters/SavedViewMenu', () => () => null);
jest.mock('@/components/sales/SolarRoiCalculator', () => () => null);
jest.mock('@/components/sales/SolarSalesBattlecards', () => () => null);
jest.mock('@/components/sales/opportunities/AccountCombobox', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange('10')}>
      Selecionar conta de teste
    </button>
  ),
}));
jest.mock('@/components/sales/opportunities/ContactCombobox', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/sales/pipeline/PipelineColumn', () => ({
  PipelineColumn: ({
    stage,
    cards,
  }: {
    stage: { key: string; name: string };
    cards: Array<{ id: number; name: string }>;
  }) => (
    <section data-testid={`stage-column-${stage.key}`}>
      <h2>{stage.name}</h2>
      {cards.map((card) => (
        <article key={card.id} data-testid={`kanban-card-${card.id}`}>
          {card.name}
        </article>
      ))}
    </section>
  ),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), info: jest.fn() } }));

const pipeline = {
  id: 2,
  name: 'Pipeline B',
  key: 'pipeline_b',
  active: true,
  stages: [{ id: 20, key: 'prospect', name: 'Prospecção', position: 1, probability: 20 }],
};

const emptyBoard: ApiPipelineBoard = {
  pipeline: { id: 2, name: 'Pipeline B', key: 'pipeline_b' },
  stages: [
    {
      id: 20,
      key: 'prospect',
      name: 'Prospecção',
      position: 1,
      probability: 20,
      total_cards: 0,
      total_value_cents: 0,
    },
  ],
  cards: [],
  totals: { total_cards: 0, total_value_cents: 0, total_weighted_value_cents: 0 },
};

const boardWithCreatedLead: ApiPipelineBoard = {
  ...emptyBoard,
  cards: [
    {
      id: 99,
      name: 'Projeto Solar recém-criado',
      status: 'open',
      account: { id: 10, name: 'Conta de teste' },
      primary_contact: null,
      owner: { id: 1, name: 'Vendedor' },
      stage: { id: 20, key: 'prospect', name: 'Prospecção', position: 1, probability: 20 },
      value_cents: 0,
      currency: 'BRL',
      probability: 20,
      weighted_value_cents: 0,
      priority: 'medium',
      temperature: 'cold',
      aging: { days_in_stage: 0, stage_entered_at: '2026-09-19T10:00:00Z', stale: false },
      flags: { overdue: false, due_today: false, stale: false, hot: false, no_contact: true, no_owner: false },
      tags: [],
    },
  ],
  totals: { total_cards: 1, total_value_cents: 0, total_weighted_value_cents: 0 },
};

function LeadBoardHarness() {
  const [modalOpen, setModalOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState<number | undefined>(pipeline.id);

  return (
    <>
      <button type="button" onClick={() => setModalOpen(true)}>
        Abrir Adicionar Lead
      </button>
      <CreateLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(lead) => setPipelineId(lead.sales_pipeline_id)}
      />
      <SalesCommandCenter hideLayout pipelineOnly pipelineId={pipelineId} />
    </>
  );
}

describe('CreateLeadModal com board canônico', () => {
  beforeEach(() => {
    jest.spyOn(salesApi, 'getPipelines').mockResolvedValue([pipeline]);
    jest.spyOn(salesApi, 'getSources').mockResolvedValue([]);
    jest.spyOn(salesApi, 'getTags').mockResolvedValue([]);
    jest.spyOn(salesApi, 'createLead').mockResolvedValue({
      id: 99,
      name: 'Projeto Solar recém-criado',
      value_cents: 0,
      status: 'open',
      sales_pipeline_id: pipeline.id,
      stage_key: 'prospect',
    });
    jest
      .spyOn(salesApi, 'getPipelineBoard')
      .mockResolvedValueOnce(emptyBoard)
      .mockResolvedValueOnce(boardWithCreatedLead);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria o lead e renderiza o card retornado pelo refetch do board', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <LeadBoardHarness />
      </QueryClientProvider>
    );

    await screen.findByTestId('sales-pipeline-board');
    await user.click(screen.getByRole('button', { name: 'Abrir Adicionar Lead' }));
    await user.type(
      screen.getByPlaceholderText('Ex: Projeto Usina Rooftop Solar 200kWp — Usina Indústria'),
      'Projeto Solar recém-criado'
    );
    await user.click(screen.getByRole('button', { name: 'Selecionar conta de teste' }));
    await user.click(screen.getByRole('button', { name: 'Criar Lead' }));

    await waitFor(() => {
      expect(salesApi.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Projeto Solar recém-criado',
          sales_account_id: 10,
          sales_pipeline_id: pipeline.id,
          stage_key: 'prospect',
        })
      );
    });

    expect(await screen.findByTestId('kanban-card-99')).toHaveTextContent(
      'Projeto Solar recém-criado'
    );
    expect(salesApi.getPipelineBoard).toHaveBeenCalledTimes(2);
  });
});
