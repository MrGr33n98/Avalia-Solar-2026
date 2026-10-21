'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ThumbsUp, ArrowRight, ShieldCheck, PenSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CompanyLogo } from '@/components/CompanyLogo';
import { cn } from '@/lib/utils';

export interface CompanyReviewsSummarySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  logoUrl?: string;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  } | null;
  recommendationRate?: number | null;
  reviewsPath: string;
  reviewActionPath?: string;
}

export function CompanyReviewsSummarySheet({
  isOpen,
  onOpenChange,
  companyName,
  logoUrl,
  ratingAvg = 0,
  ratingCount = 0,
  sentiment,
  recommendationRate,
  reviewsPath,
  reviewActionPath,
}: CompanyReviewsSummarySheetProps) {
  const count = Number(ratingCount || 0);
  const avg = count > 0 && Number(ratingAvg) > 0 ? Number(ratingAvg) : null;
  const hasReviews = count > 0;

  // Sentimento só existe se houver avaliações reais e porcentagens válidas
  const hasSentiment =
    hasReviews &&
    Boolean(sentiment) &&
    typeof sentiment?.positive === 'number' &&
    (sentiment.positive > 0 || sentiment.neutral > 0 || sentiment.negative > 0);

  // Recomendação só existe se houver avaliações reais e percentual explícito
  const hasRecommendation =
    hasReviews &&
    recommendationRate !== null &&
    recommendationRate !== undefined &&
    !isNaN(Number(recommendationRate));

  const targetReviewUrl = reviewActionPath || `${reviewsPath.split('#')[0]}#review`;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col justify-between p-4 sm:p-6 overflow-y-auto max-h-[85dvh] sm:max-h-none bottom-0 sm:bottom-auto rounded-t-2xl sm:rounded-l-2xl sm:rounded-r-none border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800"
      >
        <div className="space-y-4 sm:space-y-5">
          {/* CABEÇALHO */}
          <SheetHeader className="text-left space-y-2 pb-3.5 border-b border-slate-100 dark:border-slate-800 pr-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-1 bg-white dark:bg-slate-900 shrink-0 shadow-xs">
                <CompanyLogo logoUrl={logoUrl} name={companyName} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                  {companyName}
                </SheetTitle>
                <SheetDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  Avaliações da comunidade
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {hasReviews ? (
            /* =========================================================
               ESTADO COM AVALIAÇÕES REAIS (Auditado e Seguro)
               ========================================================= */
            <div className="space-y-4">
              {/* NOTA GERAL */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {avg ? avg.toFixed(1) : '—'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            avg && i < Math.floor(avg)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {count === 1 ? '1 avaliação registrada' : `${count} avaliações registradas`}
                    </p>
                  </div>
                </div>
              </div>

              {/* SENTIMENTO DAS AVALIAÇÕES */}
              {hasSentiment && sentiment && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sentimento das avaliações
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        style={{ width: `${sentiment.positive}%` }}
                        className="bg-emerald-500 transition-all duration-300"
                        title={`Positivo: ${sentiment.positive}%`}
                      />
                      <div
                        style={{ width: `${sentiment.neutral}%` }}
                        className="bg-amber-400 transition-all duration-300"
                        title={`Neutro: ${sentiment.neutral}%`}
                      />
                      <div
                        style={{ width: `${sentiment.negative}%` }}
                        className="bg-rose-500 transition-all duration-300"
                        title={`Negativo: ${sentiment.negative}%`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-0.5 text-center text-xs">
                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {sentiment.positive}%
                        </span>
                        <span className="block text-[10px] text-slate-500">Positivo</span>
                      </div>
                      <div>
                        <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {sentiment.neutral}%
                        </span>
                        <span className="block text-[10px] text-slate-500">Neutro</span>
                      </div>
                      <div>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {sentiment.negative}%
                        </span>
                        <span className="block text-[10px] text-slate-500">Negativo</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ÍNDICE DE RECOMENDAÇÃO */}
              {hasRecommendation && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recomendação
                  </h4>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ThumbsUp className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {recommendationRate}%
                        </span>{' '}
                        dos clientes recomendam
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Com base nas respostas explícitas de recomendação
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* GARANTIA DE TRANSPARÊNCIA */}
              <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>Avaliações moderadas e auditadas para garantir autenticidade.</span>
              </div>
            </div>
          ) : (
            /* =========================================================
               ESTADO SEM AVALIAÇÕES (Zero Fake Data — Redesign Mobile)
               ========================================================= */
            <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-4 animate-in fade-in duration-200">
              <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40">
                <Star className="h-6 w-6 fill-amber-400/20 stroke-amber-500" />
              </div>

              <div className="space-y-1.5 max-w-[280px]">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Ainda não há avaliações
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sua experiência pode ajudar outras pessoas a escolher a melhor empresa.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-2.5 text-[11px] text-slate-600 dark:text-slate-400 text-left w-full mt-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>As avaliações são publicadas conforme as regras de moderação da plataforma.</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA INFERIOR */}
        <SheetFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 sm:justify-stretch">
          {hasReviews ? (
            <div className="flex flex-col w-full gap-2">
              <Button
                asChild
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
              >
                <Link href={reviewsPath} onClick={() => onOpenChange(false)}>
                  Ver todas as avaliações
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full h-8 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center justify-center gap-1.5"
              >
                <Link href={targetReviewUrl} onClick={() => onOpenChange(false)}>
                  <PenSquare className="h-3 w-3" />
                  Avaliar esta empresa
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Link href={targetReviewUrl} onClick={() => onOpenChange(false)}>
                <PenSquare className="h-4 w-4" />
                Avaliar esta empresa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CompanyReviewsSummarySheet;
