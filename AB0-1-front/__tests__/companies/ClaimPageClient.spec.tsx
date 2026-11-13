import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClaimPageClient from '@/app/companies/[id]/claim/ClaimPageClient';
import { companyAccessApi, getErrorStatus } from '@/lib/api';

const replace = jest.fn();
const push = jest.fn();
const mockAuthState = {
  user: { email: 'user@example.com' },
  loading: false,
  isAuthenticated: true,
};

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, push }) }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => mockAuthState }));
jest.mock('@/lib/api', () => ({
  companyAccessApi: { createRequest: jest.fn() },
  getErrorStatus: jest.fn(),
}));

const company = {
  id: 925,
  name: 'Integrador Solar Exemplo',
  city: 'Cuiabá',
  state: 'MT',
  logo_url: null,
};

describe('ClaimPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = { email: 'user@example.com' };
    mockAuthState.loading = false;
    mockAuthState.isAuthenticated = true;
    (companyAccessApi.createRequest as jest.Mock).mockResolvedValue({
      request: { status: 'pending' },
    });
  });

  it('envia contatos opcionais sem anexos e confirma que o pedido segue pendente', async () => {
    render(<ClaimPageClient company={company} companyId="925" />);
    fireEvent.change(screen.getByLabelText(/telefone ou whatsapp/i), {
      target: { value: '+55 65 99999-1234' },
    });
    fireEvent.change(screen.getByLabelText(/mensagem/i), {
      target: { value: 'Sou representante da empresa.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar solicitação/i }));

    await waitFor(() =>
      expect(companyAccessApi.createRequest).toHaveBeenCalledWith(
        925,
        'Sou representante da empresa.',
        {
          contact_email: 'user@example.com',
          contact_phone: '+55 65 99999-1234',
        }
      )
    );
    expect(await screen.findByText(/está pendente de análise/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/anexar documentos/i)).not.toBeInTheDocument();
  });

  it('exibe conflito quando já existe solicitação ou acesso', async () => {
    (companyAccessApi.createRequest as jest.Mock).mockRejectedValue(new Error('conflict'));
    (getErrorStatus as jest.Mock).mockReturnValue(409);
    render(<ClaimPageClient company={company} companyId="925" />);
    fireEvent.click(screen.getByRole('button', { name: /enviar solicitação/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/já tem uma solicitação ou acesso/i);
  });

  it('redireciona visitante ao login mantendo retorno seguro para a reivindicação', async () => {
    mockAuthState.isAuthenticated = false;
    render(<ClaimPageClient company={company} companyId="925" />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/login?return_to=%2Fcompanies%2F925%2Fclaim')
    );
    expect(screen.queryByRole('button', { name: /enviar solicitação/i })).not.toBeInTheDocument();
  });
});
