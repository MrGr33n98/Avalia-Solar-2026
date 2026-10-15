'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ChevronDown, MinusCircle, Star, X } from 'lucide-react';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import type { CompareCompany } from './mapCompanyToCompareCompany';
import { canUsePaidConversion } from '@/lib/feature-access';

type Value = string | number | boolean | null;
interface Criterion {
  label: string;
  value: (company: CompareCompany) => Value;
  suffix?: string;
}
interface Group {
  id: string;
  label: string;
  criteria: Criterion[];
}

const booleanValue = (value: boolean | null) => value;
const yearsInMarket = (company: CompareCompany) =>
  company.founded_year ? Math.max(0, new Date().getFullYear() - company.founded_year) : null;
const coverageLabel = (company: CompareCompany) => {
  if (company.coverageCities.length > 0) return company.coverageCities.join(', ');
  if (company.coverageStates.length > 0) return company.coverageStates.join(', ');
  return null;
};

const groups: Group[] = [
  {
    id: 'rating',
    label: 'Avaliação geral',
    criteria: [
      { label: 'Nota geral', value: (company) => company.rating || null },
      { label: 'Total de avaliações', value: (company) => company.reviewsCount || null },
      { label: 'Recomendação', value: (company) => company.recommendationRate, suffix: '%' },
      { label: 'Votos úteis', value: () => null },
    ],
  },
  {
    id: 'trust',
    label: 'Confiança',
    criteria: [
      { label: 'Empresa verificada', value: (company) => booleanValue(company.verified) },
      { label: 'CNPJ verificado', value: (company) => company.cnpjVerified },
      { label: 'Documentos verificados', value: (company) => company.documentsVerified },
      { label: 'Endereço verificado', value: (company) => company.addressVerified },
    ],
  },
  {
    id: 'service',
    label: 'Atendimento e Orçamento',
    criteria: [
      {
        label: 'Prazo do orçamento',
        value: (company) => {
          const val = company.comparison_profile?.quote_turnaround;
          if (val === 'within_24h') return 'Até 24h';
          if (val === 'within_3_days') return 'Até 3 dias';
          if (val === 'consult') return 'Consultar';
          return company.responseTimeLabel;
        },
      },
      {
        label: 'Visita técnica',
        value: (company) => {
          const val = company.comparison_profile?.technical_visit;
          if (val === 'free') return 'Gratuita';
          if (val === 'paid') return 'Paga';
          if (val === 'consult') return 'Consultar';
          if (val === 'not_offered') return 'Não oferece';
          return null;
        },
      },
      { label: 'Tempo médio de resposta', value: (company) => company.responseTimeLabel },
      { label: 'Atendimento por WhatsApp', value: (company) => company.whatsappAvailable },
    ],
  },
  {
    id: 'coverage',
    label: 'Atuação',
    criteria: [
      {
        label: 'Cidade base',
        value: (company) => [company.city, company.state].filter(Boolean).join(', ') || null,
      },
      { label: 'Cobertura', value: coverageLabel },
      { label: 'Anos de experiência', value: yearsInMarket, suffix: ' anos' },
      { label: 'Projetos realizados', value: (company) => company.deliveredProjects },
    ],
  },
  {
    id: 'commercial',
    label: 'Comercial e Execução',
    criteria: [
      {
        label: 'Financiamento',
        value: (company) => {
          const val = company.comparison_profile?.financing_availability;
          if (val === 'available') return 'Disponível';
          if (val === 'consult') return 'Consultar';
          if (val === 'not_offered') return 'Não oferece';
          return company.financing_enabled === undefined ? null : Boolean(company.financing_enabled);
        },
      },
      {
        label: 'Formas de pagamento',
        value: (company) => company.paymentMethods.join(', ') || null,
      },
      {
        label: 'Instalação no pacote',
        value: (company) => {
          const val = company.comparison_profile?.installation_terms;
          if (val === 'included') return 'Inclusa';
          if (val === 'separately_contracted') return 'Contratada à parte';
          if (val === 'not_offered') return 'Não oferece';
          return null;
        },
      },
      {
        label: 'Equipe de instalação',
        value: (company) => {
          const val = company.comparison_profile?.installation_team;
          if (val === 'in_house') return 'Própria';
          if (val === 'outsourced') return 'Terceirizada';
          if (val === 'mixed') return 'Mista';
          return null;
        },
      },
      {
        label: 'Acompanhamento do sistema',
        value: (company) => {
          const val = company.comparison_profile?.system_monitoring;
          if (val === 'app') return 'Pelo aplicativo';
          if (val === 'web_portal') return 'Portal web';
          if (val === 'manual') return 'Manual';
          if (val === 'not_offered') return 'Não oferece';
          return null;
        },
      },
      { label: 'Garantia', value: (company) => company.warrantyYears, suffix: ' anos' },
      { label: 'Suporte pós-venda', value: (company) => company.postSalesSupport },
    ],
  },
  {
    id: 'specialties',
    label: 'Especialidades',
    criteria: [
      {
        label: 'Energia solar residencial',
        value: (company) => company.specialties.residentialSolar,
      },
      { label: 'Energia solar comercial', value: (company) => company.specialties.commercialSolar },
      { label: 'Mobilidade elétrica', value: (company) => company.specialties.electricMobility },
      { label: 'Wallbox / carregadores', value: (company) => company.specialties.wallbox },
      { label: 'Bateria / armazenamento', value: (company) => company.specialties.batteryStorage },
    ],
  },
];

function DisplayValue({ value, suffix = '' }: { value: Value; suffix?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">Não informado</span>;
  }
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" aria-hidden="true" /> Sim
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <MinusCircle className="h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4" aria-hidden="true" /> Não
      </span>
    );
  }
  const stringValue = String(value);
  if (/\d+\s*regi/i.test(stringValue)) {
    return (
      <span className="font-semibold text-blue-700">
        {value}
        {suffix}
      </span>
    );
  }
  if (suffix === '%' || /%$/.test(stringValue)) {
    return (
      <span className="font-bold text-slate-900">
        {value}
        {suffix}
      </span>
    );
  }
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

interface CompareTableProps {
  companies: CompareCompany[];
  onRemove: (id: number) => void;
  onQuote: (company: CompareCompany) => void;
}

export default function CompareTable({ companies, onRemove, onQuote }: CompareTableProps) {
  const isFluid = companies.length <= 2;

  return (
    <section aria-label="Tabela de comparação lado a lado">
      {!isFluid && (
        <p className="mb-2 flex items-center justify-end gap-1 text-[11px] font-medium text-blue-700 md:hidden">
          Arraste para o lado para ver mais empresas <span aria-hidden="true">→</span>
        </p>
      )}
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div
          className={
            isFluid
              ? 'w-full overflow-hidden'
              : 'w-full touch-auto snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth'
          }
        >
          <table
            className={
              isFluid
                ? 'w-full table-fixed border-collapse text-left'
                : 'w-max min-w-full table-fixed border-collapse text-left'
            }
            style={
              isFluid
                ? undefined
                : { minWidth: `${140 + Math.max(companies.length, 1) * 180}px`, width: '100%' }
            }
          >
            <caption className="sr-only">
              Critérios das empresas selecionadas para comparação
            </caption>
            <colgroup>
              <col
                className={
                  isFluid
                    ? companies.length === 2
                      ? 'w-[27%] sm:w-[28%] md:w-44'
                      : 'w-[34%] sm:w-[30%] md:w-44'
                    : 'w-32 md:w-44'
                }
              />
              {companies.map((company) => (
                <col
                  key={company.id}
                  className={
                    isFluid
                      ? companies.length === 2
                        ? 'w-[36.5%] sm:w-[36%] md:w-auto'
                        : 'w-[66%] sm:w-[70%] md:w-auto'
                      : 'w-[180px] md:w-auto'
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 align-top">
                <th
                  scope="col"
                  className={`border-r border-slate-200 bg-slate-50/90 p-2 sm:p-2.5 md:p-3.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 ${
                    isFluid
                      ? 'w-[27%] sm:w-[28%] md:w-44'
                      : 'sticky left-0 z-30 w-32 md:w-44'
                  }`}
                >
                  Critério
                </th>
                {companies.map((company) => (
                  <th
                    key={company.id}
                    scope="col"
                    className={`relative border-r border-slate-200 bg-white p-2 sm:p-2.5 md:p-3.5 align-top ${
                      isFluid ? 'min-w-0' : 'min-w-[180px]'
                    }`}
                  >
                    {/* Botão X: discreto, área de toque 44px transparente, sem caixa grande */}
                    <button
                      type="button"
                      onClick={() => onRemove(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" aria-hidden="true" />
                    </button>

                    {/* Conteúdo do cabeçalho com reserva de espaço à direita para o X */}
                    <div className="flex flex-col gap-1.5 min-w-0 pr-7 sm:pr-8">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <CompanyLogo
                          logoUrl={company.logoUrl}
                          name={company.name}
                          size="custom"
                          badges={company.badges}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0 object-contain border border-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
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
                      {company.rating > 0 && (
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700">
                          <Star
                            className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{company.rating.toFixed(1).replace('.', ',')}</span>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <TableGroup
                key={group.id}
                group={group}
                companies={companies}
                isFluid={isFluid}
              />
            ))}
            <tbody>
              <tr className="border-t border-slate-200 bg-slate-50/50 align-top">
                <th
                  scope="row"
                  className={`border-r border-slate-200 bg-slate-50/90 p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-slate-800 md:p-3.5 ${
                    isFluid ? '' : 'sticky left-0 z-20'
                  }`}
                >
                  Próximo passo
                </th>
                {companies.map((company) => {
                  const eligible = canUsePaidConversion(company, 'quote');
                  return (
                    <td
                      key={company.id}
                      className={`border-r border-slate-200 p-2 sm:p-2.5 align-top ${
                        isFluid ? 'min-w-0' : 'min-w-[180px]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        {eligible && (
                          <QuoteCTA
                            context="comparison"
                            onRequest={() => onQuote(company)}
                          />
                        )}
                        <Link
                          href={`/companies/${company.slug || company.id}`}
                          className="w-full py-1 text-center text-[10px] sm:text-[11px] font-medium text-blue-700 hover:text-blue-800 hover:underline leading-tight min-w-0 break-words"
                        >
                          Ver perfil completo <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        {!isFluid && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/65 to-transparent md:hidden"
          />
        )}
      </div>
    </section>
  );
}

function TableGroup({
  group,
  companies,
  isFluid,
}: {
  group: Group;
  companies: CompareCompany[];
  isFluid: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = `comparison-group-${group.id}`;

  return (
    <>
      <tbody>
        <tr className="border-y border-slate-200/90 bg-slate-50/90">
          <th colSpan={companies.length + 1} className="p-0 text-left">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setIsOpen((current) => !current)}
              className="flex min-h-[42px] sm:min-h-[46px] w-full items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-left text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </th>
        </tr>
      </tbody>
      <tbody id={contentId} hidden={!isOpen}>
        {group.criteria.map((criterion) => (
          <tr key={criterion.label} className="border-b border-slate-100 last:border-b-0">
            <th
              scope="row"
              className={`border-r border-slate-200 bg-slate-50/70 p-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-600 break-words ${
                isFluid ? '' : 'sticky left-0 z-20'
              }`}
            >
              {criterion.label}
            </th>
            {companies.map((company) => (
              <td
                key={company.id}
                className={`border-r border-slate-100 p-2 sm:px-3 sm:py-2 text-left sm:text-center text-[11px] sm:text-xs text-slate-800 break-words ${
                  isFluid ? 'min-w-0' : 'min-w-[180px]'
                }`}
              >
                <DisplayValue value={criterion.value(company)} suffix={criterion.suffix} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}
