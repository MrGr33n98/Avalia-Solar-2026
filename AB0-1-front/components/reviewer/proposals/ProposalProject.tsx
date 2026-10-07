'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Wrench,
} from 'lucide-react';
import { reviewsApi, type MarketplaceProposal, type Review } from '@/lib/api';
import { formatDate, isProjectComplete, proposalChatUrl } from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function ProjectReview({ proposal }: { proposal: MarketplaceProposal }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    reviewsApi
      .listMine()
      .then((reviews) => {
        if (current)
          setExisting(
            reviews.some(
              (review) =>
                (review.company_id ||
                  (typeof review.company === 'object' && review.company?.id)) ===
                proposal.company.id
            )
          );
      })
      .catch(() => {
        if (current) setError('Não foi possível consultar sua avaliação. Tente novamente.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [proposal.company.id, attempt]);

  if (loading)
    return (
      <div role="status" className="py-6 text-center text-xs text-muted-foreground">
        Consultando sua avaliação…
      </div>
    );

  if (submitted || existing)
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3 shadow-2xs">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h4 className="font-bold text-sm text-emerald-900">
          {submitted ? 'Avaliação enviada com sucesso!' : 'Você já avaliou esta empresa'}
        </h4>
        <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
          {submitted
            ? 'Sua experiência foi registrada e ajudará outros usuários a escolherem a melhor empresa de energia solar.'
            : 'Você pode consultar ou editar suas avaliações diretamente no seu painel.'}
        </p>
        <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold text-xs border-emerald-300 text-emerald-800 bg-white">
          <Link href="/review-dashboard/reviews">Ver minhas avaliações</Link>
        </Button>
      </div>
    );

  if (error && !rating)
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
        <p className="text-xs font-semibold text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
          Tentar novamente
        </Button>
      </div>
    );

  return (
    <form
      className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!rating || busy) return;
        setBusy(true);
        setError('');
        const profile = proposal.request?.project_profile;
        const projectType = ['residential', 'commercial', 'industrial', 'rural'].includes(
          profile || ''
        )
          ? (profile as Review['project_type'])
          : undefined;
        try {
          await reviewsApi.create({
            company_id: proposal.company.id,
            rating,
            comment: comment.trim(),
            installation_status: 'completed',
            project_type: projectType,
            capture_flow_source: 'lead',
          });
          setSubmitted(true);
        } catch {
          setError('Não foi possível enviar sua avaliação. Confira os dados e tente novamente.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
        <div>
          <h4 className="font-bold text-sm text-foreground">Avalie o atendimento e a instalação</h4>
          <p className="text-xs text-muted-foreground">Como foi sua experiência com a {proposal.company.name}?</p>
        </div>
      </div>

      <fieldset disabled={busy} className="space-y-2">
        <legend className="text-xs font-bold text-foreground uppercase tracking-wider">
          Sua nota de satisfação
        </legend>
        <div className="flex gap-2 justify-center py-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-border/60 hover:bg-muted/40 transition-all select-none"
            >
              <input
                type="radio"
                name="project-rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
                aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              />
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  value <= rating ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/40'
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="project-review-comment" className="block text-xs font-semibold text-foreground">
        Conte como foi a instalação e o atendimento (opcional)
        <Textarea
          id="project-review-comment"
          rows={3}
          className="mt-1.5 rounded-xl border-border text-xs"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          disabled={busy}
          placeholder="Ex.: Instalação realizada dentro do prazo, equipe super atenciosa e sistema funcionando com ótima geração."
        />
        <span className="block text-right text-[10px] text-muted-foreground mt-1">
          {comment.length}/500
        </span>
      </label>

      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive bg-destructive/10 p-3 rounded-xl">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full gap-2 rounded-xl font-bold bg-primary shadow-2xs" disabled={!rating || busy}>
        <ThumbsUp className="h-4 w-4" />
        <span>{busy ? 'Enviando avaliação…' : 'Enviar avaliação'}</span>
      </Button>
    </form>
  );
}

export function ProposalProject({
  proposal,
  onViewProposal,
}: {
  proposal: MarketplaceProposal;
  onViewProposal: () => void;
}) {
  const project = proposal.project;

  if (!project)
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-2xs space-y-3">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-bold">Acompanhamento do projeto</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          O acompanhamento das etapas aparecerá aqui assim que a empresa iniciar a execução do projeto.
        </p>
      </div>
    );

  const complete = isProjectComplete(project);
  const milestones = [...project.milestones].sort((a, b) => a.position - b.position);
  const completedCount = milestones.filter((milestone) => milestone.status === 'completed').length;
  const progressPercent = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Celebration Banner when completed */}
      {complete && (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 text-center space-y-3 shadow-2xs">
          <Trophy className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="text-xl font-bold text-foreground">Projeto concluído com sucesso!</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Parabéns! Seu sistema de energia solar está instalado, homologado e em plena operação.
          </p>
        </div>
      )}

      {project.status === 'cancelled' && (
        <div role="status" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          Este projeto foi cancelado. Converse com a empresa para obter mais detalhes.
        </div>
      )}

      {/* Main Timeline Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
        {/* Top Header & Progress bar */}
        <div className="space-y-3 border-b border-border/60 pb-5">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span>Etapas de execução do projeto</span>
            </span>
            <span className="tabular-nums text-primary">
              {completedCount} de {milestones.length} concluídas ({progressPercent}%)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Vertical Timeline */}
        <ol className="relative space-y-6 pl-2">
          {milestones.map((milestone, index) => {
            const isDone = milestone.status === 'completed';
            const isCurrent = milestone.status === 'current';

            return (
              <li key={milestone.id} className="relative flex gap-4 text-xs">
                {/* Vertical Connector Line */}
                {index < milestones.length - 1 && (
                  <span
                    className={cn(
                      'absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px',
                      isDone ? 'bg-emerald-500' : 'bg-border/60'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Milestone Node Icon */}
                <span
                  className={cn(
                    'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'border-2 border-primary bg-primary/10 text-primary ring-4 ring-primary/10'
                        : 'bg-muted text-muted-foreground border border-border/60'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={cn('font-bold text-sm', isCurrent ? 'text-primary' : 'text-foreground')}>
                      {milestone.title}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCurrent
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isDone ? 'Concluída' : isCurrent ? 'Em andamento' : 'Aguardando'}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {milestone.completed_at
                      ? `Concluída em ${formatDate(milestone.completed_at)}`
                      : milestone.scheduled_at
                        ? `Previsão: ${formatDate(milestone.scheduled_at, true)}`
                        : isCurrent
                          ? 'Etapa em execução pela empresa'
                          : 'Aguardando etapa anterior'}
                  </p>

                  {milestone.notes && (
                    <p className="mt-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                      {milestone.notes}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {!milestones.length && (
          <p className="text-center text-xs text-muted-foreground py-4">
            A empresa ainda não cadastrou o cronograma de etapas.
          </p>
        )}
      </div>

      {/* Action Links */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="outline" onClick={onViewProposal} className="w-full sm:w-auto font-semibold text-xs rounded-xl border-border">
          Ver detalhes da proposta
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto font-semibold text-xs rounded-xl border-border gap-1.5">
          <Link href={proposalChatUrl(proposal)}>
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span>Conversar com a empresa</span>
          </Link>
        </Button>
      </div>

      {/* Step 10: Review Form when completed */}
      {complete && (
        <section className="border-t border-border/60 pt-6">
          <ProjectReview proposal={proposal} />
        </section>
      )}
    </div>
  );
}
