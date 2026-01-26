// app/products/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { productsApiSafe } from '@/lib/api-client';

interface Props {
  params: { slug: string };
}

function getProductIdFromSlug(slug: string): number | null {
  const idPart = slug.split('-')[0];
  const parsed = parseInt(idPart, 10);
  return isNaN(parsed) ? null : parsed;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const productId = getProductIdFromSlug(params.slug);
  
  if (!productId) {
    return {
      title: 'Produto não encontrado | Avalia Solar',
    };
  }

  try {
    const product = await productsApiSafe.getById(productId);

    if (!product) {
      return {
        title: 'Produto não encontrado | Avalia Solar',
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avaliasolar.com.br';
    const canonicalUrl = `${siteUrl}/products/${params.slug}`;

    return {
      title: `${product.name} | Avalia Solar`,
      description: `${product.description || ''} - Categoria: ${product.category?.name || 'N/A'}. Oferecido por: ${product.company?.name || 'Avalia Solar'}`,
      openGraph: {
        title: `${product.name} - Produto de Energia Solar`,
        description: `${product.description || ''} - Categoria: ${product.category?.name || 'N/A'}. Oferecido por: ${product.company?.name || 'Avalia Solar'}`,
        url: canonicalUrl,
        type: 'website',
        // Add images if product has them, for now using a default or company logo if available
        images: product.company?.logo_url ? [{ url: product.company.logo_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Avalia Solar`,
        description: product.description || '',
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error('Erro no generateMetadata de produtos:', error);
    return {
      title: 'Produto não encontrado | Avalia Solar',
    };
  }
}

// Force dynamic if needed, or revalidate
export const revalidate = 3600; // 1 hour

export default async function ProductDetailPage({ params }: Props) {
  const productId = getProductIdFromSlug(params.slug);

  if (!productId) {
    notFound();
  }

  const product = await productsApiSafe.getById(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
