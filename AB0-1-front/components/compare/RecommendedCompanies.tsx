'use client';

import { useState } from 'react';
import { MapPin, RefreshCw, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CompanyLogo } from '@/components/CompanyLogo';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CompareCompany } from './mapCompanyToCompareCompany';

interface RecommendedCompaniesProps {
  companies: CompareCompany[];
  selectedCompanies: CompareCompany[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onAdd: (company: CompareCompany) => void;
  onReplace: (selectedId: number, replacement: CompareCompany) => void;
}

export default function RecommendedCompanies({
  companies,
  selectedCompanies,
  loading,
  error,
  onRetry,
  onAdd,
  onReplace,
}: RecommendedCompaniesProps) {
  const [replacement, setReplacement] = useState<CompareCompany | null>(null);
  const isMobile = useIsMobile(768);
  const isFull = selectedCompanies.length >= 3;

  const chooseReplacement = (selectedId: number) => {
    if (!replacement) return;
    onReplace(selectedId, replacement);
    setReplacement(null);
  };

  const pickerContent = (
    <div className="space-y-2">
      {selectedCompanies.map((company) => (
        <button
          key={company.id}
          type="button"
          onClick={() => chooseReplacement(company.id)}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label={`Substituir ${company.name} por ${replacement?.name || 'empresa recomendada'}`}
        >
          <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" badges={company.badges} />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
            {company.name}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <section
      className="rounded-none border border-slate-200 bg-white p-4 shadow-none"
      aria-labelledby="recommended-companies-title"
    >
      <h2 id="recommended-companies-title" className="text-base font-black text-slate-950">
        Empresas recomendadas
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Baseadas na sua cidade, categoria e empresas selecionadas.
      </p>

      <div className="mt-4 space-y-3" aria-live="polite">
        {loading && [1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-lg" />)}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm font-semibold text-red-800">
              Não foi possível carregar recomendações.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && companies.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
            Nenhuma recomendação disponível agora.
          </p>
        )}

        {!loading &&
          !error &&
          companies.map((company) => (
            <article key={company.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex gap-3">
                <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" badges={company.badges} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-black text-slate-950">{company.name}</h3>
                    {(company.sponsored || company.premium) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />{' '}
                        {company.sponsored ? 'Patrocinada' : 'Destaque'}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {company.categoryNames[0] || 'Categoria não informada'}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {[company.city, company.state].filter(Boolean).join(', ') ||
                      'Local não informado'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-black text-slate-900">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {company.rating > 0 ? company.rating.toFixed(1) : 'Sem nota'}
                </span>
                <span className="text-slate-500">{company.reviewsCount} avaliações</span>
                {company.verified && (
                  <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verificada
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => (isFull ? setReplacement(company) : onAdd(company))}
                aria-label={`${isFull ? 'Substituir por' : 'Adicionar'} ${company.name}`}
              >
                {isFull ? 'Substituir' : 'Adicionar'}
              </Button>
            </article>
          ))}
      </div>

      {isMobile ? (
        <Sheet open={Boolean(replacement)} onOpenChange={(open) => !open && setReplacement(null)}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Substituir qual empresa?</SheetTitle>
              <SheetDescription>Escolha uma empresa para remover da comparação.</SheetDescription>
            </SheetHeader>
            <div className="mt-5">{pickerContent}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={Boolean(replacement)} onOpenChange={(open) => !open && setReplacement(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Substituir qual empresa?</DialogTitle>
            </DialogHeader>
            {pickerContent}
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
