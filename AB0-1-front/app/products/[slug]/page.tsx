import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type {
  CampaignReviewProject,
  Category,
  Company,
  Product,
  ProductReviewsResponse,
} from '@/lib/api';
import {
  campaignReviewsApiSafe,
  categoriesApiSafe,
  companiesApiSafe,
  productsApiSafe,
} from '@/lib/api-client';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: { slug: string };
}

function getProductIdFromSlug(slug: string): number | null {
  const idPart = slug.split('-')[0];
  const parsed = parseInt(idPart, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function getProductPageData(productId: number): Promise<{
  product: Product;
  company: Company | null;
  category: Category | null;
  reviewsData: ProductReviewsResponse | null;
  projects: CampaignReviewProject[];
  relatedProducts: Product[];
} | null> {
  const product = await productsApiSafe.getById(productId);
  if (!product) return null;

  const companyId = product.company_id ?? product.company?.id;
  const categoryId = product.categories?.[0]?.id ?? product.category?.id ?? product.category_id;

  const [company, category, reviewsData, projects, companyProducts] = await Promise.all([
    companyId ? companiesApiSafe.getById(companyId) : Promise.resolve(null),
    categoryId ? categoriesApiSafe.getById(categoryId) : Promise.resolve(null),
    productsApiSafe.getReviews(productId, {
      limit: 6,
      ...(categoryId ? { category_id: categoryId } : {}),
    }),
    campaignReviewsApiSafe.getAll({ product_id: productId, limit: 6 }),
    companyId ? productsApiSafe.getByCompany(companyId) : Promise.resolve([]),
  ]);

  const relatedProducts = companyProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  return {
    product,
    company,
    category,
    reviewsData,
    projects,
    relatedProducts,
  };
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
      description: `${product.description || ''} - Categoria: ${product.category?.name || product.categories?.[0]?.name || 'N/A'}. Oferecido por: ${product.company?.name || 'Avalia Solar'}`,
      openGraph: {
        title: `${product.name} - Produto de Energia Solar`,
        description: `${product.description || ''} - Categoria: ${product.category?.name || product.categories?.[0]?.name || 'N/A'}. Oferecido por: ${product.company?.name || 'Avalia Solar'}`,
        url: canonicalUrl,
        type: 'website',
        images: product.image_url ? [{ url: product.image_url }] : [],
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

export const revalidate = 3600;

export default async function ProductDetailPage({ params }: Props) {
  const productId = getProductIdFromSlug(params.slug);

  if (!productId) {
    notFound();
  }

  const pageData = await getProductPageData(productId);

  if (!pageData) {
    notFound();
  }

  return <ProductDetailClient {...pageData} />;
}
