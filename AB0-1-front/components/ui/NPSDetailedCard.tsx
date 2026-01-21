'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Aspect = { label: string; value: number };

type NPSDetailedCardProps = {
  className?: string;
  averageRating: number;
  reviewsCount: number;
  aspects?: Aspect[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toStars = (value: number) => {
  const clamped = clamp(value, 0, 5);
  const whole = Math.floor(clamped);
  const hasHalf = clamped - whole >= 0.5;
  return { whole, hasHalf, clamped };
};

function StarsRow({ value }: { value: number }) {
  const { whole, hasHalf } = toStars(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Nota ${value.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const filled = idx < whole || (idx === whole && hasHalf);
        return (
          <Star
            key={idx}
            className={cn('h-4 w-4', filled ? 'text-amber-500 fill-amber-400' : 'text-amber-200')}
          />
        );
      })}
    </div>
  );
}

export default function NPSDetailedCard({ className, averageRating, reviewsCount, aspects }: NPSDetailedCardProps) {
  const base = clamp(averageRating || 0, 0, 5);
  const derivedAspects: Aspect[] =
    aspects && aspects.length > 0
      ? aspects
      : [
          { label: 'Atendimento', value: base },
          { label: 'Qualidade', value: clamp(base - 0.2, 0, 5) },
          { label: 'Prazo', value: clamp(base - 0.4, 0, 5) },
          { label: 'Custo-benefício', value: clamp(base - 0.1, 0, 5) },
        ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={cn('border-gray-200 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <div className="text-sm font-semibold text-gray-900">Net promoter score</div>
          <div className="text-xs text-gray-500">Nota geral e aspectos</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-4">
              <div className="text-[11px] text-gray-500 font-medium">Nota Geral</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-4xl font-extrabold text-gray-900 tabular-nums">{base.toFixed(2)}</div>
                <div className="text-xs text-gray-500 pb-1">/ 5</div>
              </div>
              <div className="mt-2">
                <StarsRow value={base} />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-4">
              <div className="text-[11px] text-gray-500 font-medium">Número de avaliações</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-4xl font-extrabold text-gray-900 tabular-nums">
                  {Math.max(0, reviewsCount || 0)}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Avaliações aprovadas no Avaliasolar</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-700">
              Aspectos
            </div>
            <div className="px-4 py-3 space-y-3">
              {derivedAspects.map((aspect) => (
                <div key={aspect.label} className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-900">{aspect.label}</div>
                  <div className="flex items-center gap-2">
                    <StarsRow value={aspect.value} />
                    <div className="text-xs text-gray-500 tabular-nums w-[44px] text-right">
                      {aspect.value.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

