import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import type { Product } from '@/lib/api';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} data-fill={fill ? 'true' : undefined} alt={props.alt || ''} />;
  };
});

// Mock FavoriteButton
jest.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: ({
    initialFavorited,
    onChange,
    className,
  }: {
    initialFavorited?: boolean;
    onChange?: () => void;
    className?: string;
  }) => (
    <button
      data-testid="favorite-button"
      className={className}
      onClick={onChange}
      aria-label={initialFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {initialFavorited ? 'Favorito' : 'Favoritar'}
    </button>
  ),
}));

describe('ProductCardEnhanced', () => {
  const baseProduct: Product = {
    id: 101,
    name: 'Inversor Solar String Trifásico 10kW',
    description: 'Inversor de alta eficiência para geração solar fotovoltaica.',
    price: 8500,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    image_url: 'https://example.com/inverter.jpg',
    category: { id: 1, name: 'Inversores', slug: 'inversores' },
    brand: { id: 10, name: 'GoodWe Brasil', slug: 'goodwe' },
    company: {
      id: 5,
      name: 'Distribuidora Solar ABC',
      rating_avg: 4.8,
      reviews_count: 12,
      verified: true,
    },
  };

  describe('density="default" (retrocompatibilidade com Catálogo)', () => {
    it('mantém aspect-[4/3] e rounded-xl na variante default', () => {
      const { container } = render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
        />
      );

      const article = container.querySelector('article');
      expect(article).toHaveClass('rounded-xl');
      const mediaContainer = container.querySelector('.aspect-\\[4\\/3\\]');
      expect(mediaContainer).toBeInTheDocument();
    });
  });

  describe('density="compact" (SPEC-023 para Busca)', () => {
    it('renderiza container compacto com altura de mídia de 136px e rounded-lg', () => {
      const { container } = render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      const article = container.querySelector('article');
      expect(article).toHaveClass('rounded-lg');
      // Media container deve ter altura explícita de 136px
      const mediaContainer = container.querySelector('.h-\\[136px\\]');
      expect(mediaContainer).toBeInTheDocument();
      // Não deve ter aspect-[4/3] na variante compacta
      expect(container.querySelector('.aspect-\\[4\\/3\\]')).not.toBeInTheDocument();
    });

    it('exibe badge "Verificado" associado à empresa quando empresa for verificada', () => {
      render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      const badge = screen.getByText(/Verificado/i);
      expect(badge).toBeInTheDocument();
    });

    it('não exibe badge de verificado quando a empresa não for verificada', () => {
      const unverifiedProduct = {
        ...baseProduct,
        company: {
          ...baseProduct.company,
          verified: false,
        },
      };

      render(
        <ProductCardEnhanced
          product={unverifiedProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.queryByText(/Verificado/i)).not.toBeInTheDocument();
    });

    it('atribui avaliações explicitamente à empresa (singular e plural)', () => {
      const { rerender } = render(
        <ProductCardEnhanced
          product={{
            ...baseProduct,
            company: { ...baseProduct.company, rating_avg: 4.5, reviews_count: 1 },
          }}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.getByText(/1 avaliação da empresa/i)).toBeInTheDocument();

      rerender(
        <ProductCardEnhanced
          product={{
            ...baseProduct,
            company: { ...baseProduct.company, rating_avg: 4.8, reviews_count: 12 },
          }}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.getByText(/12 avaliações da empresa/i)).toBeInTheDocument();
    });

    it('exibe "Sem avaliações da empresa" quando não houver notas', () => {
      render(
        <ProductCardEnhanced
          product={{
            ...baseProduct,
            company: { ...baseProduct.company, rating_avg: 0, reviews_count: 0 },
          }}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.getByText(/Sem avaliações da empresa/i)).toBeInTheDocument();
    });

    it('formata o preço corretamente em BRL', () => {
      render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      // Preço BRL formatado de R$ 8.500,00
      expect(screen.getByText(/8\.500/)).toBeInTheDocument();
    });

    it('NÃO exibe parcelamento fictício (10x sem juros) se não confirmado nos dados', () => {
      render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      // Não deve inventar "10x de ... sem juros"
      expect(screen.queryByText(/10x de/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sem juros/i)).not.toBeInTheDocument();
    });

    it('exibe parcelamento quando expressamente confirmado no payload', () => {
      const productWithInstallments = {
        ...baseProduct,
        installments: '12x de R$ 750,00 no cartão',
      } as unknown as Product;

      render(
        <ProductCardEnhanced
          product={productWithInstallments}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.getByText('12x de R$ 750,00 no cartão')).toBeInTheDocument();
    });

    it('exibe "Preço sob consulta" quando preço for nulo, 0 ou on_request', () => {
      render(
        <ProductCardEnhanced
          product={{ ...baseProduct, price: 0 }}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      expect(screen.getByText('Preço sob consulta')).toBeInTheDocument();
    });

    it('preserva acessibilidade do título para nomes longos com atributo title', () => {
      const longName =
        'Kit Gerador de Energia Solar Fotovoltaico Monocristalino 15kWp Completo com Estrutura e Cabeamento';
      render(
        <ProductCardEnhanced
          product={{ ...baseProduct, name: longName }}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      const titleLink = screen.getByTitle(longName);
      expect(titleLink).toBeInTheDocument();
      expect(titleLink).toHaveTextContent(longName);
    });

    it('aciona o callback onToggleFavorite ao interagir com o botão de favoritos', () => {
      const onToggle = jest.fn();
      render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={onToggle}
          density="compact"
        />
      );

      fireEvent.click(screen.getByTestId('favorite-button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renderiza CTA com link para os detalhes do produto', () => {
      render(
        <ProductCardEnhanced
          product={baseProduct}
          favorite={false}
          onToggleFavorite={jest.fn()}
          density="compact"
        />
      );

      const ctaLink = screen.getByRole('link', { name: /Ver detalhes/i });
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute('href', expect.stringContaining('/products/101-'));
    });
  });
});

