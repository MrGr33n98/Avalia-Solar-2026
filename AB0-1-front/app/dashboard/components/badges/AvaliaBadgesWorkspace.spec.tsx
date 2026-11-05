import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvaliaBadgesWorkspace from './AvaliaBadgesWorkspace';
import { badgesApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  badgesApi: { getByCompany: jest.fn() },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const company = { id: 1190, name: 'Empresa Solar SC', slug: 'empresa-solar-sc', reviews_count: 3 };
const badgesMock = badgesApi.getByCompany as jest.Mock;

describe('AvaliaBadgesWorkspace — sete selos / gamificação inicial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  it('exibe os sete novos selos, sem as quatro distinções genéricas antigas', async () => {
    badgesMock.mockResolvedValue([]);
    render(<AvaliaBadgesWorkspace company={company} companyId={1190} />);
    await waitFor(() => expect(screen.getByTestId('earned-count')).toHaveTextContent('0'));

    expect(screen.getByTestId('badge-catalog-grid').querySelectorAll('button')).toHaveLength(7);
    expect(screen.getByTestId('badge-card-pioneira-2026')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-lider-de-categoria')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-lider-de-crescimento')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-referencia-regional')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-melhor-suporte')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-especialista-comercial')).toBeInTheDocument();
    expect(screen.getByTestId('badge-card-especialista-residencial')).toBeInTheDocument();
    expect(screen.queryByText('Integrador Verificado 2026')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Baixar SVG/ })).not.toBeInTheDocument();
    expect(screen.getByText(/3\/5 avaliações/)).toBeInTheDocument();
  });

  it('somente registro oficial da API concede badge e libera download/embedding', async () => {
    badgesMock.mockResolvedValue([{ id: 9, public_slug: 'pioneira-2026', name: 'Pioneira 2026', year: 2026 }]);
    render(<AvaliaBadgesWorkspace company={company} companyId={1190} />);
    await waitFor(() => expect(screen.getByTestId('earned-count')).toHaveTextContent('1'));

    expect(screen.getByRole('link', { name: /Baixar SVG/ })).toHaveAttribute('href', '/assets/badges/2026/pioneira-2026.svg');
    expect(screen.getByRole('link', { name: /Verificar selo/ })).toHaveAttribute('href', '/badges/pioneira-2026?company_id=1190');
    expect(screen.getByRole('button', { name: /Copiar código HTML/ })).toBeEnabled();

    fireEvent.click(screen.getByTestId('badge-card-melhor-suporte'));
    expect(screen.queryByRole('link', { name: /Baixar SVG/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Downloads e incorporação liberados após concessão oficial/)).toBeInTheDocument();
  });

  it('falha de API não inventa concessões e permite nova tentativa', async () => {
    badgesMock.mockRejectedValueOnce(new Error('API 500')).mockResolvedValueOnce([]);
    render(<AvaliaBadgesWorkspace company={company} companyId={1190} />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByTestId('earned-count')).toHaveTextContent('—');
    expect(screen.queryByRole('link', { name: /Baixar SVG/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    await waitFor(() => expect(screen.getByTestId('earned-count')).toHaveTextContent('0'));
  });

  it('filtra por segmento e estado sem modificar a concessão oficial', async () => {
    badgesMock.mockResolvedValue([]);
    render(<AvaliaBadgesWorkspace company={company} companyId={1190} />);
    await waitFor(() => expect(screen.getByTestId('earned-count')).toHaveTextContent('0'));

    fireEvent.change(screen.getByLabelText('Filtrar especialidade'), { target: { value: 'comercial' } });
    expect(screen.getByTestId('badge-card-especialista-comercial')).toBeInTheDocument();
    expect(screen.queryByTestId('badge-card-especialista-residencial')).not.toBeInTheDocument();
    expect(screen.getByTestId('badge-catalog-grid').querySelectorAll('button')).toHaveLength(6);

    fireEvent.change(screen.getByLabelText('Filtrar conquistas'), { target: { value: 'earned' } });
    expect(screen.getByText(/Nenhum selo corresponde aos filtros/)).toBeInTheDocument();
  });
});
