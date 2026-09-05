import { render, screen, waitFor } from '@testing-library/react';
import CampaignPage from '@/app/dashboard/sales/campaigns/[id]/page';
import { fetchCampaign } from '@/lib/api-campaigns';

let routeId = 'banana';
jest.mock('next/navigation', () => ({ useParams: () => ({ id: routeId }) }));
jest.mock('@/components/sales/layout/SalesLayoutWrapper', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/lib/api-campaigns', () => ({ fetchCampaign: jest.fn() }));

beforeEach(() => jest.clearAllMocks());
test.each(['banana', 'audiences', 'templates', 'sequences', '0', '-1', '1.5', 'Infinity', '9007199254740992'])('identificador %s apresenta erro sem loading ou consulta inválida', (id) => {
  routeId = id;
  render(<CampaignPage />);
  expect(screen.getByRole('heading', { name: 'Campanha não encontrada' })).toBeInTheDocument();
  expect(screen.queryByText(/Carregando detalhes/)).not.toBeInTheDocument();
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  expect(fetchCampaign).not.toHaveBeenCalled();
});
test('falha de rede encerra loading e oferece retry', async () => {
  routeId = '123';
  jest.mocked(fetchCampaign).mockRejectedValue(new Error('Rede indisponível'));
  render(<CampaignPage />);
  await waitFor(() => expect(screen.getByText('Rede indisponível')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  expect(screen.queryByText(/Carregando detalhes/)).not.toBeInTheDocument();
});
