'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
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

interface ReviewGranularScoreStepProps {
  categoryId: number;
  onChange: (scores: Record<number, number>) => void;
  values: Record<number, number>;
}

export function ReviewGranularScoreStep({ categoryId, onChange, values }: ReviewGranularScoreStepProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchApi(`/categories/${categoryId}/evaluation_context`)
      .then((data: any) => {
        if (data?.criteria && Array.isArray(data.criteria)) {
          setCriteria(data.criteria);
        } else {
          setCriteria([]);
        }
      })
      .catch(err => {
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
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Avalie os detalhes do serviço</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((j) => <Skeleton key={j} className="h-8 w-8 rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>;
  }

  if (criteria.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Critérios Específicos</p>
        <p className="text-xs text-slate-500">Esta categoria ainda não possui critérios técnicos detalhados para avaliação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Avalie os detalhes do serviço</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="p-4 bg-muted/10 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
            <Label className="text-sm font-bold flex items-center justify-between mb-1">
              <span>{criterion.title} {criterion.required && <span className="text-red-500">*</span>}</span>
            </Label>
            {criterion.help_text && (
              <p className="text-xs text-muted-foreground mb-3">{criterion.help_text}</p>
            )}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleScoreChange(criterion.id, star)}
                  className="focus:outline-none transition-transform hover:scale-110 p-1"
                >
                  <Star
                    className={`h-7 w-7 ${
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
