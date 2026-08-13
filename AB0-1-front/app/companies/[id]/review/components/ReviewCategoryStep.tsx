'use client';

import { Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  seo_url: string;
}

interface ReviewCategoryStepProps {
  categories: Category[];
  onSelect: (categoryId: number) => void;
  selectedId?: number;
  errorCategoryId?: number;
}

export function ReviewCategoryStep({
  categories,
  onSelect,
  selectedId,
  errorCategoryId,
}: ReviewCategoryStepProps) {
  const isSingle = categories.length === 1;

  useEffect(() => {
    if (isSingle && categories[0].id !== selectedId) {
      onSelect(categories[0].id);
    }
  }, [isSingle, categories, selectedId, onSelect]);

  if (isSingle) {
    const category = categories[0];
    const isError = errorCategoryId === category.id;

    return (
      <Alert
        className={cn(
          'rounded-xl transition-colors',
          isError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        )}
      >
        <Info className={cn('h-4 w-4', isError ? 'text-red-600' : 'text-blue-600')} />
        <AlertDescription className={cn('font-medium', isError ? 'text-red-800' : 'text-blue-800')}>
          Você está avaliando o serviço de <strong>{category.name}</strong>.
          {isError && (
            <span className="block mt-1 text-xs font-black uppercase tracking-tighter text-red-600">
              Você já avaliou este serviço recentemente.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">
        Qual serviço foi realizado para você?
      </h3>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Categoria da avaliação"
      >
        {categories.map((category) => {
          const isError = errorCategoryId === category.id;
          const isSelected = selectedId === category.id;

          return (
            <button
              type="button"
              key={category.id}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                'relative flex min-h-[72px] whitespace-normal rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors  focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2970FF]',
                isSelected
                  ? 'border-[#2970FF] bg-[#EFF8FF] text-[#0A1F44]'
                  : 'border-[#D0D5DD] bg-white text-[#344054] hover:border-[#2970FF] hover:bg-[#EFF8FF]',
                isError && 'border-red-600 bg-red-50 text-red-800'
              )}
              onClick={() => onSelect(category.id)}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{category.name}</span>
                {isError && <span className="text-[9px]">Já avaliado</span>}
                {isSelected && !isError && <Check className="h-4 w-4" aria-hidden="true" />}
                {isError && <X className="h-4 w-4" aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </div>
      {!selectedId && (
        <p role="status" className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Selecione uma opção para carregar os critérios
        </p>
      )}
    </div>
  );
}
