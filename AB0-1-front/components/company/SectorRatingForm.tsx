import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCompanyContext } from '@/context/CompanyContext';
import { buildApiUrl } from '@/lib/api-config';

const DEFAULT_QUESTIONS = [
  {
    key: 'homologation',
    prompt: 'Como você avalia a agilidade da empresa em resolver os trâmites com a concessionária de energia?',
    helper: 'Homologação e burocracia',
    weight: 2
  },
  {
    key: 'technical_quality',
    prompt: 'O quão confiáveis parecem os equipamentos (inversores ou carregadores de EV) e o acabamento da instalação elétrica?',
    helper: 'Qualidade técnica e acabamento',
    weight: 2
  },
  {
    key: 'safety',
    prompt: 'A equipe de instalação respeitou as normas de segurança e deixou o local organizado após o serviço?',
    helper: 'Segurança e limpeza',
    weight: 1
  },
  {
    key: 'consultancy',
    prompt: 'O projeto foi bem explicado? A potência instalada realmente atende à sua necessidade de consumo?',
    helper: 'Consultoria e dimensionamento',
    weight: 1
  }
] as const;

type DefaultQuestion = (typeof DEFAULT_QUESTIONS)[number];

interface SectorQuestion {
  id?: number;
  key: string;
  prompt: string;
  helper: string;
  weight: number;
}

interface SectorRatingFormProps {
  companyId?: number;
  sectorRatingsEnabled?: boolean;
}

const createBlankAnswers = (questions: SectorQuestion[]) =>
  questions.reduce<Record<string, number | null>>((acc, question) => {
    acc[question.key] = null;
    return acc;
  }, {});

export function SectorRatingForm({ companyId: propCompanyId, sectorRatingsEnabled: propEnabled }: SectorRatingFormProps) {
  const { activeCompany } = useCompanyContext();
  const fallbackCompanyId = activeCompany?.id;
  const companyId = propCompanyId ?? fallbackCompanyId;
  const enabled = propEnabled ?? Boolean(activeCompany?.sector_ratings_enabled);

  const [questions, setQuestions] = useState<SectorQuestion[]>(DEFAULT_QUESTIONS);
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => createBlankAnswers(DEFAULT_QUESTIONS));
  const [comment, setComment] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers(createBlankAnswers(questions));
  }, [questions]);

  useEffect(() => {
    if (!companyId || !enabled) {
      setQuestions(DEFAULT_QUESTIONS);
      setLoadingQuestions(false);
      setQuestionError(null);
      return;
    }

    let cancelled = false;
    setLoadingQuestions(true);
    const questionsUrl = buildApiUrl(`/companies/${companyId}/sector_ratings/questions`);

    fetch(questionsUrl, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Erro ao carregar perguntas personalizadas.');
        }

        const data = await response.json();
        if (cancelled) return;
        const mapped = data.map(
          (item: { id: number; prompt: string; weight: number }) => ({
            id: item.id,
            key: `question_${item.id}`,
            prompt: item.prompt,
            helper: 'Pergunta personalizada',
            weight: Number(item.weight) || 1
          })
        );

        if (mapped.length === 0) {
          setQuestionError('Nenhuma pergunta personalizada foi cadastrada para esta empresa.');
          setQuestions(DEFAULT_QUESTIONS);
        } else {
          setQuestions(mapped);
          setQuestionError(null);
        }
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setQuestions(DEFAULT_QUESTIONS);
        setQuestionError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, enabled]);

  const allQuestions = questions.filter(Boolean);
  const areQuestionsAvailable = enabled && allQuestions.length > 0 && !questionError;
  const readyToSubmit = useMemo(
    () => areQuestionsAvailable && allQuestions.every((question) => answers[question.key]),
    [answers, allQuestions, areQuestionsAvailable]
  );

  const weightedAverage = useMemo(() => {
    if (!allQuestions.length) return '0.0';
    const numerator = allQuestions.reduce((sum, question) => {
      const value = answers[question.key];
      return sum + (value ?? 0) * question.weight;
    }, 0);
    const denominator = allQuestions.reduce((sum, question) => sum + question.weight, 0);
    return denominator ? (numerator / denominator).toFixed(1) : '0.0';
  }, [answers, allQuestions]);

  const handleStarClick = useCallback(
    (questionKey: string, value: number) => {
      setAnswers((prev) => ({ ...prev, [questionKey]: value }));
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
      setStatusMessage('Responda todas as perguntas antes de enviar.');
      return;
    }

    setSubmitting(true);
    try {
      const submitUrl = buildApiUrl(`/companies/${companyId}/sector_ratings`);
      const hasCustomQuestions = allQuestions.some((q) => q.id);

      const payload: any = {
        sector_rating: {
          comment,
        },
      };

      if (hasCustomQuestions) {
        payload.sector_rating.answers = allQuestions.reduce<Record<number, number>>((acc, question) => {
          if (question.id) {
            acc[question.id] = answers[question.key]!;
          }
          return acc;
        }, {});
      } else {
        payload.sector_rating = {
          ...payload.sector_rating,
          homologation: answers.homologation!,
          technical_quality: answers.technical_quality!,
          safety: answers.safety!,
          consultancy: answers.consultancy!,
        };
      }

      const response = await fetch(submitUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || payload.errors?.join?.(', ') || 'Não foi possível enviar a avaliação.');
      }

      setStatusMessage('Avaliação registrada com sucesso! Obrigado pela contribuição.');
      setAnswers(createBlankAnswers(allQuestions));
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
          Escolha uma empresa ativa para liberar as perguntas específicas de homologação, segurança e consultoria.
        </p>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200/80 bg-stone-50 p-6 text-sm text-stone-500">
        Carregando perguntas customizadas...
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5 text-sm text-teal-700">
        Esta empresa ainda não ativou as perguntas setoriais. Entre em contato para solicitar a ativação.
      </div>
    );
  }

  if (!areQuestionsAvailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
        {questionError ||
          'Ainda não há perguntas cadastradas para esta empresa. Aguarde o responsável habilitar o questionário.'}
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-soft lg:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Avaliação setorial</p>
        <h2 className="text-2xl font-semibold text-stone-900">Como foi o serviço?</h2>
        <p className="text-sm text-stone-500">Responda em até 5 estrelas e acompanhe a média ponderada ao final.</p>
      </header>

      <div className="space-y-4">
        {allQuestions.map((question) => (
          <div
            key={question.key}
            className="rounded-2xl border border-stone-200/60 bg-stone-50/80 p-4 shadow-sm transition hover:border-amber-400"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-800">{question.prompt}</p>
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
          Compartilhe detalhes da experiência (opcional)
        </label>
        <textarea
          id="sector-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-28 w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          placeholder="Conte como foi o atendimento, pontos fortes e sugestões..."
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            Média ponderada: <span className="text-amber-600">{weightedAverage}</span> / 5
          </p>
          <p className="text-xs text-stone-500">Homologação e Qualidade têm peso maior na média.</p>
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
