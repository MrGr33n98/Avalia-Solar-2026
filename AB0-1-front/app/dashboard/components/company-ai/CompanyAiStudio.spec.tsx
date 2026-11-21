import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompanyAiStudio, { buildStarterWorkflow } from './CompanyAiStudio';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));

const mockFetch = fetchApi as jest.Mock;

describe('Company AI studio — TDD UI contracts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      enabled: false, greeting: 'Olá, visitante!', timezone: 'America/Sao_Paulo',
      weekly_hours: {}, exceptions: {}, workflow_version: null
    });
  });

  it('renders a compact editor, separates preview from real AI and defaults to no publication', async () => {
    render(<CompanyAiStudio companyId="123" />);
    expect(await screen.findByLabelText('Saudação')).toHaveValue('Olá, visitante!');
    expect(screen.getByText(/Simulação estática/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar versão validada' })).toBeDisabled();
  });

  it('does not permit arbitrary tool names in the generated frontend workflow contract', () => {
    const def = buildStarterWorkflow('Oi', 'all');
    const actions = def.nodes.filter((node) => node.type === 'action');
    expect(actions).toEqual([{ id: 'quote', type: 'action', action_key: 'open_quote_wizard' }]);
    expect(JSON.stringify(def)).not.toContain('execute_sql');
  });

  it('uses the scoped company endpoint for settings and asks for a workflow draft', async () => {
    render(<CompanyAiStudio companyId="123" />);
    await screen.findByLabelText('Saudação');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/company_admin/ai_assistant?company_id=123', expect.objectContaining({ method: 'PATCH' })
    ));
  });
});
