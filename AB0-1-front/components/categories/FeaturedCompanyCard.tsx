'use client';

import { Company } from '@/lib/api';
import Link from 'next/link';
import { Star, Clock, FileText, Globe, BadgeCheck } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyIdentityLine } from '@/components/company/CompanyIdentityLine';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import CompanyViewCounter from '@/app/companies/[id]/components/CompanyViewCounter';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { cn } from '@/lib/utils';
import { hasPaidPlan } from '@/lib/feature-access';

interface FeaturedCompanyCardProps {
  company: Company;
  category: string;
  isFirst?: boolean;
}

export default function FeaturedCompanyCard({
  company,
  category,
  isFirst = false,
}: FeaturedCompanyCardProps) {
  const showFeaturedBadge = isFirst && company.has_paid_plan === true;
  const canRequestQuote = hasPaidPlan(company);
  const isVerified = Boolean(
    company.verified || (company as any).trust?.verification_status === 'verified'
  );
  const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const hasRating = rating > 0 && reviewCount > 0;
  const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;

  const location = [company.city, company.state].filter(Boolean).join(', ');

  // Extract tags from services or project types, defaulting dynamically to category name
  const rawCategoryTag = category ? category.replace(/-/g, ' ') : '';
  const fallbackCategoryTag = rawCategoryTag
    ? rawCategoryTag.charAt(0).toUpperCase() + rawCategoryTag.slice(1)
    : 'Energia Solar';

  const tags =
    Array.isArray(company.services_offered) && company.services_offered.length > 0
      ? company.services_offered.slice(0, 3)
      : Array.isArray(company.project_types) && company.project_types.length > 0
        ? company.project_types.slice(0, 3)
        : [fallbackCategoryTag];

  // SLA Label & Coverage Label (conditional, no fake hardcoding)
  const slaLabel =
    (company as any).operations?.sla_label || (company as any).response_time_sla || null;
  const coverageLabel =
    (company as any).coverage?.states?.length > 0 || (company as any).coverage?.cities?.length > 0
      ? 'Atendimento regional'
      : (company as any).nationwide
        ? 'Atende todo o Brasil'
        : null;

  return (
    <article
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 h-full',
        showFeaturedBadge && 'border-amber-200 bg-gradient-to-b from-amber-50/10 to-white'
      )}
    >
      {/* Compare Button */}
      <div className="absolute top-3 right-3 z-20">
        <ComparisonToggleButton company={company as any} variant="floating" size="sm" />
      </div>

      {/* O destaque comercial só pode ser exibido para empresas com plano pago. */}
      {showFeaturedBadge && (
        <div className="absolute left-0 top-0 overflow-hidden w-24 h-24 pointer-events-none z-10">
          <div className="absolute transform -rotate-45 bg-amber-500 text-white font-extrabold text-[9px] uppercase tracking-widest text-center py-1.5 w-[140px] -left-[35px] top-[22px] shadow-sm">
            Destaque
          </div>
        </div>
      )}

      <div>
        {/* Header: Logo + Name & Verification */}
        <div className="flex items-start gap-4 mb-4">
          <Link href={href} className="shrink-0">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={company.name}
              size="md"
              badges={company.badges}
              verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
              className="border border-slate-200 shadow-sm bg-white p-1 rounded-xl"
            />
          </Link>
          <div className="min-w-0 flex-1 pt-1 pr-8">
            <CompanyIdentityLine
              name={company.name}
              href={href}
              verified={isVerified}
              nameClassName="font-bold text-slate-900 leading-tight hover:text-blue-700 transition-colors text-sm sm:text-base"
            />
            {location && (
              <span className="text-[11px] font-medium text-slate-500 block mt-1">{location}</span>
            )}
          </div>
        </div>

        {/* Rating Row */}
        <div className="flex items-center gap-1 mb-3">
          {hasRating ? (
            <>
              <span className="text-sm font-bold text-slate-900">{rating.toFixed(1)}</span>
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3.5 h-3.5',
                      i < Math.floor(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium">({reviewCount})</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              Sem avaliações ainda
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Operations features with icons */}
        <div className="space-y-1.5 border-t border-slate-100 pt-3 mb-4">
          {slaLabel && (
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold">Responde em até {slaLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-semibold">Orçamento gratuito</span>
          </div>
          {coverageLabel && (
            <div className="flex items-center gap-2 text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold">{coverageLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto">
        {/* Primary CTA */}
        {canRequestQuote && (
          <QuoteCTA context="card" source="category-featured-card" className="mb-3" />
        )}

        {/* Secondary Link */}
        <div className="text-center mb-3">
          <Link
            href={href}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Ver perfil completo →
          </Link>
        </div>

        {/* Bottom views count */}
        <div className="flex justify-center border-t border-slate-100 pt-3">
          <CompanyViewCounter companyId={company.id} />
        </div>
      </div>
    </article>
  );
}
