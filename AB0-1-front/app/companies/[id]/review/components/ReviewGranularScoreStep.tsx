'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Criterion {
  id: number;
  slug: string;
  title: string;
  help_text: string | null;
  required: boolean;
}

interface EvaluationContextResponse {
  criteria?: Criterion[];
}

interface ReviewGranularScoreStepProps {
  categoryId: number;
  onChange: (scores: Record<number, number>) => void;
  values: Record<number, number>;
}

export function ReviewGranularScoreStep({
  categoryId,
  onChange,
  values,
}: ReviewGranularScoreStepProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchApi(`/categories/${categoryId}/evaluation_context`)
      .then((data: EvaluationContextResponse) => {
        if (data?.criteria && Array.isArray(data.criteria)) {
          setCriteria(data.criteria);
        } else {
          setCriteria([]);
        }
      })
      .catch((err) => {
        console.error('[ReviewGranularScoreStep] Failed to fetch criteria:', err);
        setError('Não foi possível carregar os critérios de avaliação.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [categoryId]);

  const handleScoreChange = (criterionId: number, score: number) => {
    onChange({ ...values, [criterionId]: score });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Avalie os detalhes do serviço</h3>
        <div className="grid gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 rounded-lg border border-[#D0D5DD] p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-8 w-8" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (criteria.length === 0) {
    return (
      <div className="space-y-2 border border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Critérios Específicos
        </p>
        <p className="text-xs text-slate-500">
          Esta categoria ainda não possui critérios técnicos detalhados para avaliação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#0B1F4B]">Critérios de avaliação</h3>
      <div className="grid gap-2">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="border border-[#D0D5DD] bg-white px-3 py-2">
            <Label className="text-sm font-semibold flex items-center justify-between mb-0">
              <span>
                {criterion.title} {criterion.required && <span className="text-red-500">*</span>}
              </span>
            </Label>
            {criterion.help_text && (
              <p className="text-xs text-[#667085] mb-1">{criterion.help_text}</p>
            )}
            <div className="flex gap-0.5" role="radiogroup" aria-label={criterion.title}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleScoreChange(criterion.id, star)}
                  aria-label={`${star} estrela${star > 1 ? 's' : ''} para ${criterion.title}`}
                  role="radio"
                  aria-checked={(values[criterion.id] || 0) === star}
                  className="flex h-11 w-9 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2970FF]"
                >
                  <Star
                    aria-hidden="true"
                    className={`h-6 w-6 ${
                      star <= (values[criterion.id] || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
