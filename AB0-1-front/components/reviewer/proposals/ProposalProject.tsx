'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Star } from 'lucide-react';
import { reviewsApi, type MarketplaceProposal, type Review } from '@/lib/api';
import { formatDate, isProjectComplete } from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function ProjectReview({ proposal }: { proposal: MarketplaceProposal }) {
  const [rating, setRating] = useState(0);
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
    reviewsApi.listMine().then((reviews) => {
      if (current) setExisting(reviews.some((review) => (review.company_id || (typeof review.company === 'object' && review.company?.id)) === proposal.company.id));
    }).catch(() => { if (current) setError('Não foi possível consultar sua avaliação. Tente novamente.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [proposal.company.id, attempt]);

  if (loading) return <p role="status" className="text-sm text-muted-foreground">Consultando sua avaliação…</p>;
  if (submitted || existing) return <div role="status" className="space-y-3"><p className="font-medium">{submitted ? 'Avaliação enviada' : 'Você já avaliou esta empresa'}</p><p className="text-sm text-muted-foreground">{submitted ? 'Sua experiência foi registrada e seguirá o processo de moderação.' : 'Você pode consultar ou editar sua avaliação no painel.'}</p><Button variant="outline" asChild><Link href="/review-dashboard/reviews">Minhas avaliações</Link></Button></div>;
  if (error && !rating) return <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button></div>;

  return <form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault(); if (!rating || busy) return;
    setBusy(true); setError('');
    const profile = proposal.request?.project_profile;
    const projectType = ['residential', 'commercial', 'industrial', 'rural'].includes(profile || '') ? profile as Review['project_type'] : undefined;
    try {
      await reviewsApi.create({ company_id: proposal.company.id, rating, comment: comment.trim(), installation_status: 'completed', project_type: projectType, capture_flow_source: 'lead' });
      setSubmitted(true);
    } catch { setError('Não foi possível enviar sua avaliação. Confira os dados e tente novamente.'); }
    finally { setBusy(false); }
  }}>
    <fieldset disabled={busy}><legend className="text-sm font-medium">Como foi sua experiência?</legend><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg"><input type="radio" name="project-rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="peer sr-only" aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} /><Star className={cn('h-7 w-7 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary', value <= rating ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground')} /></label>)}</div></fieldset>
    <label htmlFor="project-review-comment" className="block text-sm font-medium">Conte como foi (opcional)<Textarea id="project-review-comment" className="mt-2" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} disabled={busy} placeholder="Sua experiência ajuda outras pessoas a escolher." /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={!rating || busy}>{busy ? 'Enviando avaliação…' : 'Enviar avaliação'}</Button>
  </form>;
}

export function ProposalProject({ proposal, onViewProposal }: { proposal: MarketplaceProposal; onViewProposal: () => void }) {
  const project = proposal.project;
  if (!project) return <p className="text-sm text-muted-foreground">O acompanhamento aparecerá após a confirmação do interesse. Atualize a proposta para consultar o progresso.</p>;
  const complete = isProjectComplete(project);
  const milestones = [...project.milestones].sort((a, b) => a.position - b.position);
  const completed = milestones.filter((milestone) => milestone.status === 'completed').length;
  return <div className="space-y-6">
    {complete && <div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h3 className="mt-4 text-xl font-semibold">Projeto concluído!</h3><p className="mt-2 text-sm text-muted-foreground">Seu projeto foi marcado como concluído pela empresa. Agora conte como foi sua experiência.</p></div>}
    {project.status === 'cancelled' && <p role="status" className="rounded-xl bg-muted p-4 text-sm">Este projeto foi cancelado. Consulte a empresa para mais informações.</p>}
    <div><div className="flex items-center justify-between gap-3 text-sm"><h3 className="font-semibold">Etapas do projeto</h3><span className="text-muted-foreground">{completed}/{milestones.length}</span></div>
      <ol className="mt-5">{milestones.map((milestone, index) => <li key={milestone.id} className="relative flex gap-3 pb-6 last:pb-0">{index < milestones.length - 1 && <span className="absolute bottom-0 left-3 top-6 w-px bg-border" aria-hidden="true" />}<span className={cn('relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full', milestone.status === 'completed' ? 'bg-primary text-primary-foreground' : milestone.status === 'current' ? 'border-2 border-primary bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{milestone.status === 'completed' ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><div><p className="text-sm font-medium">{milestone.title}</p><p className="mt-1 text-xs text-muted-foreground">{milestone.completed_at ? `Concluída em ${formatDate(milestone.completed_at)}` : milestone.scheduled_at ? `Agendada para ${formatDate(milestone.scheduled_at, true)}` : milestone.status === 'current' ? 'Em andamento' : milestone.status === 'completed' ? 'Concluída' : 'Aguardando'}</p>{milestone.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{milestone.notes}</p>}</div></li>)}</ol>
      {!milestones.length && <p className="mt-4 text-sm text-muted-foreground">A empresa ainda não atualizou as etapas do projeto.</p>}
    </div>
    <Button variant="outline" onClick={onViewProposal} className="w-full">Ver proposta</Button>
    {complete && <section className="border-t border-border pt-5"><ProjectReview proposal={proposal} /></section>}
  </div>;
}
