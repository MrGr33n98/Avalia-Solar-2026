'use client';

import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Draft = { session_id: string; company_name: string; state: string; transcript_text: string | null; transcript_version: number; privacy_url: string };

function VoiceReviewConfirmationContent({ params }: { params: { session_id: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [nameMode, setNameMode] = useState<'anonymous' | 'initials'>('anonymous');
  const [experienceConfirmed, setExperienceConfirmed] = useState(false);
  const [publishConsent, setPublishConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<Draft>(`/voice_review_sessions/${params.session_id}`, { headers: { Authorization: `Bearer ${token}` }, noCache: true })
      .then((value) => { setDraft(value); setText(value.transcript_text || ''); })
      .catch(() => setError('Este link de confirmação é inválido ou expirou.'));
  }, [params.session_id, token]);

  async function confirm() {
    if (!draft || text.trim().length < 5 || text.length > 500 || rating < 1 || !experienceConfirmed || !publishConsent) return;
    try {
      await fetchApi(`/voice_review_sessions/${params.session_id}/confirm`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': `voice-confirm-${params.session_id}` },
        body: JSON.stringify({ confirmation: { transcript_version: draft.transcript_version, review_text: text.trim(), rating, experience_confirmed: experienceConfirmed, publish_text_consent: publishConsent, display_name_mode: nameMode, full_name_consent: false } }),
      });
      setDone(true);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível confirmar a avaliação.'); }
  }

  if (error) return <main className="mx-auto max-w-lg px-6 py-24 text-center"><h1 className="text-2xl font-bold">Link indisponível</h1><p className="mt-3 text-slate-600">{error}</p></main>;
  if (done) return <main className="mx-auto max-w-lg px-6 py-24 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-6 text-3xl font-black">Avaliação recebida</h1><p className="mt-3 text-slate-600">Seu texto foi enviado para moderação. O áudio continua privado.</p></main>;
  if (!draft) return <main className="flex min-h-dvh items-center justify-center text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando revisão...</main>;

  return <main className="min-h-dvh bg-slate-50 px-5 py-10"><div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><div className="flex items-center gap-2 text-sm font-semibold text-violet-700"><ShieldCheck className="h-5 w-5" /> Confirme sua avaliação</div><h1 className="mt-6 text-3xl font-black">Sobre {draft.company_name}</h1><p className="mt-3 text-sm leading-6 text-slate-600">Leia o texto, corrija o que quiser e escolha a nota real da sua experiência. Só o texto confirmado será enviado à moderação.</p><label className="mt-8 block text-sm font-bold" htmlFor="voice-review-text">Texto que será enviado</label><Textarea id="voice-review-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={500} className="mt-2 min-h-36" /><div className="mt-2 text-right text-xs text-slate-500">{text.length}/500</div><fieldset className="mt-7"><legend className="text-sm font-bold">Qual é sua nota?</legend><div className="mt-3 flex gap-2" role="radiogroup" aria-label="Nota de 1 a 5">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-pressed={rating === value} onClick={() => setRating(value)} className={`h-11 w-11 rounded-full border text-sm font-bold ${rating === value ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 text-slate-700'}`}>{value}</button>)}</div></fieldset><fieldset className="mt-7"><legend className="text-sm font-bold">Como seu nome deve aparecer?</legend><div className="mt-3 flex flex-wrap gap-3">{(['anonymous', 'initials'] as const).map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="display-name" checked={nameMode === value} onChange={() => setNameMode(value)} />{value === 'anonymous' ? 'Anônimo' : 'Somente iniciais'}</label>)}</div></fieldset><div className="mt-7 space-y-3 text-sm"><label className="flex items-start gap-3"><input type="checkbox" checked={experienceConfirmed} onChange={(event) => setExperienceConfirmed(event.target.checked)} /><span>Confirmo que este relato descreve uma experiência real minha.</span></label><label className="flex items-start gap-3"><input type="checkbox" checked={publishConsent} onChange={(event) => setPublishConsent(event.target.checked)} /><span>Autorizo o envio deste texto para análise e possível publicação após moderação.</span></label></div><Button className="mt-9 w-full" size="lg" onClick={confirm} disabled={text.trim().length < 5 || text.length > 500 || rating < 1 || !experienceConfirmed || !publishConsent}>Confirmar e enviar para moderação</Button><p className="mt-5 text-xs leading-5 text-slate-500">O áudio não será publicado. Consulte o <a className="underline" href={draft.privacy_url}>Aviso de Privacidade</a>.</p></div></main>;
}

export default function VoiceReviewConfirmation({ params }: { params: { session_id: string } }) {
  return (
    <Suspense fallback={<main className="flex min-h-dvh items-center justify-center text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando revisão...</main>}>
      <VoiceReviewConfirmationContent params={params} />
    </Suspense>
  );
}
