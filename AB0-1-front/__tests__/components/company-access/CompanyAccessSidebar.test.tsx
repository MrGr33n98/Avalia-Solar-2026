import React from 'react';
import { render, screen } from '@testing-library/react';
import { CompanyAccessSidebar } from '@/components/company-access/CompanyAccessSidebar';
import { useBannersQuery } from '@/hooks/useBannersQuery';

// Mock do hook useBannersQuery; location matches the user-visible "Todo SC" selector.
jest.mock('@/hooks/useBannersQuery');
jest.mock('@/contexts/LocationContext', () => ({
  useLocation: () => ({ selectedState: 'SC', selectedCity: null }),
}));
const mockUseBannersQuery = useBannersQuery as jest.MockedFunction<typeof useBannersQuery>;

// Mock do next/image para renderizar img comum
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ _fill, _unoptimized, alt, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

describe('CompanyAccessSidebar — ActiveAdmin as single source of ad creatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hierarquia e Conformidade Publicitária', () => {
    it('renderiza o status de acesso operacional antes do bloco de publicidade', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      const { container } = render(
        <CompanyAccessSidebar
          pendingRequest={{
            id: 1,
            company_id: 101,
            company_name: 'Solar Tech Brasil',
            status: 'pending',
            requested_at: '2026-11-01T10:00:00Z',
          }}
        />
      );

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(2);

      // 1ª seção: Status operacional de acesso
      expect(sections[0]).toHaveAttribute('aria-label', 'Status do Acesso');
      expect(sections[0]).toHaveTextContent('Status do Acesso');
      expect(sections[0]).toHaveTextContent('Solar Tech Brasil');
      expect(sections[0]).toHaveTextContent('Em análise');

      // No eligible campaign: the page must not manufacture a "sponsored" placement.
      expect(sections[1]).toHaveAttribute('aria-label', 'Autoridade e Verificação');
      expect(sections[1]).toHaveTextContent(/Perfil Verificado 2026/i);
      expect(screen.queryByText('Patrocinado')).not.toBeInTheDocument();
    });

    it('only displays an advertisement label when a real campaign is eligible', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      expect(screen.queryByText('Publicidade')).not.toBeInTheDocument();
      expect(screen.queryByText('Patrocinado')).not.toBeInTheDocument();
    });
  });

  describe('Empty/error delivery states', () => {
    it('does not display a fabricated house ad when the catalog is empty', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [], isLoading: false, error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      expect(screen.queryByTestId('avalia-solar-house-ad')).not.toBeInTheDocument();
      expect(screen.queryByText(/300.000 clientes/)).not.toBeInTheDocument();
      expect(screen.queryByText('Publicidade')).not.toBeInTheDocument();
      expect(screen.getByText(/Perfil Verificado 2026/)).toBeInTheDocument();
    });

    it('does not mask API failures with a commercial-looking mockup', () => {
      mockUseBannersQuery.mockReturnValue({
        data: null, isLoading: false, error: new Error('503'),
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      expect(screen.queryByText('Patrocinado')).not.toBeInTheDocument();
      expect(screen.queryByTestId('avalia-solar-house-ad')).not.toBeInTheDocument();
      expect(screen.getByText(/Perfil Verificado 2026/)).toBeInTheDocument();
    });
  });

  describe('Banner Comercial Elegível', () => {
    it('renderiza o banner patrocinado ativo via BannerSlot', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [
          {
            id: 88,
            title: 'Inversor Solar Fotovoltaico Pro',
            alt_text: 'Anúncio Inversor Fotovoltaico',
            image_url: 'https://cdn.example.com/banner-300x250.webp',
            target_url: 'https://patrocinador.com.br/inversores',
            position: 'company_access_sidebar',
            sponsored: true,
            width: 300,
            height: 250,
          },
        ],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      const bannerImg = screen.getByAltText('Anúncio Inversor Fotovoltaico');
      expect(bannerImg).toBeInTheDocument();
      expect(screen.getByText('Publicidade')).toBeInTheDocument();
      expect(screen.getAllByText('Patrocinado').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Existing sidebar inventory delivery', () => {
    it('requests the existing ActiveAdmin sidebar as an explicit secondary placement, with SC targeting', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [{
          id: 14,
          title: 'UPFRONT 2027',
          alt_text: 'UPFRONT 2027',
          image_url: 'https://cdn.example.com/upfront-300x600.webp',
          position: 'company_profile_sidebar_sponsored',
          sponsored: true,
          width: 300, height: 600,
        }],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      expect(mockUseBannersQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 'company_access_sidebar',
          fallbackPositions: ['company_profile_sidebar_sponsored'],
          limit: 1,
          state: 'SC',
          city: undefined,
        })
      );
      expect(screen.getByAltText('UPFRONT 2027')).toBeInTheDocument();
      expect(screen.queryByTestId('avalia-solar-house-ad')).not.toBeInTheDocument();
    });

  });

  describe('Estados Operacionais do Status de Acesso', () => {
    it('exibe estado inicial quando nenhuma empresa ou solicitação foi selecionada', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar selectedCompany={null} pendingRequest={null} />);

      expect(screen.getByText('Verificação 24h')).toBeInTheDocument();
      expect(screen.getByText('Acompanhamento Corporativo')).toBeInTheDocument();
      expect(screen.getByText(/Ao selecionar sua empresa, a solicitação é encaminhada/i)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Gerenciar empresa no painel/i })).not.toBeInTheDocument();
    });

    it('exibe status de aprovação concedida com link para gerenciar', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(
        <CompanyAccessSidebar
          pendingRequest={{
            id: 2,
            company_id: 102,
            company_name: 'EcoEnergia Solar',
            status: 'approved',
            requested_at: '2026-10-25T14:30:00Z',
          }}
        />
      );

      expect(screen.getByText('Aprovado')).toBeInTheDocument();
      expect(screen.getByText('EcoEnergia Solar')).toBeInTheDocument();
      expect(screen.getByText(/Seu acesso foi liberado!/i)).toBeInTheDocument();
      // Abre o painel já na empresa aprovada (multiempresa).
      expect(screen.getByRole('link', { name: /Gerenciar empresa no painel/i })).toHaveAttribute(
        'href',
        '/dashboard?company_id=102'
      );
    });

    it('não oferece o painel enquanto a solicitação está em análise', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(
        <CompanyAccessSidebar
          pendingRequest={{
            id: 3,
            company_id: 103,
            company_name: 'Sol Nascente',
            status: 'pending',
          }}
        />
      );

      expect(screen.getByText('Em análise')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Gerenciar empresa no painel/i })).not.toBeInTheDocument();
    });

    it('exibe link para acompanhamento detalhado de todas as solicitações', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      const requestsLink = screen.getByRole('link', { name: /Histórico de solicitações/i });
      expect(requestsLink).toHaveAttribute('href', '/select-company/requests');
    });
  });
});
