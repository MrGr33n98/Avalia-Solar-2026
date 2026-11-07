'use client';

import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type InferredCriterion = {
  criterion_id?: number | null;
  criterion_slug: string;
  title: string;
  score: number | null;
};

type Draft = {
  session_id: string;
  company_name: string;
  state: string;
  transcript_text: string | null;
  transcript_version: number;
  headline?: string | null;
  inferred_rating?: number | null;
  inferred_criteria?: InferredCriterion[];
  mentioned_equipment?: string[];
  privacy_url: string;
};

function VoiceReviewConfirmationContent({ params }: { params: { session_id: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [draft, setDraft] = useState<Draft | null>(null);
  const [headline, setHeadline] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [nameMode, setNameMode] = useState<'anonymous' | 'initials'>('anonymous');
  const [experienceConfirmed, setExperienceConfirmed] = useState(true);
  const [publishConsent, setPublishConsent] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<Draft>(`/voice_review_sessions/${params.session_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      noCache: true,
    })
      .then((value) => {
        setDraft(value);
        setText(value.transcript_text || '');
        setHeadline(value.headline || `Avaliação sobre ${value.company_name}`);
        setRating(value.inferred_rating && value.inferred_rating >= 1 ? value.inferred_rating : 5);
        const mapped: Record<string, number> = {};
        (value.inferred_criteria || []).forEach((item) => {
          if (item.score && item.score >= 1 && item.score <= 5) {
            mapped[item.criterion_slug] = item.score;
          }
        });
        setCriteriaScores(mapped);
      })
      .catch(() => setError('Este link de confirmação é inválido ou expirou.'));
  }, [params.session_id, token]);

  async function confirm() {
    if (!draft || text.trim().length < 5 || text.length > 500 || rating < 1 || !experienceConfirmed || !publishConsent) return;
    try {
      await fetchApi(`/voice_review_sessions/${params.session_id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': `voice-confirm-${params.session_id}` },
        body: JSON.stringify({
          confirmation: {
            transcript_version: draft.transcript_version,
            headline: headline.trim(),
            review_text: text.trim(),
            rating,
            criterion_scores: criteriaScores,
            mentioned_equipment: draft.mentioned_equipment || [],
            experience_confirmed: experienceConfirmed,
            publish_text_consent: publishConsent,
            display_name_mode: nameMode,
            full_name_consent: false,
          },
        }),
      });
      setDone(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível confirmar a avaliação.');
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Link indisponível</h1>
        <p className="mt-3 text-slate-600">{error}</p>
      </main>
    );
  }
  if (done) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h1 className="mt-6 text-3xl font-black">Avaliação Verificada por Voz Recebida</h1>
        <p className="mt-3 text-slate-600">
          Sua avaliação estruturada foi enviada para publicação com o selo Verificado via Áudio (WhatsApp). O áudio original continua privado.
        </p>
      </main>
    );
  }
  if (!draft) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando revisão...
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-5 w-5" /> Avaliação Verificada via Áudio (WhatsApp)
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" /> Estruturada por IA
          </span>
        </div>

        <h1 className="mt-5 text-3xl font-black">Sobre {draft.company_name}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Transformamos seu áudio em uma avaliação estruturada. Revise ou ajuste qualquer detalhe antes de publicar.
        </p>

        <label className="mt-6 block text-sm font-bold" htmlFor="voice-review-headline">
          Título sugerido
        </label>
        <Input
          id="voice-review-headline"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          maxLength={100}
          className="mt-2"
        />

        <label className="mt-6 block text-sm font-bold" htmlFor="voice-review-text">
          Depoimento (editado para leitura limpa)
        </label>
        <Textarea
          id="voice-review-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          className="mt-2 min-h-32"
        />
        <div className="mt-1 text-right text-xs text-slate-500">{text.length}/500</div>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold">Nota Geral</legend>
          <div className="mt-2.5 flex gap-2" role="radiogroup" aria-label="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className={`h-11 w-11 rounded-full border text-sm font-bold ${
                  rating === value ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 text-slate-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        {draft.inferred_criteria && draft.inferred_criteria.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sub-notas inferidas pelo seu áudio (toque para ajustar)
            </p>
            <div className="mt-3 space-y-3">
              {draft.inferred_criteria.map((item) => {
                const current = criteriaScores[item.criterion_slug] || 0;
                return (
                  <div key={item.criterion_slug} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() =>
                            setCriteriaScores((prev) => ({ ...prev, [item.criterion_slug]: score }))
                          }
                          className={`h-8 w-8 rounded-lg border text-xs font-bold ${
                            current === score
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {draft.mentioned_equipment && draft.mentioned_equipment.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Equipamento citado:</span>
            {draft.mentioned_equipment.map((eq) => (
              <span key={eq} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {eq}
              </span>
            ))}
          </div>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-bold">Como seu nome deve aparecer?</legend>
          <div className="mt-2.5 flex flex-wrap gap-3">
            {(['anonymous', 'initials'] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="display-name"
                  checked={nameMode === value}
                  onChange={() => setNameMode(value)}
                />
                {value === 'anonymous' ? 'Anônimo' : 'Somente iniciais'}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 space-y-3 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={experienceConfirmed}
              onChange={(event) => setExperienceConfirmed(event.target.checked)}
            />
            <span>Confirmo que este relato descreve uma experiência real minha.</span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={publishConsent}
              onChange={(event) => setPublishConsent(event.target.checked)}
            />
            <span>Autorizo o envio deste texto para análise e publicação após moderação.</span>
          </label>
        </div>

        <Button
          className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          size="lg"
          onClick={confirm}
          disabled={text.trim().length < 5 || text.length > 500 || rating < 1 || !experienceConfirmed || !publishConsent}
        >
          ✅ Aprovar e Publicar Avaliação
        </Button>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          O áudio original não será publicado. Consulte o{' '}
          <a className="underline" href={draft.privacy_url}>
            Aviso de Privacidade
          </a>
          .
        </p>
      </div>
    </main>
  );
}

export default function VoiceReviewConfirmation({ params }: { params: { session_id: string } }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando revisão...
        </main>
      }
    >
      <VoiceReviewConfirmationContent params={params} />
    </Suspense>
  );
}
