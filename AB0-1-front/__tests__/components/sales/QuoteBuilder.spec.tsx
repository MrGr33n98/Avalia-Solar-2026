import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteBuilder from '@/components/sales/QuoteBuilder';

describe('QuoteBuilder — Construtor de Propostas Rápidas', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('preenche oportunidade padrão e desabilita campo quando defaultOpportunityId é informado', () => {
    render(<QuoteBuilder onCreated={jest.fn()} defaultOpportunityId={77} />);

    expect(screen.getByText('Nova Proposta Comercial')).toBeInTheDocument();
    const oppInput = screen.getByPlaceholderText('ID da Oportunidade');
    expect(oppInput).toHaveValue('77');
    expect(oppInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /Criar Proposta/i })).toBeInTheDocument();
  });

  it('envia dados normalizados e executa onCreated no sucesso', async () => {
    const user = userEvent.setup();
    const onCreatedMock = jest.fn();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ quote: { id: 50, number: 'PROP-777', total_cents: 18000000 } }),
    });
    global.fetch = fetchMock;

    render(<QuoteBuilder onCreated={onCreatedMock} defaultOpportunityId={77} />);

    const totalInput = screen.getByPlaceholderText('Valor Total em R$');
    await user.type(totalInput, '180000');

    const submitBtn = screen.getByRole('button', { name: /Criar Proposta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/sales/quotes',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(onCreatedMock).toHaveBeenCalled();
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.quote).toMatchObject({
      opportunity_id: 77,
      total_cents: 18000000,
      currency: 'BRL',
    });
  });
});
