import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateQuoteModal from '@/components/sales/create/CreateQuoteModal';

describe('CreateQuoteModal — Criação e Vinculação de Proposta Comercial', () => {
  jest.setTimeout(20000);
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exibe labels em português e preenche oportunidade quando fornecida por prop', async () => {
    render(
      <CreateQuoteModal
        open={true}
        onClose={jest.fn()}
        opportunityId={42}
      />
    );

    expect(screen.getByText('Nova Proposta Comercial')).toBeInTheDocument();
    expect(screen.getByText('Oportunidade Vinculada *')).toBeInTheDocument();
    expect(screen.getByText('Oportunidade #42')).toBeInTheDocument();
    expect(screen.getByText('Número da Proposta *')).toBeInTheDocument();
    expect(screen.getByText('Valor Total (R$) *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Proposta/i })).toBeInTheDocument();
  });

  it('envia payload padronizado com opportunity_id e total_cents', async () => {
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        quote: { id: 101, number: 'PROP-99999', total_cents: 25000000 },
      }),
    });
    global.fetch = fetchMock;

    render(
      <CreateQuoteModal
        open={true}
        onClose={jest.fn()}
        opportunityId={42}
        onSuccess={onSuccessMock}
      />
    );

    // Preenche valor
    const valorInput = screen.getByPlaceholderText(/Ex: 280000/i);
    await user.clear(valorInput);
    await user.type(valorInput, '250000');

    // Submete formulário
    const submitBtn = screen.getByRole('button', { name: /Salvar Proposta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/sales/quotes',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.quote).toMatchObject({
      opportunity_id: 42,
      total_cents: 25000000,
      currency: 'BRL',
    });
  });

  it('exibe mensagem de erro quando API retorna 422', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: { message: 'Oportunidade é obrigatória.' },
      }),
    });
    global.fetch = fetchMock;

    render(
      <CreateQuoteModal
        open={true}
        onClose={jest.fn()}
        opportunityId={42}
      />
    );

    const valorInput = screen.getByPlaceholderText(/Ex: 280000/i);
    await user.type(valorInput, '150000');

    const submitBtn = screen.getByRole('button', { name: /Salvar Proposta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Oportunidade é obrigatória.')).toBeInTheDocument();
    });
  });
});
