import { Clock3, Info, Map, ShieldCheck, Star } from 'lucide-react';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { buildCompareSummary } from './compare-insights';
import type { CompareCompany } from './mapCompanyToCompareCompany';

export default function CompareSummary({ companies }: { companies: CompareCompany[] }) {
  const summaryItems = buildCompareSummary(companies);
  const verifiedItem = summaryItems.find((item) => item.key === 'verified');
  const coverageItem = summaryItems.find((item) => item.key === 'coverage');
  const ratingItem = summaryItems.find((item) => item.key === 'rating');
  const responseItem = summaryItems.find((item) => item.key === 'response');

  return (
    <section aria-labelledby="compare-summary-title" className="w-full">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-xs">
        {/* Header compacto */}
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <h2 id="compare-summary-title" className="text-xs sm:text-sm font-bold text-slate-900">
            Resumo da comparação
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-400">
            <Info className="h-3 w-3 text-slate-400" aria-hidden="true" />
            Dados públicos
          </span>
        </div>

        {/* Grid 2x2 compacto de síntese */}
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40">
          {/* Célula 1: Verificação */}
          <div className="flex flex-col justify-center p-2.5 sm:p-3 min-h-[64px] sm:min-h-[72px]">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              Verificação
            </span>
            <div className="mt-1 flex items-center gap-1 min-w-0">
              {verifiedItem?.isBothVerified ? (
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 inline-flex items-center gap-1 leading-snug">
                  Ambas <CompanyVerifiedBadge size="sm" />
                </span>
              ) : verifiedItem?.companyName ? (
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 inline-flex items-center gap-1 leading-snug break-words">
                  {verifiedItem.companyName} <CompanyVerifiedBadge size="sm" />
                </span>
              ) : (
                <span className="text-xs sm:text-[13px] font-medium text-slate-400">
                  Nenhuma verificada
                </span>
              )}
            </div>
          </div>

          {/* Célula 2: Cobertura */}
          <div className="flex flex-col justify-center p-2.5 sm:p-3 min-h-[64px] sm:min-h-[72px] !border-t-0">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">
              <Map className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              Cobertura
            </span>
            <div className="mt-1 min-w-0">
              {coverageItem?.companyName ? (
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                  {coverageItem.detail}
                </span>
              ) : (
                <span className="text-xs sm:text-[13px] font-medium text-slate-400">
                  Dados insuficientes
                </span>
              )}
            </div>
          </div>

          {/* Célula 3: Avaliação */}
          <div className="flex flex-col justify-center p-2.5 sm:p-3 min-h-[64px] sm:min-h-[72px]">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">
              <Star className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              Avaliação
            </span>
            <div className="mt-1 min-w-0">
              {ratingItem?.companyName ? (
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                  {ratingItem.detail}
                </span>
              ) : (
                <span className="text-xs sm:text-[13px] font-medium text-slate-400">
                  Dados insuficientes
                </span>
              )}
            </div>
          </div>

          {/* Célula 4: Resposta */}
          <div className="flex flex-col justify-center p-2.5 sm:p-3 min-h-[64px] sm:min-h-[72px]">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">
              <Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              Resposta
            </span>
            <div className="mt-1 min-w-0">
              {responseItem?.companyName ? (
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                  {responseItem.detail}
                </span>
              ) : (
                <span className="text-xs sm:text-[13px] font-medium text-slate-400">
                  Dados insuficientes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-slate-400">
        Resumo calculado apenas com as informações públicas disponíveis para as empresas
        selecionadas.
      </p>
    </section>
  );
}
