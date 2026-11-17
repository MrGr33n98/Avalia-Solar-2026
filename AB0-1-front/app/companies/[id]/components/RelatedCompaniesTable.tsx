'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Company } from '@/lib/api';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { canUsePaidConversion } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RelatedCompaniesTableProps {
  companies: Company[];
}

const PAGE_SIZES = [5, 10, 20] as const;

export default function RelatedCompaniesTable({ companies }: RelatedCompaniesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const totalCompanies = companies.length;
  const totalPages = Math.ceil(totalCompanies / perPage);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safePage - 1) * perPage;
  const paginatedCompanies = companies.slice(startIndex, startIndex + perPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    document.getElementById('related-companies-table-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handlePerPageChange = (value: string) => {
    const next = Number(value);
    if (!PAGE_SIZES.some((size) => size === next)) return;
    setPerPage(next);
    setCurrentPage(1);
  };

  const renderPaginationRange = () => {
    const range: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) range.push(page);
    } else if (safePage <= 4) {
      range.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safePage >= totalPages - 3) {
      range.push(1, '...');
      for (let page = totalPages - 4; page <= totalPages; page += 1) range.push(page);
    } else {
      range.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return range;
  };

  if (totalCompanies === 0) return null;

  return (
    <section
      id="related-companies-table-section"
      aria-labelledby="related-companies-heading"
      data-testid="related-companies-section"
      className="min-w-0 scroll-mt-24"
    >
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="min-w-0">
          <h3
            id="related-companies-heading"
            className="text-[15px] font-semibold leading-5 tracking-tight text-slate-950 min-[390px]:text-lg min-[390px]:leading-6"
          >
            Empresas relacionadas
          </h3>
          <p className="mt-0.5 hidden text-xs leading-4 text-slate-600 min-[360px]:block">
            Empresas do mesmo segmento
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-600 sm:inline">Exibir</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger
              aria-label="Quantidade de empresas por página"
              className="h-11 !min-h-11 w-[98px] min-w-0 rounded-lg border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 shadow-none sm:w-[112px]"
            >
              <SelectValue>{perPage}/pág.</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mesma grade para PWA e desktop; não há duas versões de card/tabela divergentes. */}
      <div
        role="list"
        aria-label="Empresas do mesmo segmento"
        data-testid="related-companies-grid"
        className="mt-3 min-w-0 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        {paginatedCompanies.map((company) => (
          <RelatedCompanyRow
            key={company.id}
            company={company}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Navegação da listagem" className="mt-3 flex min-w-0 items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Página anterior"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage === 1}
            className="h-11 !min-h-11 w-11 !min-w-11 shrink-0 rounded-lg border-slate-200 p-0 shadow-none"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto px-1 scrollbar-none">
            {renderPaginationRange().map((item, index) =>
              item === '...' ? (
                <span key={`dots-${index}`} aria-hidden="true" className="flex h-11 min-w-5 items-center justify-center text-xs text-slate-500">
                  …
                </span>
              ) : (
                <Button
                  key={`page-${item}`}
                  type="button"
                  size="sm"
                  aria-label={`Página ${item}`}
                  aria-current={safePage === item ? 'page' : undefined}
                  onClick={() => handlePageChange(item as number)}
                  className={cn(
                    'h-11 !min-h-11 w-9 !min-w-9 shrink-0 rounded-lg p-0 text-xs font-semibold shadow-none',
                    safePage === item
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {item}
                </Button>
              )
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Próxima página"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="h-11 !min-h-11 w-11 !min-w-11 shrink-0 rounded-lg border-slate-200 p-0 shadow-none"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}

function RelatedCompanyRow({ company }: { company: Company }) {
  const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const location = [company.city, company.state].filter(Boolean).join(', ') || 'Brasil';
  const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
  const verified = Boolean(
    company.verified || (company as Company & { trust?: { verification_status?: string } }).trust?.verification_status === 'verified'
  );
  const canRequestQuote = canUsePaidConversion(company, 'quote');

  const requestQuote = () =>
    openLeadModal({
      preferredCompanyId: company.id,
      source: 'category-table',
      type: 'quick',
    });

  return (
    <article
      role="listitem"
      data-testid="related-company-row"
      data-company-id={company.id}
      className="grid min-h-[76px] min-w-0 grid-cols-[40px_minmax(0,1fr)_100px] items-center gap-x-2.5 px-2.5 py-2.5 transition-colors hover:bg-slate-50/80 min-[390px]:gap-x-3 min-[390px]:px-3 sm:min-h-[80px] sm:grid-cols-[44px_minmax(0,1fr)_minmax(110px,auto)] sm:px-4"
    >
      <Link href={href} aria-label={`Abrir perfil de ${company.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11">
        <CompanyLogo
          logoUrl={company.logo_url}
          name={company.name}
          size="sm"
          badges={company.badges}
          verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
          className="border border-slate-200 bg-white object-contain"
        />
      </Link>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-1.5">
          <Link
            href={href}
            className="min-w-0 text-[13px] font-semibold leading-[18px] text-blue-700 [overflow-wrap:anywhere] hover:underline sm:text-sm sm:leading-5"
          >
            {company.name}
          </Link>
          {verified && <CompanyVerifiedBadge size="sm" className="shrink-0" />}
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-[11px] leading-4 text-slate-600 sm:text-xs">
          <span className="[overflow-wrap:anywhere]">{location}</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          {reviewCount > 0 && rating > 0 ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Star aria-hidden="true" className="h-3 w-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)} ({reviewCount})
            </span>
          ) : (
            <span>Sem avaliações</span>
          )}
        </div>

        {canRequestQuote && (
          <QuoteCTA
            context="card"
            shortLabel="Orçamento"
            source="category-company-table"
            onRequest={requestQuote}
            className="mt-1.5 h-11 !min-h-11 rounded-lg px-2 text-[11px] lg:hidden"
          />
        )}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <ComparisonToggleButton
          company={company}
          variant="minimal"
          size="sm"
          className="shrink-0 !px-0.5 sm:!px-2"
        />
        {canRequestQuote && (
          <QuoteCTA
            context="card"
            shortLabel="Orçamento"
            source="category-company-table"
            onRequest={requestQuote}
            className="hidden h-11 !min-h-11 rounded-lg px-2 text-xs lg:inline-flex"
          />
        )}
      </div>
    </article>
  );
}
