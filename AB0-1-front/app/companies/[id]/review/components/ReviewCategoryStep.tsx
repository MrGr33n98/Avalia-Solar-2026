'use client';

import { Check, Info, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

export function ReviewCategoryStep({ categories, onSelect, selectedId, errorCategoryId }: ReviewCategoryStepProps) {
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
      <Alert className={cn(
        "transition-all duration-500",
        isError ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
      )}>
        <Info className={cn("h-4 w-4", isError ? "text-red-600" : "text-blue-600")} />
        <AlertDescription className={cn("font-medium", isError ? "text-red-800" : "text-blue-800")}>
          Você está avaliando o serviço de <strong>{category.name}</strong>.
          {isError && <span className="block mt-1 text-xs font-black uppercase tracking-tighter text-red-600">Você já avaliou este serviço recentemente.</span>}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Qual serviço foi realizado para você?</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const isError = errorCategoryId === category.id;
          const isSelected = selectedId === category.id;

          return (
            <Card
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:border-blue-400 relative overflow-hidden",
                isSelected ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-border",
                isError && "border-red-500 ring-1 ring-red-500 bg-red-50/30"
              )}
              onClick={() => onSelect(category.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={cn(
                    "font-bold",
                    isSelected ? "text-blue-900" : "text-slate-700",
                    isError && "text-red-900"
                  )}>
                    {category.name}
                  </span>
                  {isError && <span className="text-[9px] font-black uppercase tracking-tighter text-red-600">Já avaliado</span>}
                </div>
                {isSelected && !isError && (
                  <div className="bg-blue-600 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {isError && (
                  <div className="bg-red-600 rounded-full p-1">
                    <X className="h-3 w-3 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!selectedId && (
        <p className="text-xs text-amber-600 font-bold uppercase tracking-widest animate-pulse">
          Selecione uma opção para carregar os critérios
        </p>
      )}
    </div>
  );
}
