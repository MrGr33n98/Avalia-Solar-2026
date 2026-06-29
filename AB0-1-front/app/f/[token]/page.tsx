'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck, Star } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
  company: { id: number; name: string; slug: string; logo_url?: string | null };
};

export default function PublicReviewFormPage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') === 'qr' ? 'qr' : 'link';
  const [form, setForm] = useState<PublicReviewForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [realExperience, setRealExperience] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');

  useEffect(() => {
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
    void fetchApi(`/review_forms/${params.token}/event`, {
      method: 'POST',
      body: JSON.stringify({ event_type: 'review_started', source }),
      retries: 1,
      skipAuthRefresh: true,
    }).catch(() => undefined);
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
      setError('');
      const response = await fetchApi<{ review_id: number; message: string }>(
        `/review_forms/${params.token}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating,
            comment,
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
      setSubmittedMessage(response.message || 'Obrigado! Sua avaliação foi enviada.');
    } catch (requestError) {
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
      <PageShell>
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

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          {form.company.logo_url ? (
            <Image
              src={form.company.logo_url}
              alt={form.company.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl border border-slate-200 object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-700">
              {form.company.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-black text-slate-950">{form.company.name}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Avaliação no Avalia Solar
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {form.public_title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{form.public_description}</p>

          <form onSubmit={submit} onFocus={markStarted} className="mt-8 space-y-7">
            <RatingField label="Nota geral" value={rating} onChange={setRating} required />
            {form.settings.criteria.map((criterion) => (
              <RatingField
                key={criterion}
                label={criterion}
                value={answers[criterion] || 0}
                onChange={(value) => setAnswers((current) => ({ ...current, [criterion]: value }))}
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
                placeholder="O que funcionou bem? O que poderia melhorar?"
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
              className="h-12 w-full bg-blue-600 text-base font-bold hover:bg-blue-700"
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

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4">
      <div className="mx-auto flex max-w-6xl justify-center border-b border-slate-200 py-4">
        <BrandLogo className="h-8" priority />
      </div>
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
    <fieldset>
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
