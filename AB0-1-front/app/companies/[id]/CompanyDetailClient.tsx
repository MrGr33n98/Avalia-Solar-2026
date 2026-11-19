'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Company, Product, Review } from '@/lib/api';
import { canShowCompanyQuoteCTA } from '@/lib/company-cta-visibility';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyProfileTabs } from './components/companyProfileTabsConfig';
import CompanyProfileShell from './components/CompanyProfileShell';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackCompanyProfileViewed, trackDashboardViewed } from '@/lib/analytics/consolidated';
import { track } from '@/lib/analytics/lazy';
import { useScrollPause, sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { canShowMediaGallery } from '@/lib/feature-access';

interface CompanyDetailClientProps {
  company: Company;
  initialReviews?: Review[];
  initialReviewsLoaded?: boolean;
}

const finite = (value: unknown): number => {
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(number) ? number : 0;
};

const safeRating = (value: unknown) => Math.min(5, Math.max(0, finite(value)));
const safeCount = (value: unknown) => Math.max(0, Math.floor(finite(value)));

function resolveMediaUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const origin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    .replace(/\/api.*$/, '').replace(/\/$/, '');
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
}

/**
 * The premium shell is the only active rendering path. The previous always-false
 * legacy branch kept its dashboard imports in the initial client graph even when
 * its JSX was unreachable, so it has been removed without changing the premium
 * tabs, paid CTAs, authorization checks or tracking contract.
 */
export default function CompanyDetailClient({
  company,
  initialReviews = [],
  initialReviewsLoaded = false,
}: CompanyDetailClientProps): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [productsLoading, setProductsLoading] = useState(true);
  const reviewsLoaded = initialReviewsLoaded || initialReviews.length > 0;
  const [reviewsLoading, setReviewsLoading] = useState(!reviewsLoaded);
  const [activeTab, setActiveTab] = useState('overview');
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const companyId = Number(company.id);
  const canEdit = isAuthenticated && user?.role === 'company' && user.company_id === companyId;
  const canViewAnalytics = isAuthenticated && (
    user?.role === 'admin' ||
    user?.role === 'review' ||
    (user?.role === 'company' && user.company_id === companyId && company.status === 'active')
  );
  const canRequestQuote = canShowCompanyQuoteCTA(company);
  const showFaq = true;
  const showGallery = canShowMediaGallery(company);
  const showFinancing = Boolean(
    company.public_financing_visible === true ||
    (company.financing_tab_visible === true &&
      (company.financing_enabled === true || company.segment === 'finance'))
  );
  const tabs = useMemo(
    () => getCompanyProfileTabs({ showFinancing, showGallery, showFaq, canEdit }),
    [showFinancing, showGallery, showFaq, canEdit]
  );

  const trackingOptions = useMemo(
    () => ({
      type: 'company' as const,
      title: `${company.name} - Empresa de Energia Solar`,
      additionalData: {
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          category: company.category_name,
          city: company.city,
          state: company.state,
          rating: company.rating,
          verified: company.verified,
        },
      },
    }),
    [company]
  );
  usePageTracking(trackingOptions);

  useEffect(() => {
    if (companyId && company.name) {
      trackCompanyProfileViewed(companyId, company.name, company.plan_tier ?? undefined);
    }
  }, [companyId, company.name, company.plan_tier]);

  const scrollPauseMetadata = useMemo(
    () => ({ source: 'company_profile', active_tab: activeTab }),
    [activeTab]
  );
  useScrollPause(String(companyId || company.id), 3000, {
    signalCategory: 'research_intent',
    elementSelector: 'company-detail-page',
    metadata: scrollPauseMetadata,
  });

  // Products and reviews have isolated error/loading lifecycles. One failing
  // endpoint no longer prevents the other from rendering its content.
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void import('@/lib/api-client')
      .then(({ productsApiSafe }) => productsApiSafe.getByCompany(companyId))
      .then((value) => { if (!cancelled) setProducts(value || []); })
      .catch((error: unknown) => {
        if (!cancelled) console.error('Produtos indisponíveis no perfil:', error);
      })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, [companyId]);

  useEffect(() => {
    if (reviewsLoaded || !companyId) return;
    let cancelled = false;
    void import('@/lib/api-client')
      .then(({ reviewsApiSafe }) => reviewsApiSafe.getAll({ company_id: companyId, limit: 6 }))
      .then((value) => { if (!cancelled) setReviews(value || []); })
      .catch((error: unknown) => {
        if (!cancelled) console.error('Avaliações indisponíveis no perfil:', error);
      })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [companyId, reviewsLoaded]);

  // Protected analytics remain authorized and separate from public requests.
  // Dynamic import prevents their JS modules from joining the public hero chunk.
  useEffect(() => {
    if (!companyId || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'false' || !canViewAnalytics) return;
    let cancelled = false;
    void (async () => {
      try {
        const { default: analyticsApi } = await import('@/lib/api-analytics');
        if (cancelled || !(await analyticsApi.validateRoutes(companyId))) return;
        await Promise.all([
          analyticsApi.getReviewAnalytics(companyId),
          analyticsApi.getTrafficSources(companyId),
          analyticsApi.getHistoricalData(companyId, 30),
        ]);
      } catch (error) {
        if (!cancelled) console.error('Analytics secundário indisponível:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, canViewAnalytics]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) setActiveTab('overview');
  }, [tabs, activeTab]);

  const companyStats = useMemo(() => {
    const aggregate = company.review_aggregates?.global;
    const canonicalRating = safeRating(
      company.rating_avg ?? aggregate?.average_rating ?? company.average_rating ?? company.rating
    );
    const canonicalCount = safeCount(
      company.rating_count ?? aggregate?.total_reviews ?? company.reviews_count ?? company.total_reviews
    );
    const reviewCount = Math.max(canonicalCount, reviews.length);
    const reviewedRating = reviews.length
      ? reviews.reduce((total, review) => total + safeRating(review.rating), 0) / reviews.length
      : 0;
    const rating = reviews.length && (canonicalCount === 0 || Math.abs(reviewedRating - canonicalRating) > 0.05)
      ? reviewedRating
      : canonicalRating;
    const createdYear = company.created_at
      ? new Date(company.created_at).getFullYear()
      : new Date().getFullYear();
    return {
      rating: rating.toFixed(1),
      reviewCount,
      productCount: products.length,
      yearsInBusiness: Math.max(0, new Date().getFullYear() - createdYear),
    };
  }, [company, products.length, reviews]);

  const bannerUrl = useMemo(() => resolveMediaUrl(company.banner_url), [company.banner_url]);
  const logoUrl = useMemo(() => resolveMediaUrl(company.logo_url), [company.logo_url]);

  function handleTabChange(value: string) {
    const tab = tabs.find((entry) => entry.id === value);
    trackDashboardViewed(companyId, value);
    track('company_tab_change', {
      company_id: companyId,
      company_name: company.name,
      tab_id: value,
      tab_label: tab?.label || value,
    });
    if (value === 'reviews') {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'review_section_view',
        signal_category: 'research_intent',
        metadata: { tab_label: tab?.label },
      });
    } else if (value === 'projects' || value === 'portfolio') {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'portfolio_view',
        signal_category: 'research_intent',
        metadata: { tab_label: tab?.label },
      });
    } else if (value === 'materials' || value === 'downloads') {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'datasheet_section_view',
        signal_category: 'research_intent',
        metadata: { tab_label: tab?.label },
      });
    }
    setActiveTab(value);
  }

  return (
    <CompanyProfileShell
      company={company}
      companyStats={companyStats}
      products={products}
      reviews={reviews}
      productsLoading={productsLoading}
      reviewsLoading={reviewsLoading}
      bannerUrl={bannerUrl}
      bannerError={bannerError}
      setBannerError={setBannerError}
      logoUrl={logoUrl}
      logoError={logoError}
      setLogoError={setLogoError}
      canRequestQuote={canRequestQuote}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showFinancing={showFinancing}
      showGallery={showGallery}
      showFaq={showFaq}
    />
  );
}
