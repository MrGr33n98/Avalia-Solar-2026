'use client';

import Link from 'next/link';
import {
  DEFAULT_SEARCH_PAGE_SIZE,
  getPaginationItems,
  SEARCH_PAGE_SIZES,
} from './searchPagination';

interface EnterpriseSearchPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  hrefForPage: (page: number) => string;
  onPageSizeChange: (size: number) => void;
}

export function EnterpriseSearchPagination({
  page,
  totalPages,
  totalCount,
  perPage,
  hrefForPage,
  onPageSizeChange,
}: EnterpriseSearchPaginationProps) {
  const total = Math.max(0, totalCount);
  const current = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const size = perPage > 0 ? perPage : DEFAULT_SEARCH_PAGE_SIZE;
  const start = total ? (current - 1) * size + 1 : 0;
  const end = total ? Math.min(current * size, total) : 0;
  const items = getPaginationItems(current, totalPages);
  const base = 'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]';
  const neutral = base + ' border-[#dde1e6] bg-white text-[#09172f] hover:border-[#0f62fe] hover:bg-[#edf5ff]';
  const disabled = base + ' cursor-not-allowed border-[#e5e9ee] bg-[#f8fafc] text-[#94a3b8]';

  return (
    <section aria-label="Paginação de empresas" className="mt-6 rounded-xl border border-[#dde1e6] bg-white px-3 py-4 shadow-[0_6px_20px_rgba(9,23,47,0.035)] sm:px-5">
      <div className="flex flex-col items-center justify-between gap-4 xl:flex-row">
        <p className="text-center text-xs font-medium text-[#475569] sm:text-left" aria-live="polite">
          {total > 0 ? (
            <>Mostrando <strong className="text-[#09172f]">{start}–{end}</strong> de <strong className="text-[#09172f]">{total}</strong> empresas</>
          ) : (
            'Nenhuma empresa encontrada'
          )}
        </p>
        {totalPages > 1 && (
          <nav aria-label="Páginas de empresas" className="flex items-center gap-1.5">
            {current > 1 ? (
              <Link scroll={false} href={hrefForPage(current - 1)} aria-label="Página anterior" className={neutral + ' px-3'}>
                <span aria-hidden="true" className="mr-1">‹</span><span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <span aria-disabled="true" className={disabled + ' px-3'}>
                <span aria-hidden="true" className="mr-1">‹</span><span className="hidden sm:inline">Anterior</span>
              </span>
            )}
            <span className="px-2 text-xs font-semibold tabular-nums text-[#09172f] sm:hidden">
              {current} de {totalPages}
            </span>
            <div className="hidden items-center gap-1.5 sm:flex">
              {items.map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={'gap-' + index} aria-hidden="true" className="inline-flex w-5 items-center justify-center text-[#66758a]">
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    scroll={false} href={hrefForPage(item)}
                    aria-label={'Página ' + item}
                    aria-current={item === current ? 'page' : undefined}
                    className={item === current
                      ? base + ' border-[#0f62fe] bg-[#0f62fe] text-white'
                      : neutral}
                  >
                    {item}
                  </Link>
                )
              )}
            </div>
            {current < totalPages ? (
              <Link scroll={false} href={hrefForPage(current + 1)} aria-label="Próxima página" className={neutral + ' px-3'}>
                <span className="hidden sm:inline">Próxima</span><span aria-hidden="true" className="ml-1">›</span>
              </Link>
            ) : (
              <span aria-disabled="true" className={disabled + ' px-3'}>
                <span className="hidden sm:inline">Próxima</span><span aria-hidden="true" className="ml-1">›</span>
              </span>
            )}
          </nav>
        )}
        <label className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#475569]">
          Resultados por página
          <select
            aria-label="Resultados por página"
            value={size}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-10 rounded-md border border-[#cbd5e1] bg-white px-3 font-semibold text-[#09172f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f62fe]"
          >
            {SEARCH_PAGE_SIZES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
