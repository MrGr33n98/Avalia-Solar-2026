'use client';

import { useState } from 'react';
import { Company } from '@/lib/api';
import Link from 'next/link';
import { BadgeCheck, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryCompaniesTableProps {
  companies: Company[];
}

export default function CategoryCompaniesTable({ companies }: CategoryCompaniesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(18);

  const totalCompanies = companies.length;
  const totalPages = Math.ceil(totalCompanies / perPage);

  const startIndex = (currentPage - 1) * perPage;
  const paginatedCompanies = companies.slice(startIndex, startIndex + perPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Rola suavemente até o início da tabela
      const element = document.getElementById('more-companies-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePerPageChange = (val: string) => {
    setPerPage(Number(val));
    setCurrentPage(1);
  };

  // Helper to build page window like [1, 2, 3, 4, 5, '...', 124]
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
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">
          Nenhuma empresa adicional encontrada
        </p>
        <p className="mt-2 text-xs font-medium text-slate-600">
          Tente ajustar seus critérios de busca ou filtros
        </p>
      </div>
    );
  }

  return (
    <section id="more-companies-section" className="space-y-6 pt-4">
      {/* Title & Page Selector bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Mais empresas ({totalCompanies})
          </h2>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Exibir:</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="18">18 por página</SelectItem>
              <SelectItem value="25">25 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 px-4 w-12 text-center">#</th>
              <th scope="col" className="py-3.5 px-4">Empresa</th>
              <th scope="col" className="py-3.5 px-4">Localização</th>
              <th scope="col" className="py-3.5 px-4 w-40">Avaliação</th>
              <th scope="col" className="py-3.5 px-4 w-32">Status</th>
              <th scope="col" className="py-3.5 px-4 w-28 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedCompanies.map((company, index) => {
              const globalIndex = startIndex + index + 1;
              const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
              const ratingLabel = rating > 0 ? rating.toFixed(1) : '5.0';
              const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
              const location = [company.city, company.state].filter(Boolean).join(', ');
              const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
              const isVerified = Boolean(company.verified || (company as any).trust?.verification_status === 'verified');

              return (
                <tr
                  key={company.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  {/* # Rank */}
                  <td className="py-4 px-4 text-center font-bold text-slate-400">
                    {globalIndex}
                  </td>

                  {/* Logo + Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Link href={href} className="shrink-0">
                        <CompanyLogo
                          logoUrl={company.logo_url}
                          name={company.name}
                          size="sm"
                          badges={company.badges}
                          verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
                          className="border border-slate-200/80 bg-white"
                        />
                      </Link>
                      <Link
                        href={href}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {company.name}
                      </Link>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-slate-500 text-xs">
                    {location || 'Brasil'}
                  </td>

                  {/* Rating star/label */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{ratingLabel}</span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < Math.floor(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 fill-slate-200"
                            )}
                          />
                        ))}
                      </div>
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
                      <span className="text-[11px] font-semibold text-slate-400">
                        Padrão
                      </span>
                    )}
                  </td>

                  {/* Button Link */}
                  <td className="py-4 px-4 text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-[11px] font-bold h-8 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none"
                    >
                      <Link href={href}>Ver perfil</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          aria-label="Navegação da listagem"
          className="flex items-center justify-center gap-1 mt-6"
        >
          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {/* Page numbers window */}
          <div className="flex items-center gap-1 mx-2">
            {renderPaginationRange().map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 text-xs font-bold select-none"
                  >
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
                    "w-9 h-9 rounded-xl text-xs font-bold p-0 shadow-none transition-all",
                    currentPage === pageNum
                      ? "bg-blue-600 text-white hover:bg-blue-700 font-extrabold"
                      : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}
