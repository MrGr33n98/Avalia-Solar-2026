'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Star,
} from 'lucide-react';
import type {
  CampaignReviewProject,
  Category,
  Company,
  Product,
  ProductReviewSummary,
  ProductReviewsResponse,
  Review,
} from '@/lib/api';
import { buildCategoryPath, buildCompanyPath, buildProductPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { cn } from '@/lib/utils';
import { normalizeReviewList } from '@/lib/reviews/normalizeReviewList';
import { useProductTracking } from './useProductTracking';
import PremiumBadge from '@/components/PremiumBadge';
import { ProductReviewModal } from './components/ProductReviewModal';
import ProjectsGallery from '@/app/companies/[id]/components/ProjectsGallery';
import {
  useCopyIntent,
  useHoverIntent,
  useIntersectionDwellTime,
} from '@/lib/analytics/hooks/useIntentTracking';

interface ProductDetailClientProps {
  product: Product;
  company: Company | null;
  category: Category | null;
  reviewsData: ProductReviewsResponse | null;
  projects: CampaignReviewProject[];
  relatedProducts: Product[];
}

type ProductTab = 'description' | 'specifications' | 'reviews' | 'projects';

const AMBER = '#f5a623';
const surfaceClass =
  'rounded-[var(--border-radius-lg)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]';

const labelClass = 'text-[13px] leading-[1.6] text-[var(--color-text-secondary)]';
const hintClass = 'text-[11px] leading-[1.6] text-[var(--color-text-tertiary)]';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getInitials(value?: string | null) {
  return (value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AS';
}

function normalizePrice(price: Product['price']) {
  if (typeof price === 'number') return price;
  const parsed = Number(price || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSpecValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value ?? '-');
}

function getCompanyAggregate(
  company: Company | null,
  categoryId?: number | null
): ProductReviewSummary | null {
  if (!company?.review_aggregates) return null;

  const fromCategory =
    company.review_aggregates.by_category?.find((entry) => entry.category_id === categoryId) || null;
  const fallback = fromCategory || company.review_aggregates.global;

  if (!fallback) return null;

  return {
    average_rating: fallback.average_rating,
    total_reviews: fallback.total_reviews,
    scores_distribution: fallback.scores_distribution || {},
    criteria_breakdown: fallback.criteria_breakdown || {},
  };
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = rating >= index + 1;
        const partial = !filled && rating > index && rating < index + 1;

        return (
          <span key={index} className="relative inline-flex" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0"
              style={{
                width: size,
                height: size,
                stroke: AMBER,
                fill: 'transparent',
                strokeWidth: 1.5,
              }}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? size : partial ? `${(rating - index) * 100}%` : 0 }}
            >
              <Star
                style={{
                  width: size,
                  height: size,
                  stroke: AMBER,
                  fill: AMBER,
                  strokeWidth: 1.5,
                }}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function SemanticBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
  className?: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[var(--color-background-success)] text-[var(--color-text-success)]'
      : tone === 'danger'
        ? 'bg-[var(--color-background-danger)] text-[var(--color-text-danger)]'
        : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-[10px] py-[3px] text-[11px] font-medium leading-none',
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

function AvatarBadge({
  name,
  logoUrl,
}: {
  name?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-background-info)] text-[13px] font-medium text-[var(--color-text-info)]">
      {logoUrl ? (
        <img src={logoUrl} alt={name || 'Usuário'} width={40} height={40} className="h-10 w-10 object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(surfaceClass, 'p-4')}>
      <div className="mb-4">
        <p className="text-[15px] font-medium leading-[1.4] text-[var(--color-text-primary)]">{title}</p>
      </div>
      {children}
    </section>
  );
}

function ReviewDistribution({
  summary,
}: {
  summary: ProductReviewSummary | null;
}) {
  const total = summary?.total_reviews || 0;

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((score) => {
        const count = Number(summary?.scores_distribution?.[String(score)] || 0);
        const width = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={score} className="grid grid-cols-[20px_1fr_28px] items-center gap-2">
            <span className="text-[11px] text-[var(--color-text-secondary)]">{score}</span>
            <div className="h-[5px] overflow-hidden rounded-full bg-[var(--color-background-tertiary)]">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: AMBER }} />
            </div>
            <span className="text-right text-[11px] text-[var(--color-text-tertiary)]">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reviewDate = formatDate(review.created_at);
  const reviewScores = (review.granular_scores || review.review_criterion_scores || []).slice(0, 4);
  const pros = normalizeReviewList(review.pros);
  const cons = normalizeReviewList(review.cons);

  return (
    <article className={cn(surfaceClass, 'p-4')}>
      <div className="flex items-start gap-3">
        <AvatarBadge name={review.user?.name} logoUrl={review.user?.avatar_url} />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {review.user?.name || 'Consumidor Premium'}
            </p>
            {review.verified ? <SemanticBadge tone="success">Avaliação verificada</SemanticBadge> : null}
            {review.featured ? <SemanticBadge>Destaque</SemanticBadge> : null}
          </div>
          <div className="flex items-center gap-2">
            <Stars rating={review.rating || 0} size={12} />
            {reviewDate ? <span className={hintClass}>{reviewDate}</span> : null}
          </div>
        </div>
      </div>

      {typeof review.headline === 'string' && review.headline.trim() ? (
        <p className="mt-4 text-[15px] font-medium leading-[1.5] text-[var(--color-text-primary)]">{review.headline}</p>
      ) : null}

      {typeof review.comment === 'string' && review.comment.trim() ? (
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-[1.7] text-[var(--color-text-secondary)]">
          {review.comment}
        </p>
      ) : null}

      {typeof review.project_context === 'string' && review.project_context.trim() ? (
        <p className="mt-3 text-[13px] leading-[1.7] text-[var(--color-text-secondary)]">{review.project_context}</p>
      ) : null}

      {(pros.length > 0 || cons.length > 0 || (typeof review.buyer_tip === 'string' && review.buyer_tip.trim())) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {pros.length > 0 ? (
            <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Pontos fortes</p>
              <ul className="mt-2 space-y-1 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">
                {pros.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {cons.length > 0 ? (
            <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Pontos de atenção</p>
              <ul className="mt-2 space-y-1 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">
                {cons.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {typeof review.buyer_tip === 'string' && review.buyer_tip.trim() ? (
            <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Dica do comprador</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">{review.buyer_tip}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {reviewScores.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {reviewScores.map((score, index) => (
            <span
              key={`${score.title}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-secondary)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)]"
            >
              <span>{score.title}</span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {Number(score.score || 0).toFixed(1)}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ProjectCard({ project }: { project: CampaignReviewProject }) {
  const companyName = project.company?.name || 'Integrador parceiro';
  const period = [formatDate(project.start_at), formatDate(project.end_at)].filter(Boolean).join(' - ');

  return (
    <article className={cn(surfaceClass, 'p-4')}>
      <div className="flex items-start gap-3">
        <AvatarBadge name={companyName} logoUrl={project.company?.logo_url} />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-medium leading-[1.5] text-[var(--color-text-primary)]">
              {project.title || 'Projeto registrado'}
            </p>
            {project.sponsored ? <SemanticBadge>Patrocinado</SemanticBadge> : null}
          </div>
          <p className={labelClass}>{companyName}</p>
          {period ? <p className={hintClass}>{period}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
          <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Código</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">{project.code || '-'}</p>
        </div>
        <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
          <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Meta</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">
            {project.goal ? formatNumber(project.goal) : '-'}
          </p>
        </div>
        <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
          <p className="text-[11px] font-medium text-[var(--color-text-primary)]">Resultado</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">
            {project.achieved ? formatNumber(project.achieved) : '-'}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ProductDetailClient({
  product,
  company,
  category,
  reviewsData,
  projects,
  relatedProducts,
}: ProductDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<ProductTab>(
    (searchParams.get('tab') as ProductTab) || 'description'
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const galleryImages = useMemo(() => {
    const allImages = [...(product.image_urls || []), product.image_url].filter(Boolean) as string[];
    return Array.from(new Set(allImages));
  }, [product.image_url, product.image_urls]);
  const [selectedImage, setSelectedImage] = useState<string | null>(galleryImages[0] || null);
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);

  const priceValue = normalizePrice(product.price);
  const priceAvailable = priceValue > 0;
  const companyPath = buildCompanyPath(
    company?.slug || product.company?.slug,
    company?.name || product.company?.name,
    company?.id || product.company?.id
  );
  const categoryPath = category ? buildCategoryPath(category.seo_url, category.id) : '/products';
  const categoryName = category?.name || product.categories?.[0]?.name || product.category?.name || 'Produtos';
  const categoryId = category?.id || product.categories?.[0]?.id || product.category?.id || product.category_id;
  const summary = reviewsData?.summary || getCompanyAggregate(company, categoryId);
  const criteriaEntries = Object.entries(summary?.criteria_breakdown || {}).slice(0, 6);

  const compatibilityCompanies = useMemo(() => {
    const items = new Map<string, { label: string; path?: string; verified: boolean }>();

    if (company?.name) {
      items.set(company.name.toLowerCase(), {
        label: company.name,
        path: companyPath,
        verified: !!company.verified,
      });
    }

    projects.forEach((project) => {
      const label = project.company?.name;
      if (!label) return;

      items.set(label.toLowerCase(), {
        label,
        path: project.company?.slug
          ? buildCompanyPath(project.company.slug, label, project.company.id)
          : undefined,
        verified: !!project.company?.verified,
      });
    });

    return Array.from(items.values()).slice(0, 6);
  }, [company?.name, company?.verified, companyPath, projects]);

  const distinctIntegrators = useMemo(() => {
    const names = new Set(
      projects
        .map((project) => project.company?.name)
        .filter((value): value is string => Boolean(value))
    );
    return names.size;
  }, [projects]);

  const {
    trackCTA,
    trackCompanyProfile,
    trackCompatibilityChip,
    trackRelatedProduct,
    trackReviewsVisible,
    trackTabChange,
  } = useProductTracking({
    product,
    company,
    categoryId,
    categoryName,
    reviewsData,
  });

  const companyIdToTrack = company?.id || product.company?.id || product.company_id || 'unknown';
  const { onCopy: onCopySku } = useCopyIntent(companyIdToTrack, 'product_sku');
  const { onCopy: onCopyTitle } = useCopyIntent(companyIdToTrack, 'product_title');
  const { onMouseEnter: onSpecsEnter, onMouseLeave: onSpecsLeave } = useHoverIntent(companyIdToTrack, 'product_specs', 5000);
  const reviewsDwellRef = useIntersectionDwellTime(companyIdToTrack, 'review_deep_read', 8000) as React.MutableRefObject<HTMLDivElement | null>;

  useEffect(() => {
    setSelectedImage(galleryImages[0] || null);
  }, [galleryImages]);

  useEffect(() => {
    if (activeTab !== 'reviews' || !reviewsSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackReviewsVisible();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(reviewsSectionRef.current);
    return () => observer.disconnect();
  }, [activeTab, trackReviewsVisible]);

  const handleTabChange = (tab: ProductTab) => {
    setActiveTab(tab);
    trackTabChange(tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleQuoteRequest = () => {
    trackCTA('request_quote');
    openQuoteWizard({
      preferredCompanyId: company?.id || product.company?.id,
      source: 'product_page_sidebar',
    });
  };

  const isActive = product.status === 'active';

  return (
    <div className="min-h-screen bg-[var(--color-background-tertiary)]">
      <div className="border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center px-5">
          <nav className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <Link href="/" className="transition-colors hover:text-[var(--color-text-primary)]">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/products" className="transition-colors hover:text-[var(--color-text-primary)]">
              Produtos
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={categoryPath} className="truncate transition-colors hover:text-[var(--color-text-primary)]">
              {categoryName}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate text-[var(--color-text-primary)]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Cover/Banner */}
      {(product.cover_url || product.banner_url || product.company?.banner_url) && (
        <div className="mx-auto max-w-[1335px] px-5 pt-4">
          <div className="relative w-full h-[230px] overflow-hidden rounded-xl border border-[var(--color-border-tertiary)] bg-slate-100">
            <Image
              src={product.cover_url || product.banner_url || product.company?.banner_url || ''}
              alt={`${product.name} cover`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-5 py-4 pb-24 lg:pb-4">
        <div className="mb-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para produtos
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className={cn(surfaceClass, 'p-4')}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[var(--border-radius-lg)] bg-[var(--color-background-secondary)]">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={selectedImage || '/images/product-placeholder.svg'}
                        alt={product.name}
                        fill
                        className="object-contain p-6"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        onError={() => setSelectedImage('/images/product-placeholder.svg')}
                        priority
                      />
                    </div>
                  </div>

                  {galleryImages.length > 1 ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {galleryImages.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setSelectedImage(image)}
                          className={cn(
                            'relative aspect-square overflow-hidden rounded-[var(--border-radius-md)] border-[0.5px] bg-[var(--color-background-secondary)]',
                            selectedImage === image
                              ? 'border-[1.5px] border-[#f5a623]'
                              : 'border-[var(--color-border-tertiary)]'
                          )}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <SemanticBadge tone={isActive ? 'success' : 'danger'}>
                      {isActive ? 'Disponível' : 'Inativo'}
                    </SemanticBadge>
                    {product.sku ? <span onCopy={onCopySku}><SemanticBadge>SKU {product.sku}</SemanticBadge></span> : null}
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map((cat) => (
                        <Link key={cat.id} href={buildCategoryPath(cat.seo_url || (cat as any).slug || '', cat.id)}>
                          <SemanticBadge className="hover:bg-[var(--color-border-secondary)] transition-colors cursor-pointer">
                            {cat.name}
                          </SemanticBadge>
                        </Link>
                      ))
                    ) : category ? (
                      <Link href={categoryPath}>
                        <SemanticBadge className="hover:bg-[var(--color-border-secondary)] transition-colors cursor-pointer">
                          {category.name}
                        </SemanticBadge>
                      </Link>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 
                      className="text-[20px] font-medium leading-[1.35] text-[var(--color-text-primary)]"
                      onCopy={onCopyTitle}
                    >
                      {product.name}
                    </h1>
                    {product.short_description ? <p className={labelClass}>{product.short_description}</p> : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
                      <p className={hintClass}>Preço base</p>
                      <p className="mt-2 text-[20px] font-medium leading-none text-[#f5a623]">
                        {priceAvailable ? formatCurrency(priceValue) : 'Consultar preço'}
                      </p>
                    </div>
                    <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
                      <p className={hintClass}>Fabricante</p>
                      <p className="mt-2 text-[15px] font-medium leading-[1.4] text-[var(--color-text-primary)]">
                        {company?.name || product.company?.name || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {summary ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-secondary)] px-3 py-2">
                        <span className="text-[15px] font-medium text-[#f5a623]">
                          {summary.average_rating.toFixed(1)}
                        </span>
                        <Stars rating={summary.average_rating} />
                      </div>
                      <span className={labelClass}>
                        {formatNumber(summary.total_reviews)} avaliações verificadas
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className={cn(surfaceClass, 'p-4')}>
              <div className="flex flex-wrap gap-2 border-b-[0.5px] border-[var(--color-border-tertiary)] pb-3">
                {[
                  { id: 'description', label: 'Descrição' },
                  { id: 'specifications', label: 'Especificações' },
                  { id: 'projects', label: 'Projetos' },
                ].map((tab) => {
                  const isSelected = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id as ProductTab)}
                      className={cn(
                        'border-b-2 px-1 py-2 text-[13px] font-medium transition-colors',
                        isSelected
                          ? 'border-[#f5a623] text-[var(--color-text-primary)]'
                          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                {activeTab === 'description' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="whitespace-pre-wrap text-[13px] leading-[1.8] text-[var(--color-text-secondary)]">
                          {product.description || 'Sem descrição disponível no momento.'}
                        </p>

                        <div className="space-y-3">
                          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Compatibilidade</p>
                          {compatibilityCompanies.length ? (
                            <div className="flex flex-wrap gap-2">
                              {compatibilityCompanies.map((chip) => {
                                const chipClass = chip.verified
                                  ? 'bg-[var(--color-background-success)] text-[var(--color-text-success)]'
                                  : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]';

                                if (chip.path) {
                                  return (
                                    <Link
                                      key={chip.label}
                                      href={chip.path}
                                      onClick={() => trackCompatibilityChip(chip.label, chip.verified)}
                                      className={cn(
                                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] transition-opacity hover:opacity-85',
                                        chipClass
                                      )}
                                    >
                                      {chip.verified ? <Check className="h-3.5 w-3.5" /> : null}
                                      {chip.label}
                                    </Link>
                                  );
                                }

                                return (
                                  <button
                                    key={chip.label}
                                    type="button"
                                    onClick={() => trackCompatibilityChip(chip.label, chip.verified)}
                                    className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]', chipClass)}
                                  >
                                    {chip.verified ? <Check className="h-3.5 w-3.5" /> : null}
                                    {chip.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={labelClass}>Ainda não há compatibilidades confirmadas para este produto.</p>
                          )}
                        </div>
                      </div>

                    <div 
                      ref={(node) => {
                        reviewsSectionRef.current = node;
                        if (reviewsDwellRef) reviewsDwellRef.current = node;
                      }} 
                      className="space-y-4 pt-8 border-t border-[var(--color-border-tertiary)]"
                    >
                      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <div className={cn(surfaceClass, 'p-4')}>
                          <div className="space-y-3">
                          <div className="flex justify-between items-start">
                              <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Resumo das avaliações</p>
                              <button
                                type="button"
                                onClick={() => setIsReviewModalOpen(true)}
                                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Avaliar produto
                              </button>
                            </div>
                            <div className="flex items-end gap-3">
                              <span className="text-[28px] font-medium leading-none text-[#f5a623]">
                                {(summary?.average_rating || 0).toFixed(1)}
                              </span>
                              <div className="space-y-1">
                                <Stars rating={summary?.average_rating || 0} size={14} />
                                <p className={hintClass}>{formatNumber(summary?.total_reviews || 0)} avaliações</p>
                              </div>
                            </div>
                            <ReviewDistribution summary={summary} />
                          </div>
                        </div>

                        <div className={cn(surfaceClass, 'p-4')}>
                          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Critérios avaliados</p>
                          {criteriaEntries.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {criteriaEntries.map(([criterion, value]) => (
                                <span
                                  key={criterion}
                                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-secondary)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)]"
                                >
                                  <span>{criterion}</span>
                                  <span className="font-medium text-[var(--color-text-primary)]">
                                    {Number(value).toFixed(1)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className={cn(labelClass, 'mt-3')}>Os critérios detalhados ainda não foram consolidados.</p>
                          )}
                        </div>
                      </div>

                      {reviewsData?.reviews?.length ? (
                        <div className="space-y-4">
                          {reviewsData.reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                          ))}
                        </div>
                      ) : (
                        <div className={cn(surfaceClass, 'p-6')}>
                          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                            Seja o primeiro a avaliar este produto
                          </p>
                          <p className={cn(labelClass, 'mt-2')}>
                            Ainda não existem avaliações públicas vinculadas a este item.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={companyPath}
                              onClick={trackCompanyProfile}
                              className="inline-flex items-center gap-2 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-secondary)] px-4 py-[11px] text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-secondary)]"
                            >
                              Ver perfil da empresa
                            </Link>
                            <button
                              type="button"
                              onClick={() => setIsReviewModalOpen(true)}
                              className="inline-flex items-center gap-2 rounded-[var(--border-radius-md)] bg-blue-600 px-4 py-[11px] text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
                            >
                              Avaliar este produto
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTab === 'projects' ? (
                  <div className="space-y-6">
                    {projects.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                          Projetos com este produto
                        </p>
                        {projects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    )}

                    {company ? (
                      <div className={cn(surfaceClass, 'p-6')}>
                        <ProjectsGallery companyId={company.id} companyName={company.name} />
                      </div>
                    ) : !projects.length ? (
                      <div className={cn(surfaceClass, 'p-6')}>
                        <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                          Nenhum projeto registrado ainda
                        </p>
                        <p className={cn(labelClass, 'mt-2')}>
                          Assim que integradores registrarem campanhas ou projetos com este produto, eles aparecerão aqui.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            {relatedProducts.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Produtos relacionados</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    Ver todos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {relatedProducts.map((item, index) => {
                    const itemPath = buildProductPath(item.id, item.name);
                    const itemPrice = normalizePrice(item.price);
                    const itemPriceAvailable = itemPrice > 0;
                    const itemImage = item.image_url || item.image_urls?.[0] || null;

                    return (
                      <div
                        key={item.id}
                        className={cn(surfaceClass, 'overflow-hidden transition-colors hover:border-[var(--color-border-secondary)] flex flex-col')}
                      >
                        <Link 
                          href={itemPath}
                          onClick={() => trackRelatedProduct(item.id, index)}
                          className="relative aspect-[4/3] bg-[var(--color-background-secondary)] block"
                        >
                          {itemImage ? (
                            <Image
                              src={itemImage}
                              alt={item.name}
                              fill
                              className="object-contain p-5"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[var(--color-text-tertiary)]">
                              Imagem indisponível
                            </div>
                          )}
                        </Link>
                        <div className="space-y-3 p-4 flex-1 flex flex-col">
                          <div className="space-y-2 flex-1">
                            <Link href={itemPath} onClick={() => trackRelatedProduct(item.id, index)} className="block group">
                              <p className="text-[15px] font-medium leading-[1.5] text-[var(--color-text-primary)] group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </p>
                            </Link>
                            <Link 
                              href={item.categories?.[0] ? buildCategoryPath(item.categories[0].seo_url || (item.categories[0] as any).slug || '', item.categories[0].id) : categoryPath}
                              className={cn(labelClass, "hover:text-blue-600 transition-colors inline-block")}
                            >
                              {item.categories?.[0]?.name || item.category?.name || categoryName}
                            </Link>
                          </div>
                          <p className="text-[15px] font-medium text-[#f5a623]">
                            {itemPriceAvailable ? formatCurrency(itemPrice) : 'Consultar preço'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SidebarCard title="Preço e disponibilidade">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[28px] font-medium leading-none text-[#f5a623]">
                    {priceAvailable ? formatCurrency(priceValue) : 'Consultar preço'}
                  </p>
                  <p className={labelClass}>
                    {isActive ? 'Produto ativo para orçamento e comparação.' : 'Produto indisponível no momento.'}
                  </p>
                </div>

                {distinctIntegrators > 0 ? (
                  <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
                    <p className="text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">
                      {formatNumber(distinctIntegrators)} integradores já usaram este produto em projetos registrados.
                    </p>
                  </div>
                ) : null}

                <QuoteCTA context="card" source="product-detail" onRequest={handleQuoteRequest} />

                <p className={hintClass}>O contato é iniciado no fluxo de lead do marketplace.</p>
              </div>
            </SidebarCard>

            <SidebarCard title="Fabricante">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AvatarBadge name={company?.name || product.company?.name} logoUrl={company?.logo_url} />
                  <div className="min-w-0 space-y-2">
                    <p className="text-[14px] font-medium leading-[1.5] text-[var(--color-text-primary)]">
                      {company?.name || product.company?.name || 'Fabricante não informado'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {company?.verified ? (
                        <PremiumBadge />
                      ) : null}
                      {company?.plan_status === 'active' ? <SemanticBadge>Parceiro premium</SemanticBadge> : null}
                      {(company?.badges || product.company?.badges)?.map((badge, idx) => (
                        <span
                          key={badge.id || idx}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60"
                        >
                          {badge.image_url ? (
                            <img src={badge.image_url} alt={badge.name} className="h-3.5 w-3.5 object-contain" />
                          ) : null}
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
                    <p className={hintClass}>Avaliação</p>
                    <p className="mt-2 text-[15px] font-medium text-[var(--color-text-primary)]">
                      {company?.rating_avg ? Number(company.rating_avg).toFixed(1) : '-'}
                    </p>
                  </div>
                  <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] p-3">
                    <p className={hintClass}>Projetos</p>
                    <p className="mt-2 text-[15px] font-medium text-[var(--color-text-primary)]">
                      {projects.length ? formatNumber(projects.length) : formatNumber(company?.reviews_count || 0)}
                    </p>
                  </div>
                </div>

                {company?.description ? (
                  <p className={labelClass}>
                    {company.description.length > 180
                      ? `${company.description.slice(0, 177)}...`
                      : company.description}
                  </p>
                ) : null}

                <Link
                  href={companyPath}
                  onClick={trackCompanyProfile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-secondary)] px-4 py-[11px] text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-secondary)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver perfil da empresa
                </Link>
              </div>
            </SidebarCard>

            <SidebarCard title="Avaliações">
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <span className="text-[28px] font-medium leading-none text-[#f5a623]">
                    {(summary?.average_rating || 0).toFixed(1)}
                  </span>
                  <div className="space-y-1">
                    <Stars rating={summary?.average_rating || 0} />
                    <p className={hintClass}>{formatNumber(summary?.total_reviews || 0)} avaliações</p>
                  </div>
                </div>

                <ReviewDistribution summary={summary} />

                {criteriaEntries.length ? (
                  <div className="flex flex-wrap gap-2">
                    {criteriaEntries.slice(0, 4).map(([criterion, value]) => (
                      <span
                        key={criterion}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-secondary)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)]"
                      >
                        <span>{criterion}</span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {Number(value).toFixed(1)}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] p-4 lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[var(--color-text-secondary)]">{product.name}</p>
            <p className="text-[15px] font-medium text-[#f5a623]">
              {priceAvailable ? formatCurrency(priceValue) : 'Consultar preço'}
            </p>
          </div>
          <QuoteCTA context="sticky" source="product-detail-sticky" onRequest={handleQuoteRequest} />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: galleryImages,
            sku: product.sku,
            brand: {
              '@type': 'Brand',
              name: company?.name || product.company?.name,
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              ...(priceAvailable ? { price: priceValue } : {}),
              availability: isActive
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: company?.name || product.company?.name,
              },
            },
            aggregateRating: summary
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: summary.average_rating,
                  reviewCount: summary.total_reviews,
                }
              : undefined,
            additionalProperty: (product.specs || []).map((spec) => ({
              '@type': 'PropertyValue',
              name: spec.label,
              value: normalizeSpecValue(spec.value),
              unitCode: spec.unit,
            })),
          }),
        }}
      />

      <ProductReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        product={product}
        categoryId={categoryId}
        companyId={company?.id || product.company?.id || product.company_id}
      />
    </div>
  );
}
