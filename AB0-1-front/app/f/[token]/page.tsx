'use client';

import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Star,
  ArrowDown,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useReviewDraft } from './hooks/useReviewDraft';
import { track } from '@/lib/analytics/consolidated';
import { normalizeChannel } from '@/lib/review-forms/urls';

type PublicReviewForm = {
  id: number;
  public_title: string;
  public_description: string;
  form_type: string;
  settings: {
    criteria: string[];
    comment_required: boolean;
    thank_you_message: string;
  };
  criteria?: Array<{ id: number; slug: string; title: string; weight?: number; required?: boolean }>;
  branding?: { logo_url?: string | null; cover_url?: string | null; accent_color?: string; company_name?: string };
  company: { id: number; name: string; slug: string; logo_url?: string | null };
};

export default function PublicReviewFormPage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams();
  const source = normalizeChannel(searchParams.get('source'));
  const [form, setForm] = useState<PublicReviewForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [npsScore, setNpsScore] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [realExperience, setRealExperience] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [draftDismissed, setDraftDismissed] = useState(false);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const { draft, save, clear } = useReviewDraft(params.token);
  const criteria = form?.criteria || [];

  useEffect(() => {
    if (!draft) return;
    setRating(draft.rating);
    setAnswers(draft.answers);
    setComment(draft.comment);
  }, [draft]);

  useEffect(() => {
    if (!form || submittedMessage) return;
    const timer = window.setTimeout(() => save({ step: 1, rating, answers, comment }), 500);
    return () => window.clearTimeout(timer);
  }, [answers, comment, form, rating, save, submittedMessage]);

  const accentColor = form?.branding?.accent_color || '#5448C8';

  useEffect(() => {
    track('review_wizard_opened', { source });
    fetchApi<{ review_form: PublicReviewForm }>(`/review_forms/${params.token}/public`, {
      params: { source },
      retries: 1,
      skipAuthRefresh: true,
      noCache: true,
    })
      .then((response) => setForm(response.review_form))
      .catch(() => setError('Este formulário não está disponível.'))
      .finally(() => setLoading(false));
  }, [params.token, source]);

  const markStarted = () => {
    if (started) return;
    setStarted(true);
    track('review_started', { source });
    void fetchApi(`/review_forms/${params.token}/event`, {
      method: 'POST',
      body: JSON.stringify({ event_type: 'review_started', source }),
      retries: 1,
      skipAuthRefresh: true,
    }).catch(() => undefined);
  };

  const handleScrollToForm = () => {
    markStarted();
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canSubmit = useMemo(
    () =>
      rating > 0 &&
      reviewerName.trim().length > 1 &&
      contact.trim().length > 2 &&
      realExperience &&
      consent &&
      (!form?.settings.comment_required || comment.trim().length > 0),
    [
      comment,
      consent,
      contact,
      form?.settings.comment_required,
      rating,
      realExperience,
      reviewerName,
    ]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      track('review_submit_attempted', { source });
      setError('');
      const response = await fetchApi<{ review_id: number; message: string }>(
        `/review_forms/${params.token}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating,
            comment,
            nps_score: npsScore,
            reviewer_name: reviewerName,
            contact,
            city,
            state,
            real_experience: realExperience,
            consent_given: consent,
            website,
            answers,
            source,
          }),
          retries: 1,
          skipAuthRefresh: true,
        }
      );
      clear();
      track('review_submit_success', { source });
      setSubmittedMessage(response.message || 'Obrigado! Sua avaliação foi enviada.');
    } catch (requestError) {
      track('review_submit_error', { source });
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível enviar sua avaliação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <PageShell>
        <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando formulário...
        </div>
      </PageShell>
    );

  if (!form || (error && !form))
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-24 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-5 text-2xl font-black text-slate-950">Formulário indisponível</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </PageShell>
    );

  if (submittedMessage) {
    return (
      <PageShell companyName={form.company.name} companyLogo={form.branding?.logo_url || form.company.logo_url}>
        <div className="mx-auto max-w-lg py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            Avaliação recebida
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{submittedMessage}</p>
          <p className="mt-6 text-sm text-slate-400">
            Sua avaliação poderá passar por moderação para garantir a qualidade e autenticidade das
            informações.
          </p>
        </div>
      </PageShell>
    );
  }

  const companyLogoUrl = form.branding?.logo_url || form.company.logo_url;

  return (
    <PageShell companyName={form.company.name} companyLogo={companyLogoUrl}>
      <div className="mx-auto max-w-4xl py-6 sm:py-10">
        {/* ─── HERO CARD DE CONVITE (ESTILO G2) ─── */}
        <section
          data-testid="review-invite-hero"
          className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-12 text-center shadow-xs"
        >
          {/* AVATAR DA EMPRESA: PREENCHIMENTO TOTAL DO ESPAÇO */}
          <div
            data-testid="company-logo-avatar"
            className="relative mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
          >
            {companyLogoUrl ? (
              <Image
                src={companyLogoUrl}
                alt={form.company.name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-black text-blue-700">
                {form.company.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Compartilhe sua experiência sobre {form.company.name}
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            Consumidores e empresas consultam a Avalia Solar para pesquisar soluções de energia solar e integradores homologados. Sua perspectiva sincera ajuda outros clientes a tomarem a melhor decisão com base em experiências reais.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              data-testid="review-now-cta"
              onClick={handleScrollToForm}
              className="h-11 px-8 rounded-full bg-[#5448C8] hover:bg-[#4338CA] text-white font-bold text-base shadow-xs transition-all hover:shadow-md inline-flex items-center gap-2"
            >
              <span>Avaliar agora</span>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ─── BOAS PRÁTICAS PARA TER SUA AVALIAÇÃO APROVADA (ESTILO G2 IDENTICAL ICONS) ─── */}
        <section
          data-testid="review-best-practices"
          className="mt-12 text-center"
        >
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Boas práticas para ter sua avaliação aprovada
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {/* 1. Use Your Work Email (G2 envelope icon) */}
            <div className="flex items-start gap-3.5">
              <svg
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-slate-900"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2.5" y="6.5" width="27" height="19" rx="1" />
                <path d="M2.5 7.5L16 17.5L29.5 7.5" />
                <path d="M2.5 25L12 15.5" />
                <path d="M29.5 25L20 15.5" />
              </svg>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Use seu contato real</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
                  Fornecer seu e-mail ou WhatsApp corporativo/pessoal ajuda nossos moderadores a verificar você com mais rapidez. Seus dados nunca serão exibidos publicamente.
                </p>
              </div>
            </div>

            {/* 2. Be Authentic (G2 megaphone icon with sound lines) */}
            <div className="flex items-start gap-3.5">
              <svg
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-slate-900"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h5l10-6v19l-10-6H5a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 5 12z" />
                <path d="M10 19v6a1.5 1.5 0 0 0 1.5 1.5h1" />
                <path d="M24 9l2-2" />
                <path d="M26 15.5h3" />
                <path d="M24 22l2 2" />
              </svg>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Seja autêntico</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
                  Escreva sobre sua experiência real com a empresa instaladora. O que funcionou bem? O que poderia melhorar? Relatos autênticos têm muito mais valor.
                </p>
              </div>
            </div>

            {/* 3. Share a Screenshot (G2 camera icon) */}
            <div className="flex items-start gap-3.5">
              <svg
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-slate-900"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10a2 2 0 0 1 2-2h4l2-3h8l2 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" />
                <circle cx="16" cy="17" r="4.5" />
                <circle cx="23" cy="12" r="1" fill="currentColor" />
              </svg>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Compartilhe detalhes</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
                  Informar cidade, detalhes do projeto ou fotos da conta e instalação assegura credibilidade máxima e acelera a validação com selo Verificado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTAINER DO FORMULÁRIO INTERATIVO ─── */}
        <div
          ref={formSectionRef}
          id="review-form-section"
          data-testid="review-form-section"
          className="mt-12 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs"
        >
          {draft && !draftDismissed && !started && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-[#D1E9FF] bg-[#EFF8FF] p-3 text-sm text-[#0A1F44]">
              <span>Você tem uma avaliação não finalizada. Dados salvos foram restaurados.</span>
              <button
                type="button"
                className="text-xs font-semibold underline"
                onClick={() => {
                  clear();
                  setDraftDismissed(true);
                }}
              >
                Descartar
              </button>
            </div>
          )}

          <div className="border-b border-slate-100 pb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Formulário Oficial de Avaliação</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {form.public_title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {form.public_description}
            </p>
          </div>

          <form onSubmit={submit} onFocus={markStarted} className="mt-8 space-y-7">
            <RatingField label="Nota geral" value={rating} onChange={setRating} required />
            {criteria.map((criterion) => (
              <RatingField
                key={criterion.id}
                label={criterion.title}
                value={answers[String(criterion.id)] || 0}
                onChange={(value) =>
                  setAnswers((current) => ({ ...current, [String(criterion.id)]: value }))
                }
                required={criterion.required}
              />
            ))}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-900">
                Conte como foi sua experiência{' '}
                {form.settings.comment_required && <span className="text-red-500">*</span>}
              </span>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={5}
                maxLength={500}
                required={form.settings.comment_required}
                placeholder="O que funcionou bem? O que poderia melhorar? Descreva sua experiência com a instalação, prazo e pós-venda..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Seu nome"
                value={reviewerName}
                onChange={setReviewerName}
                required
              />
              <TextField
                label="E-mail ou WhatsApp"
                value={contact}
                onChange={setContact}
                required
              />
              <TextField label="Cidade" value={city} onChange={setCity} />
              <TextField
                label="Estado"
                value={state}
                onChange={(value) => setState(value.toUpperCase().slice(0, 2))}
                maxLength={2}
              />
            </div>

            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              name="website"
            />

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <span className="block text-sm font-bold text-slate-900 leading-snug">
                Em uma escala de 0 a 10, qual a probabilidade de você recomendar esta empresa para um amigo ou colega? (Opcional)
              </span>
              <div className="flex flex-wrap justify-between gap-1 mt-2">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNpsScore(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition-all ${
                      npsScore === i
                        ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/25"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 mt-1">
                <span>Muito improvável</span>
                <span>Muito provável</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
              <strong>Como as respostas serão exibidas:</strong> Suas respostas ajudarão a calcular as médias operacionais e o índice de recomendação pública da empresa de forma agregada. Suas informações de contato pessoais (e-mail e WhatsApp) são estritamente confidenciais e <strong>nunca serão exibidas publicamente</strong> no site ou passadas a terceiros.
            </p>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <CheckRow
                checked={realExperience}
                onChange={setRealExperience}
                label="Confirmo que tive uma experiência real com esta empresa."
              />
              <CheckRow
                checked={consent}
                onChange={setConsent}
                label="Concordo com o uso destes dados para publicação e moderação da avaliação, conforme a LGPD."
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{ backgroundColor: accentColor }}
              className="h-11 w-full rounded-lg text-base font-bold hover:opacity-90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar avaliação'
              )}
            </Button>
            <p className="text-center text-xs leading-5 text-slate-400">
              Sua avaliação poderá passar por moderação para garantir a qualidade e autenticidade
              das informações.
            </p>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({
  children,
  companyName,
  companyLogo,
}: {
  children: React.ReactNode;
  companyName?: string;
  companyLogo?: string | null;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#F9FAFB] px-3 sm:px-6 pb-[env(safe-area-inset-bottom)]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-2 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-7 w-auto" priority />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Coleta Oficial de Avaliações
            </span>
          </div>
          {companyName && (
            <div className="flex items-center gap-2">
              {companyLogo && (
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-lg border border-slate-200 object-contain p-0.5"
                  unoptimized
                />
              )}
              <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[140px] sm:max-w-[220px]">
                {companyName}
              </span>
            </div>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}

function RatingField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  return (
    <fieldset role="radiogroup" aria-label={label}>
      <legend className="text-sm font-bold text-slate-900">
        {label} {required && <span className="text-red-500">*</span>}
      </legend>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} de 5`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white transition-colors hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Star
              className={`h-6 w-6 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-900">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-600">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <span>{label}</span>
    </label>
  );
}
