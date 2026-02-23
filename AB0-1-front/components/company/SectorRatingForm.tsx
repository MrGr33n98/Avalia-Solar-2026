import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useCompanyContext } from '@/context/CompanyContext';

const QUESTIONS = [
  {
    key: 'homologation',
    label: 'Como você avalia a agilidade da empresa em resolver os trâmites com a concessionária de energia?',
    weight: 2,
    helper: 'Homologação, ligação e burocracia'
  },
  {
    key: 'technical_quality',
    label: 'O quão confiáveis parecem os equipamentos (inversores ou carregadores de EV) e o acabamento da instalação elétrica?',
    weight: 2,
    helper: 'Confiabilidade técnica e acabamento'
  },
  {
    key: 'safety',
    label: 'A equipe de instalação respeitou as normas de segurança e deixou o local organizado após o serviço?',
    weight: 1,
    helper: 'Segurança e limpeza do ambiente'
  },
  {
    key: 'consultancy',
    label: 'O projeto foi bem explicado? A potência instalada realmente atende a sua necessidade de consumo?',
    weight: 1,
    helper: 'Consultoria e dimensionamento'
  }
] as const;

type QuestionKey = (typeof QUESTIONS)[number]['key'];

const createBlankAnswers = () =>
  QUESTIONS.reduce<Record<QuestionKey, number | null>>((acc, question) => {
    acc[question.key] = null;
    return acc;
  }, {} as Record<QuestionKey, number | null>);

export function SectorRatingForm() {
  const { activeCompany } = useCompanyContext();
  const [answers, setAnswers] = useState(createBlankAnswers);
  const [comment, setComment] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const companyId = activeCompany?.id;

  const readyToSubmit = useMemo(() => Object.values(answers).every(Boolean), [answers]);
  const weightedAverage = useMemo(() => {
    const numerator = QUESTIONS.reduce((sum, question) => {
      const value = answers[question.key];
      return sum + (value ?? 0) * question.weight;
    }, 0);
    const denominator = QUESTIONS.reduce((sum, question) => sum + question.weight, 0);
    return denominator ? (numerator / denominator).toFixed(1) : '0.0';
  }, [answers]);

  const handleStarClick = useCallback(
    (question: QuestionKey, value: number) => {
      setAnswers((prev) => ({ ...prev, [question]: value }));
      setStatusMessage(null);
    },
    []
  );

  const handleSubmit = async () => {
    if (!companyId) {
      setStatusMessage('Selecione uma empresa antes de avaliar.');
      return;
    }

    if (!readyToSubmit) {
      setStatusMessage('Responda todas as perguntas.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${companyId}/sector_ratings`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sector_rating: {
              ...answers,
              comment
            }
          })
        }
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || payload.errors?.join?.(', ') || 'Não foi possível enviar a avaliação.');
      }

      setStatusMessage('Avaliação registrada com sucesso! Obrigado pela contribuição.');
      setAnswers(createBlankAnswers());
      setComment('');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setSubmitting(false);
    }
  };

  if (!companyId) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-soft">
        <p className="text-sm text-stone-600">
          Escolha a empresa no topo para liberar as perguntas específicas de homologação, segurança e consultoria.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-soft lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Avaliação setorial</p>
        <h2 className="text-2xl font-semibold text-stone-900">Como foi o serviço?</h2>
        <p className="text-sm text-stone-500">Responda com até 5 estrelas e veja a média ponderada ao final.</p>
      </header>

      <div className="space-y-4">
        {QUESTIONS.map((question) => (
          <div
            key={question.key}
            className="rounded-2xl border border-stone-200/60 bg-stone-50/80 p-4 shadow-sm transition hover:border-amber-400"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-800">{question.label}</p>
              <span className="text-xs font-semibold text-amber-600">Peso {question.weight}</span>
            </div>
            <p className="text-xs text-stone-500">{question.helper}</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Avaliar ${value} estrelas`}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border transition',
                    answers[question.key] && answers[question.key] >= value
                      ? 'border-amber-500 bg-amber-500/20 text-amber-500 shadow-inner'
                      : 'border-stone-200 bg-white text-stone-400 hover:border-amber-400 hover:text-amber-500'
                  )}
                  onClick={() => handleStarClick(question.key, value)}
                >
                  <Star className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="sector-comment" className="text-sm font-medium text-stone-700">
          Conte mais sobre a experiência (opcional)
        </label>
        <textarea
          id="sector-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-24 w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          placeholder="Compartilhe o que gostou, os principais desafios e o que poderia melhorar..."
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            Média ponderada: <span className="text-amber-600">{weightedAverage}</span> / 5
          </p>
          <p className="text-xs text-stone-500">Homologação e Qualidade têm peso maior na média final.</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!readyToSubmit || submitting}
          className={clsx(
            'rounded-full px-6 py-3 text-sm font-semibold transition',
            !readyToSubmit || submitting
              ? 'cursor-not-allowed bg-stone-200 text-stone-500'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90'
          )}
        >
          {submitting ? 'Enviando...' : 'Finalizar avaliação'}
        </button>
      </div>

      {statusMessage && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-600">{statusMessage}</p>
      )}
    </section>
  );
}
