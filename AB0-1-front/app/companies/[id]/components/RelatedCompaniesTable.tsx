'use client';

import { useState } from 'react';
import { Company } from '@/lib/api';
import Link from 'next/link';
import {
  BadgeCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Globe,
  Clock,
  Building2,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CompanyLogo } from '@/components/CompanyLogo';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hasPaidPlan } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
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

export default function RelatedCompaniesTable({ companies }: RelatedCompaniesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const totalCompanies = companies.length;
  const totalPages = Math.ceil(totalCompanies / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedCompanies = companies.slice(startIndex, startIndex + perPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const element = document.getElementById('related-companies-table-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePerPageChange = (val: string) => {
    setPerPage(Number(val));
    setCurrentPage(1);
  };

  const renderPaginationRange = () => {
    const range: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= maxVisible; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        range.push(1);
        range.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      }
    }
    return range;
  };

  if (totalCompanies === 0) {
    return null;
  }

  return (
    <section id="related-companies-table-section" className="space-y-6 pt-8 border-t border-slate-100 mt-8">
      {/* Title & Page Selector bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Empresas Relacionadas
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Lista completa de empresas do mesmo segmento
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Exibir:</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-800 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden min-w-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.02)] lg:block">
        <table className="w-full table-fixed border-collapse text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th scope="col" className="w-10 px-3 py-4 text-center">#</th>
              <th scope="col" className="w-[34%] px-4 py-4">Empresa</th>
              <th scope="col" className="w-[20%] px-3 py-4">Localização</th>
              <th scope="col" className="w-[18%] px-3 py-4">Avaliação</th>
              <th scope="col" className="w-[14%] px-3 py-4 font-bold text-emerald-700">Verificado</th>
              <th scope="col" className="w-[180px] px-3 py-4 text-right">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedCompanies.map((comp, index) => {
              const globalIndex = startIndex + index + 1;
              const rating = Number(comp.rating_avg || comp.rating || comp.average_rating || 0);
              const ratingLabel = rating > 0 ? rating.toFixed(1) : '5.0';
              const reviewCount = comp.rating_count || comp.reviews_count || comp.total_reviews || 0;
              const location = [comp.city, comp.state].filter(Boolean).join(', ');
              const href = comp.slug ? `/companies/${comp.slug}` : `/companies/${comp.id}`;
              const isVerified = Boolean(comp.verified || (comp as any).trust?.verification_status === 'verified');

              return (
                <tr key={comp.id} className="group/row transition-colors duration-200 hover:bg-blue-50/10">
                  <td className="py-4 px-4 text-center font-bold text-slate-400">{globalIndex}</td>
                  
                  {/* Logo + Name */}
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={href} className="shrink-0">
                        <CompanyLogo
                          logoUrl={comp.logo_url}
                          name={comp.name}
                          size="sm"
                          badges={comp.badges}
                          verifiedBadgeUrl={comp.verified_badge_image_url || comp.verified_badge_url}
                          className="border border-slate-200/80 bg-white"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-col items-start gap-0.5">
                        <Link
                          href={href}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {comp.name}
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-3 py-4 text-xs text-slate-500">
                    <span className="truncate block max-w-full">{location || 'Brasil'}</span>
                  </td>

                  {/* Rating */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900">{ratingLabel}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] text-slate-400">({reviewCount})</span>
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-4 px-4">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <BadgeCheck className="w-4 h-4 fill-emerald-600 text-white shrink-0" />
                        Verificada
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Padrão</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="w-[180px] px-3 py-4 text-right">
                    <RelatedCompanyActions company={comp} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {paginatedCompanies.map((comp, index) => (
          <RelatedCompanyCard
            key={comp.id}
            company={comp}
            position={startIndex + index + 1}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav aria-label="Navegação da listagem" className="flex items-center justify-center gap-1 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {renderPaginationRange().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-xs font-bold select-none">
                    ...
                  </span>
                );
              }
              const pageNum = p as number;
              return (
                <Button
                  key={`page-${pageNum}`}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-xs font-bold p-0 shadow-none transition-all',
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white hover:bg-blue-700 font-extrabold'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none bg-white"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}

function RelatedCompanyCard({ company, position }: { company: Company; position: number }) {
  const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '5.0';
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const location = [company.city, company.state].filter(Boolean).join(', ') || 'Brasil';
  const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
  const isVerified = Boolean(company.verified);

  return (
    <article className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex min-w-0 items-start gap-3">
        <Link href={href} className="shrink-0" aria-label={`Abrir perfil de ${company.name}`}>
          <CompanyLogo
            logoUrl={company.logo_url}
            name={company.name}
            size="sm"
            className="border border-slate-200"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href={href} className="block truncate text-sm font-bold tracking-[-0.01em] text-slate-955 hover:text-blue-700">
                {company.name}
              </Link>
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">#{position}</span>
              <span className="block truncate text-xs text-slate-500">{location}</span>
            </div>
            <ComparisonToggleButton
              company={company as any}
              variant="minimal"
              size="sm"
              className="h-8 w-8 min-h-8 min-w-8 shrink-0 p-0"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {ratingLabel} ({reviewCount})
            </span>
            <span className={cn('inline-flex items-center gap-1 font-semibold', isVerified ? 'text-emerald-600' : 'text-slate-500')}>
              {isVerified && <BadgeCheck className="h-4 w-4" />}
              {isVerified ? 'Verificada' : 'Padrão'}
            </span>
          </div>
        </div>
      </div>
      <RelatedCompanyActions company={company} mobile />
    </article>
  );
}

function RelatedCompanyActions({ company, mobile = false }: { company: Company; mobile?: boolean }) {
  const canRequestQuote = hasPaidPlan(company as any);

  return (
    <div className={cn('flex items-center justify-end gap-2.5', mobile ? 'mt-4 flex-col-reverse items-stretch' : '')}>
      {!mobile && (
        <ComparisonToggleButton
          company={company as any}
          variant="minimal"
          size="sm"
          className="h-10 w-10 min-h-10 min-w-10 shrink-0 rounded-full border border-slate-200 bg-white p-0 text-blue-600 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        />
      )}
      {canRequestQuote && (
        <QuoteCTA
          context="table"
          source="category-company-table"
          onRequest={() =>
            openLeadModal({
              preferredCompanyId: company.id,
              source: 'category-table',
              type: 'quick',
            })
          }
          className={cn('h-10 whitespace-nowrap rounded-xl px-4 shadow-[0_2px_8px_rgba(37,99,235,0.1)]', mobile && 'w-full')}
        />
      )}
    </div>
  );
}
