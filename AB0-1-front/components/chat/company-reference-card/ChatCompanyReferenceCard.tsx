'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/text-utils';
import type { ChatCompanyReferenceCardProps } from './ChatCompanyReferenceCard.types';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/*  Ícones inline mínimos (sem dependência de lucide-react no bundle)  */
/* ------------------------------------------------------------------ */

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-3 w-3 shrink-0', className)} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-[18px] w-[18px] shrink-0 fill-emerald-500', className)} viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-3.5 w-3.5 shrink-0', className)} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const MessageIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-3.5 w-3.5 shrink-0', className)} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
  </svg>
);

const DocIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-3.5 w-3.5 shrink-0', className)} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={cx('h-3.5 w-3.5 shrink-0 animate-spin', className)} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

const ChatCompanyReferenceCard: React.FC<ChatCompanyReferenceCardProps> = ({
  company,
  isSelectedForComparison = false,
  selectedPosition = null,
  maxComparison = 4,
  onCompare,
  onReviews,
  onBudget,
  isBudgetLoading = false,
  compareEnabled = true,
  showServices = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => setImgError(true), []);

  const logoUrl = company.logoUrl;
  const hasLogo = logoUrl && !imgError;
  const initials = getInitials(company.name);
  const rating = company.rating ?? null;
  const reviewCount = company.reviewsCount ?? company.ratingCount ?? 0;
  const hasRating = rating !== null && rating !== undefined;
  const location =
    [company.city, company.state].filter(Boolean).length > 0
      ? [company.city, company.state].filter(Boolean).join(', ')
      : null;

  const isFeatured = company.isFeatured || company.isSponsored;

  return (
    <div
      className={cx(
        'relative w-full min-w-0 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white',
        'shadow-[0_4px_12px_rgba(15,23,42,0.06)]',
        'border-l-[3px] border-l-[#2563EB]',
        'p-3',
        'dark:border-zinc-700 dark:bg-zinc-900 dark:border-l-[#2563EB]',
        'transition-colors duration-200',
      )}
    >
      {/* ================================================================ */}
      {/*  Linha 1: Logo + Nome + Selos                                     */}
      {/* ================================================================ */}
      <div className="flex items-start gap-2.5">
        {/* Logo */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          {hasLogo ? (
            <Image
              src={logoUrl}
              alt={company.name}
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
              onError={handleImgError}
            />
          ) : (
            <span className="text-sm font-bold uppercase text-zinc-400 dark:text-zinc-500">
              {initials}
            </span>
          )}
        </div>

        {/* Nome + Selos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4
              className="truncate text-sm font-bold leading-[1.2] text-[#111827] dark:text-zinc-100"
              title={company.name}
            >
              {company.name}
            </h4>

            {/* Selo Destaque */}
            {isFeatured && (
              <span className="inline-flex h-[18px] shrink-0 items-center rounded-[4px] bg-[#F97316] px-1.5 text-[9px] font-bold leading-none text-white tracking-wide">
                Destaque
              </span>
            )}

            {/* Selo Verificado */}
            {company.isVerified && (
              <span
                className="inline-flex shrink-0"
                title="Empresa verificada"
                aria-label="Empresa verificada"
              >
                <VerifiedIcon className="h-4 w-4" />
              </span>
            )}
          </div>

          {/* ============================================================ */}
          {/*  Linha 2: Rating + Localização                                */}
          {/* ============================================================ */}
          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {hasRating ? (
              <>
                <StarIcon className="fill-amber-400 text-amber-400" />
                <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {Number(rating).toFixed(1)}
                </strong>
                <span className="text-zinc-400 dark:text-zinc-500">
                  ({reviewCount})
                </span>
                {location && <span aria-hidden="true">•</span>}
              </>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px] italic">
                Sem avaliações
              </span>
            )}

            {location && (
              <span className="truncate text-zinc-500 dark:text-zinc-400">
                {location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  Tags de serviços (apenas se showServices)                        */}
      {/* ================================================================ */}
      {showServices && company.services && company.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {company.services.slice(0, 3).map((service, idx) => (
            <span
              key={idx}
              className="truncate max-w-[120px] rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium leading-[22px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {service}
            </span>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/*  Linha de ações: Comparar | Reviews | Orçamento                   */}
      {/* ================================================================ */}
      <div className="mt-2 grid w-full grid-cols-[1fr_1fr_1.1fr] gap-1 max-[360px]:grid-cols-[0.9fr_0.9fr_1fr] max-[360px]:gap-0.5">
        {/* Comparar */}
        {compareEnabled && (
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={isSelectedForComparison}
            aria-label={
              isSelectedForComparison
                ? `Remover ${company.name} da comparação`
                : `Adicionar ${company.name} à comparação`
            }
            className={cx(
              'inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border px-1.5 text-[11px] font-semibold leading-none transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1',
              isSelectedForComparison
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950',
            )}
          >
            {isSelectedForComparison ? (
              <>
                <CheckIcon className="text-blue-600 dark:text-blue-400" />
                <span className="whitespace-nowrap">
                  {selectedPosition
                    ? `${selectedPosition}/${maxComparison}`
                    : 'Selecionada'}
                </span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="text-zinc-400">
                  □
                </span>
                <span className="whitespace-nowrap">Comparar</span>
              </>
            )}
          </button>
        )}

        {/* Reviews */}
        {onReviews && (
          <button
            type="button"
            onClick={onReviews}
            aria-label="Ver avaliações"
            className={cx(
              'inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border border-zinc-200 bg-white px-1.5 text-[11px] font-semibold leading-none text-zinc-700 transition-colors',
              'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950',
            )}
          >
            <MessageIcon className="text-zinc-400" />
            <span className="whitespace-nowrap">Reviews</span>
          </button>
        )}

        {/* Orçamento */}
        {onBudget && (
          <button
            type="button"
            onClick={onBudget}
            disabled={isBudgetLoading}
            aria-label="Solicitar orçamento"
            className={cx(
              'inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg bg-[#2563EB] px-1.5 text-[11px] font-semibold leading-none text-white transition-colors',
              'hover:bg-[#1D4ED8]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-70',
              'dark:bg-blue-600 dark:hover:bg-blue-700',
            )}
          >
            {isBudgetLoading ? (
              <SpinnerIcon />
            ) : (
              <DocIcon />
            )}
            <span className="whitespace-nowrap">Orçamento</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatCompanyReferenceCard;