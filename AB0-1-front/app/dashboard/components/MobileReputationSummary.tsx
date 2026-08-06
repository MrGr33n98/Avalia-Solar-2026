'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award, BarChart3, Link2, MessageSquare, QrCode, Reply, Star } from 'lucide-react';

interface MobileReputationSummaryProps {
  averageRating: number;
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  inAnalysisReviews: number;
  verifiedReviews: number;
  verifiedRate: number;
  responseRate: number;
  unansweredReviews: number;
  npsScore: number | null;
  npsResponses: number;
  monthlyEvolution?: Record<string, number>;
  ratingDistribution?: Record<string, number>;
  sentimentDistribution?: Record<string, number>;
  sourceDistribution?: Record<string, number>;
}

export default function MobileReputationSummary({
  averageRating,
  totalReviews,
  approvedReviews,
  pendingReviews,
  inAnalysisReviews,
  verifiedReviews,
  verifiedRate,
  responseRate,
  unansweredReviews,
  npsScore,
  npsResponses,
  monthlyEvolution,
  ratingDistribution,
  sentimentDistribution,
  sourceDistribution,
}: MobileReputationSummaryProps) {
  const hasRating = averageRating > 0;

  return (
    <section
      className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden"
      aria-label="Resumo de reputação"
    >
      {/* Faixa principal */}
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-500">
          <Star className="h-7 w-7 fill-current" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
              {hasRating ? averageRating.toFixed(1).replace('.', ',') : '—'}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {hasRating ? 'de 5' : 'sem nota'}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
            <span>{totalReviews.toLocaleString('pt-BR')} avaliações</span>
            {npsScore !== null && <span>· NPS {npsScore}</span>}
            <span>· {responseRate}% resposta</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        type="button"
        className="mt-4 h-10 w-full gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white hover:bg-brand-blue/90"
        asChild
      >
        <a href="/dashboard?tab=review-forms">
          <QrCode className="h-4 w-4" aria-hidden="true" />
          Coletar avaliações
        </a>
      </Button>

      {/* Accordion de detalhes */}
      <Accordion type="multiple" className="mt-4">
        <AccordionItem value="evolution" className="border-b border-slate-100">
          <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Evolução mensal
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {monthlyEvolution && Object.keys(monthlyEvolution).length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-600">
                {Object.entries(monthlyEvolution)
                  .slice(-6)
                  .map(([month, count]) => (
                    <li key={month} className="flex justify-between">
                      <span>{month}</span>
                      <strong className="tabular-nums">{count} avaliações</strong>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Dados de evolução ainda insuficientes.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="distribution" className="border-b border-slate-100">
          <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Distribuição de notas
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {ratingDistribution && Object.keys(ratingDistribution).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(ratingDistribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([stars, count]) => (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-3 tabular-nums">{stars}</span>
                      <Star className="h-3 w-3 text-amber-400" aria-hidden="true" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${totalReviews ? (count / totalReviews) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-8 text-right tabular-nums">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhuma avaliação publicada ainda.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="received" className="border-b border-slate-100">
          <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Avaliações recebidas
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Publicadas</span>
                <strong className="tabular-nums">{approvedReviews}</strong>
              </li>
              <li className="flex justify-between">
                <span>Em moderação</span>
                <strong className="tabular-nums">{pendingReviews + inAnalysisReviews}</strong>
              </li>
              <li className="flex justify-between">
                <span>Verificadas</span>
                <strong className="tabular-nums">{verifiedReviews} ({verifiedRate}%)</strong>
              </li>
              <li className="flex justify-between">
                <span>Sem resposta</span>
                <strong className={cn('tabular-nums', unansweredReviews > 0 && 'text-amber-600')}>
                  {unansweredReviews}
                </strong>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sentiment" className="border-b border-slate-100">
          <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <Reply className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Sentimento e NPS
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {sentimentDistribution && Object.keys(sentimentDistribution).length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-600">
                {Object.entries(sentimentDistribution).map(([sentiment, count]) => (
                  <li key={sentiment} className="flex justify-between capitalize">
                    <span>{sentiment}</span>
                    <strong className="tabular-nums">{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Análise de sentimento ainda indisponível.</p>
            )}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Award className="h-3.5 w-3.5" aria-hidden="true" /> NPS
              </span>
              <strong className="tabular-nums">{npsScore !== null ? npsScore : '—'}</strong>
              <span className="text-slate-400">({npsResponses} respostas)</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sources" className="border-b-0">
          <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Fontes
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {sourceDistribution && Object.keys(sourceDistribution).length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-600">
                {Object.entries(sourceDistribution).map(([source, count]) => (
                  <li key={source} className="flex justify-between">
                    <span className="capitalize">{source}</span>
                    <strong className="tabular-nums">{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Nenhuma fonte de origem rastreada.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
