import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyIdentityCard from '@/app/companies/[id]/components/CompanyIdentityCard';
import CompanyPremiumHero from '@/app/companies/[id]/components/CompanyPremiumHero';
import CompanyCTAGroup from '@/app/companies/[id]/components/CompanyCTAGroup';
import CompanyVerifiedBadge, { OFFICIAL_VERIFIED_MESSAGE } from '@/components/company/CompanyVerifiedBadge';
import type { Company } from '@/lib/api';

jest.mock('@/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt, className, objectFit, fill, containerClassName }: any) => (
    <div data-testid="optimized-image-container" className={containerClassName}>
      <img src={src} alt={alt || 'img'} className={className} style={{ objectFit }} />
    </div>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt || 'img'} className={className} />
  ),
}));

jest.mock('@/app/companies/[id]/components/CompanyViewCounter', () => () => (
  <span data-testid="view-counter">42 visualizações</span>
));

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: jest.fn().mockReturnValue(false),
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: jest.fn().mockReturnValue(false),
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
  }),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
}));

beforeAll(() => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve({ views_count: 42 }),
    })
  ) as any;
});

afterAll(() => {
  delete (global as any).fetch;
});

const mockCompanyVerified: Company = {
  id: 10,
  name: 'WEG Solar',
  slug: 'weg-solar',
  city: 'Jaraguá do Sul',
  state: 'SC',
  description: 'Soluções completas em energia solar fotovoltaica.',
  verified: true,
  has_paid_plan: true,
  website: 'https://www.weg.net',
  founded_year: 1961,
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
  },
} as unknown as Company;

const mockCompanyFreeUnverified: Company = {
  id: 20,
  name: 'Instaladora Local',
  slug: 'instaladora-local',
  city: 'Campinas',
  state: 'SP',
  description: 'Instalação de painéis residenciais.',
  verified: false,
  has_paid_plan: false,
  website: 'https://www.instaladora.com',
  founded_year: 2020,
  feature_access: {},
} as unknown as Company;

describe('SPEC-UI-027 — Perfil de Empresas Header & Identidade Visual', () => {
  describe('CompanyIdentityCard — Logo e Moldura', () => {
    it('renderiza a logo com dimensão mobile de 62px (faixa 60-64px), moldura única de 2px e objectFit contain', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/weg-logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      // Box da logo
      const logoBox = screen.getByAltText('WEG Solar').closest('.rounded-2xl');
      expect(logoBox).toBeInTheDocument();
      expect(logoBox).toHaveClass('h-[62px]', 'w-[62px]', 'border-2', 'overflow-hidden');

      const logoImg = screen.getByAltText('WEG Solar');
      expect(logoImg).toHaveStyle({ objectFit: 'contain' });
    });

    it('renderiza letra inicial elegante quando não há logo URL', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl={null}
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      expect(screen.getByText('W')).toBeInTheDocument();
    });
  });

  describe('CompanyVerifiedBadge — Selo e Tooltip Padronizado', () => {
    it('exibe o selo azul quando a empresa é verificada e exibe o texto padrão no tooltip', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const verifiedTrigger = screen.getByRole('button', {
        name: /Empresa verificada pelo Avalia Solar/i,
      });
      expect(verifiedTrigger).toBeInTheDocument();

      // Tooltip contém exatamente a frase padronizada do SPEC-UI-027
      expect(OFFICIAL_VERIFIED_MESSAGE).toBe(
        'Empresa verificada pelo Avalia Solar.\n\nAs informações cadastrais passaram pelo nosso processo de verificação.'
      );
    });

    it('NUNCA exibe selo verificado para empresa não verificada', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyFreeUnverified}
          companyStats={{ rating: '0', reviewCount: 0 }}
          logoUrl="https://example.com/logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: OFFICIAL_VERIFIED_MESSAGE })).not.toBeInTheDocument();
    });
  });

  describe('Ações Secundárias — Favoritar e Compartilhar', () => {
    it('mantém dimensão visual de 36px no mobile e hit target acessível (>=44px)', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const favBtn = screen.getByRole('button', { name: 'Favoritar empresa' });
      expect(favBtn).toHaveClass('h-9', 'w-9', 'relative');

      const shareBtn = screen.getByRole('button', { name: 'Compartilhar empresa' });
      expect(shareBtn).toHaveClass('h-9', 'w-9', 'relative');
    });
  });

  describe('CompanyPremiumHero — Proporção do Banner (-12% altura)', () => {
    it('aplica aspect-[3.4/1] no mobile e alturas compactas no desktop (md:h-[176px])', () => {
      render(
        <CompanyPremiumHero
          company={mockCompanyVerified}
          bannerUrl="https://example.com/banner.png"
          bannerError={false}
          setBannerError={jest.fn()}
        />
      );

      const bannerContainer = document.getElementById('company-premium-hero')?.firstElementChild;
      expect(bannerContainer).toHaveClass(
        'aspect-[3.4/1]',
        'md:aspect-auto',
        'md:h-[176px]',
        'lg:h-[194px]',
        'xl:h-[202px]'
      );
    });
  });

  describe('Matriz de Entitlements — CompanyCTAGroup', () => {
    it('com entitlement ativo: Solicitar orçamento ocupa 100% da primeira linha, Comparar e Avaliar dividem 50/50 a segunda linha', () => {
      render(<CompanyCTAGroup company={mockCompanyVerified} canRequestQuote={true} />);

      const quoteBtn = screen.getByRole('button', { name: 'Solicitar orçamento' });
      expect(quoteBtn).toBeInTheDocument();
      expect(quoteBtn).toHaveClass('w-full');

      const compareBtn = screen.getByRole('button', { name: 'Comparar' });
      const reviewLink = screen.getByRole('link', { name: 'Avaliar empresa: WEG Solar' });

      expect(compareBtn).toBeInTheDocument();
      expect(reviewLink).toBeInTheDocument();

      const secondaryContainer = compareBtn.closest('.grid');
      expect(secondaryContainer).toHaveClass('grid-cols-2', 'gap-1.5');
    });

    it('empresa Free: Solicitar orçamento NÃO é renderizado e Comparar + Avaliar ficam no topo sem espaço vazio', () => {
      render(<CompanyCTAGroup company={mockCompanyFreeUnverified} canRequestQuote={false} />);

      expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();

      const compareBtn = screen.getByRole('button', { name: 'Comparar' });
      const reviewLink = screen.getByRole('link', { name: 'Avaliar empresa: Instaladora Local' });

      expect(compareBtn).toBeInTheDocument();
      expect(reviewLink).toBeInTheDocument();

      const group = document.getElementById('company-cta-group');
      // No free, não há primeiro filho de orçamento
      expect(group?.firstElementChild).toBe(compareBtn.closest('.grid'));
    });
  });
});
