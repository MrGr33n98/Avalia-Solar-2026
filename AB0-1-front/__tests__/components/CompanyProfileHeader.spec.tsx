import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyIdentityCard from '@/app/companies/[id]/components/CompanyIdentityCard';
import CompanyPremiumHero from '@/app/companies/[id]/components/CompanyPremiumHero';
import CompanyCTAGroup from '@/app/companies/[id]/components/CompanyCTAGroup';
import CompanyCompareToggle from '@/app/companies/[id]/components/CompanyCompareToggle';
import { OFFICIAL_VERIFIED_MESSAGE } from '@/components/company/CompanyVerifiedBadge';
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
  getImageProps: ({ src }: { src: string }) => ({
    props: {
      src,
      srcSet: `/_next/image?url=${encodeURIComponent(src)}&w=640&q=95 640w`,
      sizes: '100vw',
    },
  }),
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
    canAddMore: true,
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
  describe('CompanyIdentityCard — Logo e Moldura (Padrão LinkedIn)', () => {
    it('renderiza a logo com dimensão mobile de 62px, moldura fina de 2px branca, sem padding duplo e com objectFit contain', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/weg-logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      // Box da logo padrão LinkedIn
      const logoBox = screen.getByAltText('WEG Solar').closest('.rounded-\\[14px\\]');
      expect(logoBox).toBeInTheDocument();
      expect(logoBox).toHaveClass(
        'h-[62px]',
        'w-[62px]',
        'border-2',
        'border-white',
        'bg-white',
        'shadow-sm',
        'overflow-hidden',
        'rounded-[14px]'
      );
      // Garante ausência total de padding duplicado no contêiner
      expect(logoBox).not.toHaveClass('p-0.5', 'p-1', 'p-1.5', 'p-2');

      const logoImg = screen.getByAltText('WEG Solar');
      expect(logoImg).toHaveStyle({ objectFit: 'contain' });
      expect(logoImg).toHaveClass('object-contain', 'p-0');
      expect(logoImg).not.toHaveClass('p-0.5', 'p-1');

      const imgContainer = screen.getByTestId('optimized-image-container');
      expect(imgContainer).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full');
    });

    it('preserva integridade de logos horizontais e retangulares com object-contain', () => {
      render(
        <CompanyIdentityCard
          company={{ ...mockCompanyVerified, name: 'Horizontal Brand Solar' }}
          companyStats={{ rating: '5.0', reviewCount: 12 }}
          logoUrl="https://example.com/wide-logo-3x1.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const logoImg = screen.getByAltText('Horizontal Brand Solar');
      expect(logoImg).toBeInTheDocument();
      expect(logoImg).toHaveStyle({ objectFit: 'contain' });
      expect(logoImg).toHaveClass('object-contain', 'p-0');
    });

    it('renderiza letra inicial elegante com raio interno de 12px quando não há logo URL', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl={null}
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const letterNode = screen.getByText('W');
      expect(letterNode).toBeInTheDocument();
      expect(letterNode).toHaveClass('rounded-[12px]');
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

    it('trunca o nome apenas no mobile e mantém o selo de verificação acessível', () => {
      render(
        <CompanyIdentityCard
          company={{
            ...mockCompanyVerified,
            name: 'Cooperativa Regional de Energia Solar',
          }}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const heading = screen.getByTestId('company-name');
      const tail = screen.getByTestId('company-name-tail');
      const verifiedTrigger = screen.getByRole('button', {
        name: /Empresa verificada pelo Avalia Solar/i,
      });

      expect(heading).toHaveClass('min-w-0', 'max-w-full', 'flex', 'md:block', 'md:break-words');
      expect(heading).toHaveAttribute('title', 'Cooperativa Regional de Energia Solar');
      expect(heading).toHaveAttribute('aria-label', 'Cooperativa Regional de Energia Solar');
      expect(screen.getByTestId('company-name-text')).toHaveClass('truncate', 'md:whitespace-normal');
      expect(tail).toHaveTextContent('Solar');
      expect(heading).toContainElement(verifiedTrigger);
      expect(tail).toHaveClass('inline');
    });

    it('mantém o nome excepcionalmente longo íntegro no DOM e quebra somente no desktop', () => {
      render(
        <CompanyIdentityCard
          company={{
            ...mockCompanyVerified,
            name: 'Solar SuperintegradoraFotovoltaicaUltrassustentavel',
          }}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/logo.png"
          logoError={false}
          setLogoError={jest.fn()}
        />
      );

      const heading = screen.getByTestId('company-name');
      expect(heading).toHaveClass('md:break-words');
      expect(heading).toHaveAttribute('title', 'Solar SuperintegradoraFotovoltaicaUltrassustentavel');
      expect(screen.getByTestId('company-name-text')).toHaveClass('truncate', 'md:break-words');
      expect(screen.getByTestId('company-name-tail')).toHaveTextContent(
        'SuperintegradoraFotovoltaicaUltrassustentavel'
      );
    });
  });

  describe('Ações rápidas do header — ordem e acessibilidade', () => {
    it('renderiza Comparar primeiro, Favoritar, Compartilhar e Avaliar com apenas ícones nos três últimos', () => {
      render(
        <CompanyIdentityCard
          company={mockCompanyVerified}
          companyStats={{ rating: '4.9', reviewCount: 85 }}
          logoUrl="https://example.com/weg-logo.png"
          logoError={false}
          setLogoError={jest.fn()}
          compareControl={<CompanyCompareToggle company={mockCompanyVerified} />}
        />
      );

      const actions = screen.getByTestId('company-quick-actions');
      const compare = within(actions).getByRole('checkbox', { name: 'Adicionar WEG Solar à comparação' });
      const favorite = within(actions).getByRole('button', { name: 'Favoritar empresa' });
      const share = within(actions).getByRole('button', { name: 'Compartilhar empresa' });
      const review = within(actions).getByRole('link', { name: 'Avaliar empresa: WEG Solar' });

      const icons = screen.getByTestId('company-quick-icon-actions');
      expect(actions).toHaveClass('flex-col-reverse', 'md:flex-row');
      expect(actions.children[0]).toBe(screen.getByTestId('company-compare-action'));
      expect(actions.children[1]).toBe(icons);
      expect(icons.children[0]).toBe(favorite);
      expect(icons.children[1]).toBe(share);
      expect(icons.children[2]).toBe(review);
      expect(screen.getByTestId('company-compare-action')).toHaveClass('ml-auto', 'md:ml-0');
      expect(compare).not.toBeChecked();
      expect(within(actions).getAllByText('Comparar')).toHaveLength(1);
      expect(review).toHaveAttribute('href', expect.stringMatching(/\/review(?:\/|$)/));

      expect(icons).toHaveClass('gap-0', 'md:gap-1.5');
      // Favoritar/Compartilhar mantêm seus wrappers Tailwind anteriores.
      for (const control of [favorite, share]) {
        expect(control).toHaveClass('h-10', 'w-10', 'md:h-11', 'md:w-11', 'focus-visible:ring-2');
        expect(control.firstElementChild).toHaveClass('h-7', 'w-7', 'md:h-9', 'md:w-9');
        expect(control.querySelector('svg')).toHaveClass('h-3.5', 'w-3.5', 'md:h-[17px]', 'md:w-[17px]');
        expect(control).toHaveTextContent('');
      }
      // ReviewAction v7 é link acessível, usa CSS Module com alvo 44x44,
      // foco visível e ícone de conversa (em vez do wrapper antigo Tailwind).
      expect(review).toHaveClass('iconOnly', 'shrink-0');
      expect(review).toHaveAttribute('title', 'Deixe sua avaliação de WEG Solar');
      expect(review.querySelector('svg')).toHaveClass('lucide-message-circle');
      expect(review).toHaveTextContent('');
      expect(share).not.toHaveClass('hidden', 'lg:flex');
      expect(review).not.toHaveClass('lg:hidden');
      expect(screen.getAllByRole('link', { name: 'Avaliar empresa: WEG Solar' })).toHaveLength(1);
    });
  });

  describe('CompanyPremiumHero — Banner responsivo sem cortes', () => {
    it('usa imagem fluida e nenhuma altura forçada no mobile ou desktop', () => {
      render(
        <CompanyPremiumHero
          company={mockCompanyVerified}
          bannerUrl="https://example.com/banner.png"
          bannerError={false}
          setBannerError={jest.fn()}
        />
      );

      const bannerContainer = document.getElementById('company-premium-hero')?.firstElementChild;
      expect(bannerContainer).toHaveClass('relative', 'w-full');
      expect(bannerContainer).not.toHaveClass(
        'aspect-[3.4/1]',
        'md:aspect-auto',
        'md:h-[176px]',
        'lg:h-[194px]',
        'xl:h-[202px]'
      );
      expect(bannerContainer?.querySelector('[class*="bg-gradient-to-t"]')).not.toBeInTheDocument();
      expect(bannerContainer?.querySelector('[class*="blur-xl"]')).not.toBeInTheDocument();
    });
  });

  describe('Matriz de entitlements — conversão separada da pesquisa', () => {
    it('plano pago: orçamento disponível sem duplicar Comparar nem Avaliar', () => {
      render(<CompanyCTAGroup company={mockCompanyVerified} canRequestQuote />);
      expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Avaliar empresa/ })).not.toBeInTheDocument();
    });

    it('empresa Free: CTA pago não aparece, ações de pesquisa pertencem ao header', () => {
      const { container } = render(<CompanyCTAGroup company={mockCompanyFreeUnverified} canRequestQuote={false} />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
