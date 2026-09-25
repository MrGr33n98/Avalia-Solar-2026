'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ThumbsUp, ArrowRight, ShieldCheck } from 'lucide-react';
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
}: CompanyReviewsSummarySheetProps) {
  const avg = Number(ratingAvg || 0);
  const count = Number(ratingCount || 0);
  const hasSentiment =
    Boolean(sentiment) &&
    typeof sentiment?.positive === 'number' &&
    (sentiment.positive > 0 || sentiment.neutral > 0 || sentiment.negative > 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col justify-between p-6 overflow-y-auto"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 bg-white dark:bg-slate-900 shrink-0">
                <CompanyLogo logoUrl={logoUrl} name={companyName} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  Avaliações da {companyName}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Resumo de reputação e notas verificadas pela comunidade
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* NOTA GERAL */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {count > 0 && avg > 0 ? avg.toFixed(1) : '—'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        count > 0 && i < Math.floor(avg)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {count > 0
                    ? `${count} ${count === 1 ? 'avaliação registrada' : 'avaliações registradas'}`
                    : 'Ainda não possui avaliações'}
                </p>
              </div>
            </div>
          </div>

          {/* SENTIMENTO DAS AVALIAÇÕES — ZERO FAKE DATA */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sentimento das avaliações
            </h4>
            {hasSentiment && sentiment ? (
              <div className="space-y-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-950">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
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
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
                Distribuição de sentimento não disponível para esta empresa.
              </div>
            )}
          </div>

          {/* ÍNDICE DE RECOMENDAÇÃO — ZERO FAKE DATA */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recomendação
            </h4>
            {recommendationRate !== null && recommendationRate !== undefined ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-950">
                <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {recommendationRate}%
                    </span>{' '}
                    dos clientes recomendam
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Com base nas respostas explícitas de recomendação
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
                Dados de recomendação não informados.
              </div>
            )}
          </div>

          {/* GARANTIA DE TRANSPARÊNCIA */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-700 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>Avaliações moderadas e auditadas para garantir autenticidade.</span>
          </div>
        </div>

        {/* CTA INFERIOR */}
        <SheetFooter className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 sm:justify-stretch">
          <Button
            asChild
            className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2"
          >
            <Link href={reviewsPath} onClick={() => onOpenChange(false)}>
              Ver todas as avaliações
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
