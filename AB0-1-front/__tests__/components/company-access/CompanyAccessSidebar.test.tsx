import React from 'react';
import { render, screen } from '@testing-library/react';
import { CompanyAccessSidebar } from '@/components/company-access/CompanyAccessSidebar';
import { useBannersQuery } from '@/hooks/useBannersQuery';

// Mock do hook useBannersQuery
jest.mock('@/hooks/useBannersQuery');
const mockUseBannersQuery = useBannersQuery as jest.MockedFunction<typeof useBannersQuery>;

// Mock do next/image para renderizar img comum
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ _fill, _unoptimized, alt, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

describe('CompanyAccessSidebar — Redesign com Avalia Solar Ads', () => {
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
      expect(sections.length).toBeGreaterThanOrEqual(3);

      // 1ª seção: Status operacional de acesso
      expect(sections[0]).toHaveAttribute('aria-label', 'Status do Acesso');
      expect(sections[0]).toHaveTextContent('Status do Acesso');
      expect(sections[0]).toHaveTextContent('Solar Tech Brasil');
      expect(sections[0]).toHaveTextContent('Em análise');

      // 2ª seção: Bloco de publicidade
      expect(sections[1]).toHaveAttribute('aria-label', 'Publicidade');
      expect(sections[1]).toHaveTextContent(/Publicidade/i);
      expect(sections[1]).toHaveTextContent(/Patrocinado/i);

      // 3ª seção: Autoridade institucional secundária
      expect(sections[2]).toHaveAttribute('aria-label', 'Autoridade e Verificação');
      expect(sections[2]).toHaveTextContent(/Perfil Verificado 2026/i);
    });

    it('exibe explicitamente os identificadores "Publicidade" e "Patrocinado"', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      expect(screen.getByText('Publicidade')).toBeInTheDocument();
      expect(screen.getByText('Patrocinado')).toBeInTheDocument();
    });
  });

  describe('Ausência de Anúncios Comerciais (Fallback Institucional)', () => {
    it('exibe a peça institucional AvaliaSolarHouseAd quando não houver campanhas ativas', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      const houseAd = screen.getByTestId('avalia-solar-house-ad');
      expect(houseAd).toBeInTheDocument();
      expect(screen.getByText(/Avalia Solar/i)).toBeInTheDocument();
      expect(screen.getByText(/Ads/i)).toBeInTheDocument();
      expect(screen.getByText(/Sua empresa no radar de quem compra energia solar/i)).toBeInTheDocument();

      // CTA para planos de mídia
      const ctaLink = screen.getByRole('link', { name: /Conhecer Planos de Mídia/i });
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute(
        'href',
        expect.stringContaining('/pricing?utm_source=select_company&utm_medium=sidebar_ad&utm_campaign=company_access_sidebar')
      );
    });
  });

  describe('Resiliência a Falhas da API de Banners', () => {
    it('mantém o fallback institucional renderizado sem quebrar a interface em caso de erro da API', () => {
      mockUseBannersQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network timeout ou indisponibilidade de ads'),
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      // A interface continua estável e exibe o house ad
      expect(screen.getByTestId('avalia-solar-house-ad')).toBeInTheDocument();
      expect(screen.getByText(/Conhecer Planos de Mídia/i)).toBeInTheDocument();
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
      expect(screen.getByText('Patrocinado')).toBeInTheDocument();
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
      expect(screen.getByText('Nenhuma empresa selecionada')).toBeInTheDocument();
      expect(screen.getByText(/Selecione sua empresa na busca ao lado/i)).toBeInTheDocument();
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
      expect(screen.getByRole('link', { name: /Gerenciar empresa no painel/i })).toHaveAttribute(
        'href',
        '/dashboard'
      );
    });

    it('exibe link para acompanhamento detalhado de todas as solicitações', () => {
      mockUseBannersQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useBannersQuery>);

      render(<CompanyAccessSidebar />);

      const requestsLink = screen.getByRole('link', { name: /Acompanhar todas as solicitações/i });
      expect(requestsLink).toHaveAttribute('href', '/select-company/requests');
    });
  });
});
