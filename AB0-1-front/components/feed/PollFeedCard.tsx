'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeedItem, PollOptionDTO } from '@/types/feed';
import { FeedCardFrame } from './FeedCardFrame';
import { FeedCardActions } from './FeedCardActions';
import { votePoll } from '@/lib/api/feed';
import { track } from '@/lib/analytics/lazy';

export function PollFeedCard({ item }: { item: FeedItem }) {
  const subject = item.subject;
  const [selected, setSelected] = useState<number | null>(subject.viewer_vote_id ?? null);
  const [options, setOptions] = useState<PollOptionDTO[]>(subject.options || []);
  const [total, setTotal] = useState(subject.total_votes ?? options.reduce((sum, option) => sum + option.votes_count, 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const closed = subject.poll_ends_at ? new Date(subject.poll_ends_at) <= new Date() : false;
  const voted = selected !== null;
  const percentages = useMemo(() => options.map((option) => ({ ...option, percentage: total ? (option.votes_count / total) * 100 : 0 })), [options, total]);

  useEffect(() => { if (!cardRef.current) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { track('poll_impression', { feed_item_id: item.id, poll_id: subject.id, subject_type: item.type, actor_id: item.actor.id, view: item.ranking_metadata?.mode }); observer.disconnect(); } }, { threshold: 0.5 }); observer.observe(cardRef.current); return () => observer.disconnect(); }, [item.id, item.type, item.actor.id, item.ranking_metadata?.mode, subject.id]);

  const submit = async () => {
    if (!selected || loading || voted && subject.viewer_vote_id != null || closed) return;
    const previous = { options, total, selected: null as number | null };
    const nextOptions = options.map((option) => option.id === selected ? { ...option, votes_count: option.votes_count + 1 } : option);
    setOptions(nextOptions); setTotal(total + 1); setLoading(true); setError(false);
    try { const result = await votePoll(subject.id, selected); setOptions(result.options.map((option) => ({ ...option, text: option.text }))); setTotal(result.total_votes); setSelected(result.viewer_option_id); track('poll_vote', { feed_item_id: item.id, poll_id: subject.id, poll_option_id: selected, total_votes: result.total_votes, view: item.ranking_metadata?.mode }); }
    catch { setOptions(previous.options); setTotal(previous.total); setSelected(previous.selected); setError(true); }
    finally { setLoading(false); }
  };

  return <FeedCardFrame reason={item.recommendation_reason?.label} itemId={item.id} itemType={item.type}><div ref={cardRef}>
    <h2 className="text-lg font-bold">{subject.title}</h2>
    {!voted && !closed ? <fieldset className="mt-4 space-y-2"><legend className="sr-only">Escolha uma opção</legend>{options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><input type="radio" name={`poll-${subject.id}`} value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} />{option.text || option.label}</label>)}<button type="button" disabled={!selected || loading} onClick={() => void submit()} className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? 'Enviando…' : 'Votar'}</button></fieldset> : <div className="mt-4 space-y-3">{percentages.map((option) => <div key={option.id}><div className="flex justify-between text-sm"><span className={selected === option.id ? 'font-bold' : ''}>{option.text || option.label}{selected === option.id ? ' · Seu voto' : ''}</span><span>{option.percentage?.toFixed(1)}%</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${option.percentage}%` }} /></div></div>)}<p className="text-xs text-muted-foreground">{total} votos{closed ? ' · Enquete encerrada' : ''}</p></div>}
    {error && <p role="alert" className="mt-2 text-xs text-destructive">Não foi possível registrar seu voto. Tente novamente.</p>}
    <FeedCardActions item={item} /></div>
  </FeedCardFrame>;
}
