import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallLoggerModal from '@/components/sales/CallLoggerModal';

describe('CallLoggerModal — Validação de Persistência e Falso Positivo', () => {
  jest.setTimeout(20000);
  const originalFetch = global.fetch;
  const originalOpen = window.open;

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.open = originalOpen;
  });

  it('impede submissão e exibe erro quando accountId não é fornecido (SCN-007)', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    render(
      <CallLoggerModal
        contactId={5}
        contactName="Carlos Diretor"
        phone="(47) 99999-8888"
      />
    );

    // Abre o modal
    const openButton = screen.getByRole('button', { name: /Registrar Chamada/i });
    await user.click(openButton);

    // Tenta submeter sem accountId
    const submitButton = screen.getByRole('button', { name: /Salvar Chamada/i });
    await user.click(submitButton);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Contexto de empresa (conta) não encontrado para registrar a ligação.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Chamada Registrada na Timeline!')).not.toBeInTheDocument();
  });

  it('exibe erro e preserva anotações quando a API retorna 422 ou 500 (SCN-006)', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Empresa bloqueada para novas atividades comerciais.' }),
    });
    global.fetch = fetchMock;

    render(
      <CallLoggerModal
        accountId={42}
        contactId={5}
        contactName="Carlos Diretor"
      />
    );

    // Abre modal
    await user.click(screen.getByRole('button', { name: /Registrar Chamada/i }));

    // Digita notas
    const notesInput = screen.getByPlaceholderText(/Ex: Carlos gostou do ROI/i);
    await user.type(notesInput, 'Cliente solicitou retorno na próxima terça');

    // Submete
    await user.click(screen.getByRole('button', { name: /Salvar Chamada/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/sales/accounts/42/activities',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Confirma que NÃO exibiu sucesso falso
    expect(screen.queryByText('Chamada Registrada na Timeline!')).not.toBeInTheDocument();

    // Confirma que exibiu a mensagem de erro
    expect(
      screen.getByText('Empresa bloqueada para novas atividades comerciais.')
    ).toBeInTheDocument();

    // Confirma que as anotações continuam intactas
    expect(notesInput).toHaveValue('Cliente solicitou retorno na próxima terça');
  });

  it('confirma sucesso somente após resposta 201 com ID da atividade (SCN-005)', async () => {
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        activity: { id: 99, activity_type: 'call', subject: 'Chamada' },
      }),
    });
    global.fetch = fetchMock;

    render(
      <CallLoggerModal
        accountId={42}
        contactId={5}
        contactName="Carlos Diretor"
        onSuccess={onSuccessMock}
      />
    );

    await user.click(screen.getByRole('button', { name: /Registrar Chamada/i }));
    await user.click(screen.getByRole('button', { name: /Salvar Chamada/i }));

    await waitFor(() => {
      expect(screen.getByText('Chamada Registrada na Timeline!')).toBeInTheDocument();
    });
  });
});
