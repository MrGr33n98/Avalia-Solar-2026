import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CompanyAiWidget from './CompanyAiWidget';
import { fetchApi } from '@/lib/api';
import { CommunicationSurfaceManager } from '@/lib/communication-surface-manager';
import { openQuoteWizard } from '@/lib/quote-wizard';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));
jest.mock('@/lib/quote-wizard', () => ({ openQuoteWizard: jest.fn() }));

const mockFetch = fetchApi as jest.Mock;
const mockOpenQuoteWizard = openQuoteWizard as jest.Mock;

describe('CompanyAiWidget', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockOpenQuoteWizard.mockReset();
  });

  afterEach(() => act(() => CommunicationSurfaceManager.close('company_ai')));

  it('fica invisível quando a empresa não tem capability publicada', async () => {
    mockFetch.mockResolvedValue({ enabled: false, mode: 'general' });
    const { container } = render(<CompanyAiWidget companyId={10} companyName="Empresa Solar" />);

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/companies/10/ai_capability', expect.anything())
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('inicia sessão assinada e envia mensagens sem expor conteúdo na telemetria', async () => {
    mockFetch
      .mockResolvedValueOnce({ enabled: true, mode: 'company', company_id: 10 })
      .mockResolvedValueOnce({
        session_id: 22,
        access_token: 'signed-token',
        initial_message: { id: 1, role: 'assistant', content: 'Olá!' },
      })
      .mockResolvedValueOnce({
        session_id: 22,
        idempotent: false,
        awaiting_agent: false,
        user_message: { id: 2, role: 'user', content: 'Quais produtos vocês oferecem?' },
        assistant_message: { id: 3, role: 'assistant', content: 'Veja os produtos publicados.' },
        action: { type: 'open_quote_wizard', company_id: 10 },
      });

    render(<CompanyAiWidget companyId={10} companyName="Empresa Solar" />);
    await waitFor(() => expect(CommunicationSurfaceManager.active).toBe('company_ai'));
    const toggle = await screen.findByRole('button', { name: /Assistente de Empresa Solar/ });
    fireEvent.click(toggle);
    expect(await screen.findByText('Olá!')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pergunta para o assistente'), {
      target: { value: 'Quais produtos vocês oferecem?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/companies/10/ai_sessions/22/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'X-Chat-Session-Token': 'signed-token' },
        })
      )
    );
    expect(await screen.findByText('Veja os produtos publicados.')).toBeInTheDocument();
    expect(CommunicationSurfaceManager.active).toBe('company_ai');
    expect(mockOpenQuoteWizard).toHaveBeenCalledWith({
      preferredCompanyId: 10,
      source: 'company-ai-assistant',
    });
  });
});
