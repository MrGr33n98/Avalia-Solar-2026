'use client';

import { useState } from 'react';
import { MapPin, RefreshCw, Star } from 'lucide-react';
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
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { useIsMobile } from '@/hooks/useIsMobile';
import { COMPARISON_LIMITS } from '@/lib/comparison/config';
import type { CompareCompany } from './mapCompanyToCompareCompany';

interface RecommendedCompaniesProps {
  companies: CompareCompany[];
  selectedCompanies: CompareCompany[];
  maxComparison?: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onAdd: (company: CompareCompany) => void;
  onReplace: (selectedId: number, replacement: CompareCompany) => void;
}

export default function RecommendedCompanies({
  companies,
  selectedCompanies,
  maxComparison,
  loading,
  error,
  onRetry,
  onAdd,
  onReplace,
}: RecommendedCompaniesProps) {
  const [replacement, setReplacement] = useState<CompareCompany | null>(null);
  const isMobile = useIsMobile(768);
  const effectiveMax =
    typeof maxComparison === 'number'
      ? maxComparison
      : isMobile
        ? COMPARISON_LIMITS.mobile
        : COMPARISON_LIMITS.desktop;
  const isFull = selectedCompanies.length >= effectiveMax;

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
      className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm"
      aria-labelledby="recommended-companies-title"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="recommended-companies-title" className="text-base font-bold text-slate-950">
          Empresas recomendadas
        </h2>
        <a
          href="/companies"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
        >
          Ver mais <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Baseadas na sua cidade, categoria e empresas selecionadas.
      </p>

      <div className="mt-3.5 space-y-2.5" aria-live="polite">
        {loading && [1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-lg" />)}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm font-semibold text-red-800">
              Não foi possível carregar recomendações.
            </p>
            <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={onRetry}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && companies.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
            Nenhuma recomendação disponível agora.
          </p>
        )}

        {!loading &&
          !error &&
          companies.map((company) => (
            <article
              key={company.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-slate-50/40 p-3 shadow-2xs transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
            >
              <div>
                <div className="flex items-start gap-2.5">
                  <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" badges={company.badges} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <h3 className="truncate text-xs sm:text-[13px] font-bold text-slate-950">{company.name}</h3>
                      {company.verified && <CompanyVerifiedBadge size="sm" />}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {company.categoryNames[0] || 'Energia Solar'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">
                        {[company.city, company.state].filter(Boolean).join(', ') || 'Local não informado'}
                      </span>
                    </p>
                  </div>
                </div>
                {company.rating > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                    <span>{company.rating.toFixed(1).replace('.', ',')}</span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2.5 h-8 w-full rounded-lg text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
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
