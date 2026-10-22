import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';

describe('CreateActivityModal — Registro de Atividades e Rota', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exibe labels em português e valida assunto obrigatório', async () => {
    const user = userEvent.setup();
    render(
      <CreateActivityModal
        open={true}
        onClose={jest.fn()}
        accountId={10}
      />
    );

    expect(screen.getByText('Registrar Atividade Comercial')).toBeInTheDocument();
    expect(screen.getByText('Tipo de atividade')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Atividade/i })).toBeInTheDocument();

    // Tenta submeter sem assunto
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Assunto é obrigatório')).toBeInTheDocument();
    });
  });

  it('envia requisição com accountId para a rota aninhada da conta e confirma persistência', async () => {
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        activity: { id: 88, subject: 'Reunião de Apresentação', activity_type: 'meeting' },
      }),
    });
    global.fetch = fetchMock;

    render(
      <CreateActivityModal
        open={true}
        onClose={jest.fn()}
        accountId={25}
        opportunityId={102}
        onSuccess={onSuccessMock}
      />
    );

    const subjectInput = screen.getByPlaceholderText(/Ex: Alinhamento de payback/i);
    await user.type(subjectInput, 'Reunião de alinhamento com engenheiro');

    const submitBtn = screen.getByRole('button', { name: /Salvar Atividade/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/sales/accounts/25/activities',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"sales_account_id":25'),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Atividade registrada com sucesso!')).toBeInTheDocument();
    });
  });
});
