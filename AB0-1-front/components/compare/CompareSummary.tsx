'use client';

import Link from 'next/link';
import { Check, ChevronRight, Clock3, Info, Map, Minus, ShieldCheck, Star } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import type { CompareCompany } from './mapCompanyToCompareCompany';

export default function CompareSummary({ companies }: { companies: CompareCompany[] }) {
  if (!companies || companies.length === 0) return null;

  return (
    <section aria-labelledby="compare-summary-title" className="w-full">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs">
        {/* Cabeçalho do Resumo */}
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <h2 id="compare-summary-title" className="text-sm sm:text-base font-bold text-slate-900">
            Resumo da comparação
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Dados públicos
          </span>
        </div>

        {/* Matriz Comparativa de Síntese */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">Resumo comparativo dos principais indicadores</caption>
            <colgroup>
              <col className="w-[28%] sm:w-[28%] md:w-44" />
              {companies.map((company) => (
                <col
                  key={company.id}
                  className={
                    companies.length === 2
                      ? 'w-[36%] sm:w-[36%] md:w-auto'
                      : 'w-auto'
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr className="align-top">
                <th scope="col" className="p-2 sm:p-2.5">
                  <span className="sr-only">Indicador</span>
                </th>
                {companies.map((company) => (
                  <th key={company.id} scope="col" className="p-2 sm:p-2.5 align-top min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <CompanyLogo
                        logoUrl={company.logoUrl}
                        name={company.name}
                        size="custom"
                        badges={company.badges}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0 object-contain border border-slate-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0 flex-wrap">
                          <Link
                            href={`/companies/${company.slug || company.id}`}
                            className="block text-xs sm:text-[13px] font-bold text-slate-900 hover:text-blue-700 leading-snug line-clamp-2 break-words"
                            title={company.name}
                          >
                            {company.name}
                          </Link>
                          {company.verified && (
                            <span className="inline-flex shrink-0">
                              <CompanyVerifiedBadge size="sm" />
                            </span>
                          )}
                        </div>
                        <span className="block truncate text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                          {[company.city, company.state].filter(Boolean).join(', ') ||
                            'Local não informado'}
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Linha 1: Verificação */}
              <tr>
                <th
                  scope="row"
                  className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                    Verificação
                  </span>
                </th>
                {companies.map((company) => (
                  <td key={company.id} className="p-2 sm:p-2.5 align-middle">
                    {company.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs">
                        <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                        Verificada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <Minus className="h-3 w-3" aria-hidden="true" />
                        Não verificada
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Linha 2: Cobertura */}
              <tr>
                <th
                  scope="row"
                  className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Map className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                    Cobertura
                  </span>
                </th>
                {companies.map((company) => {
                  const isNationwide =
                    company.coverageStates.length >= 26 || /brasil/i.test(company.state || '');
                  const regionCount =
                    company.coverageCities.length || company.coverageStates.length;
                  const label = isNationwide
                    ? 'Brasil'
                    : regionCount > 0
                      ? `${regionCount} ${regionCount === 1 ? 'região' : 'regiões'}`
                      : null;

                  return (
                    <td key={company.id} className="p-2 sm:p-2.5 align-middle">
                      {label ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                          {label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Minus className="h-3 w-3" aria-hidden="true" />
                          Não informado
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Linha 3: Nota média */}
              <tr>
                <th
                  scope="row"
                  className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                    Nota média
                  </span>
                </th>
                {companies.map((company) => (
                  <td key={company.id} className="p-2 sm:p-2.5 align-middle">
                    {company.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-bold text-slate-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                        {company.rating.toFixed(1).replace('.', ',')} de 5
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Minus className="h-3 w-3" aria-hidden="true" />
                        Sem avaliações
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Linha 4: Resposta */}
              <tr>
                <th
                  scope="row"
                  className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                    Resposta
                  </span>
                </th>
                {companies.map((company) => (
                  <td key={company.id} className="p-2 sm:p-2.5 align-middle">
                    {company.responseTimeLabel ? (
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-800">
                        {company.responseTimeLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500">
                        <Minus className="h-3 w-3" aria-hidden="true" />
                        Dados insuficientes
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Linha 5: Botões Ver Perfil */}
              <tr>
                <td className="p-2 sm:p-2.5" />
                {companies.map((company, index) => {
                  const isPrimary = index === 0;
                  return (
                    <td key={company.id} className="p-2 sm:p-2.5 align-middle">
                      <Link
                        href={`/companies/${company.slug || company.id}`}
                        className={`flex h-9 w-full items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-semibold transition-colors ${
                          isPrimary
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                            : 'border border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span>Ver perfil</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </Link>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rodapé explicativo dentro do painel */}
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-400">
          <Info className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Resumo calculado apenas com informações públicas disponíveis.</span>
        </div>
      </div>
    </section>
  );
}
