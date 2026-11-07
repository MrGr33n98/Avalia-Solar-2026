import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeadsOpportunities from './LeadsOpportunities';
import { companyDashboardApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  companyDashboardApi: { getLeads: jest.fn() },
}));

const getLeads = companyDashboardApi.getLeads as jest.Mock;

const request = {
  id: 7,
  name: 'Contato Solar',
  email: 'solar@exemplo.com',
  phone: '48999999999',
  product_vertical: 'Energia Solar',
  request_type: 'quote' as const,
  created_at: '2026-11-05T12:00:00Z',
  message: 'Quero um orçamento.',
};

const apiResponse = (data = [request], total = data.length) => ({
  data,
  meta: { pagination: { page: 1, per_page: 20, total, total_pages: total > 20 ? 2 : 1 } },
});

describe('LeadsOpportunities — solicitações recebidas da empresa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLeads.mockResolvedValue(apiResponse());
  });

  it('usa a empresa selecionada, mostra dados reais e inicia em seis meses', async () => {
    render(<LeadsOpportunities companyId="372" />);
    expect(await screen.findByText('1 solicitação encontrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 meses' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Contato Solar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Energia Solar').length).toBeGreaterThan(0);
    expect(getLeads).toHaveBeenCalledWith('372', expect.objectContaining({
      page: 1, per_page: 20, from_date: expect.any(String), to_date: expect.any(String),
    }));
    expect(screen.queryByText('Acesso Elite ao Mercado')).not.toBeInTheDocument();
  });

  it('envia os filtros ao backend em vez de filtrar somente a página atual', async () => {
    render(<LeadsOpportunities companyId="372" />);
    await screen.findByText('1 solicitação encontrada');

    fireEvent.click(screen.getByRole('button', { name: '30 dias' }));
    fireEvent.change(screen.getByLabelText('Tipo de solicitação'), { target: { value: 'quote' } });
    fireEvent.change(screen.getByLabelText('E-mail contém'), { target: { value: 'solar@' } });

    await waitFor(() => expect(getLeads).toHaveBeenCalledWith('372', expect.objectContaining({
      page: 1, request_type: 'quote', email: 'solar@',
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => expect(getLeads).toHaveBeenLastCalledWith('372', expect.not.objectContaining({
      request_type: 'quote', email: 'solar@',
    })));
  });

  it('abre detalhes da solicitação, sem cartões de terceiros', async () => {
    render(<LeadsOpportunities companyId="1190" />);
    await screen.findByText('1 solicitação encontrada');
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalhes de Contato Solar' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Quero um orçamento.');
    expect(screen.getByRole('dialog')).toHaveTextContent('solar@exemplo.com');
  });

  it('distingue erro, lista vazia e recarregamento', async () => {
    getLeads.mockRejectedValueOnce(new Error('API indisponível')).mockResolvedValueOnce(apiResponse([]));
    render(<LeadsOpportunities companyId="372" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponível');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhuma solicitação neste período.')).toBeInTheDocument();
  });
});
