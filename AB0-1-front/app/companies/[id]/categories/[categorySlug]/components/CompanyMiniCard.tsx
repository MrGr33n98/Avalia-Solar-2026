import Link from 'next/link';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { buildCompanyPath } from '@/lib/slug';
import type { CompanyMiniCardData } from '@/lib/api';

interface CompanyMiniCardProps {
  company: CompanyMiniCardData;
}

export function CompanyMiniCard({ company }: CompanyMiniCardProps) {
  const companyPath = buildCompanyPath(company.slug, company.name, company.id);

  return (
    <Link
      href={companyPath}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <CompanyLogo
        logoUrl={company.logo_url}
        name={company.name}
        size="md"
        className="h-12 w-12 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-bold text-slate-950 group-hover:text-blue-700">
            {company.name}
          </h3>
          {company.verified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {company.rating_avg ? (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {Number(company.rating_avg).toFixed(1)}
            </span>
          ) : null}
          {company.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {company.city}, {company.state}
            </span>
          )}
          {company.product_count ? (
            <span className="text-slate-500">
              {company.product_count} {company.product_count === 1 ? 'produto' : 'produtos'}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
