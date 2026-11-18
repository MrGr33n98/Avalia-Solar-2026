'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ChevronDown, MinusCircle, Star, X } from 'lucide-react';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import type { CompareCompany } from './mapCompanyToCompareCompany';
import { canUsePaidConversion } from '@/lib/feature-access';
import {
  availabilityLabel,
  companyWarrantyLabel,
  normalizeCommercialAvailability,
} from '@/lib/comparison/field-normalizers';

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
      { label: 'Nota geral', value: (company) => company.rating > 0 ? company.rating : null },
      { label: 'Total de avaliações', value: (company) => company.reviewsCount },
      { label: 'Recomendação', value: (company) => company.recommendationRate, suffix: '%' },
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
          const val = company.comparison_profile?.financing_availability ??
            (company.financing_enabled === true ? 'available' : null);
          const state = normalizeCommercialAvailability(val);
          return state === 'unknown' ? null : availabilityLabel(state, 'Disponível');
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
      {
        label: 'Garantia',
        value: (company) => companyWarrantyLabel(
          company.comparison_profile?.warranty_years ?? company.warrantyYears,
          company.comparison_profile?.warranty_confirmed ?? company.warranty_confirmed
        ),
      },
      {
        label: 'Suporte pós-venda',
        value: (company) => {
          const state = normalizeCommercialAvailability(
            company.comparison_profile?.after_sales_support ?? company.postSalesSupport
          );
          return state === 'unknown' ? null : availabilityLabel(state, 'Oferece suporte');
        },
      },
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
    return <span className="text-slate-400 font-normal">Não informado</span>;
  }
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> Sim
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <MinusCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> Não
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
        <p className="mb-2 flex items-center justify-end gap-1 text-xs font-semibold text-blue-700 md:hidden">
          Arraste para o lado para ver mais empresas <span aria-hidden="true">→</span>
        </p>
      )}
      <div className="relative min-w-0 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-none md:rounded-xl md:shadow-sm">
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
                ? 'w-full table-fixed border-collapse text-left max-md:block max-md:table-auto'
                : 'w-max min-w-full table-fixed border-collapse text-left max-md:block max-md:w-full max-md:table-auto'
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
            <colgroup className="max-md:hidden">
              <col
                className={
                  isFluid
                    ? companies.length === 2
                      ? 'w-[28%] sm:w-[28%] md:w-44'
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
                        ? 'w-[36%] sm:w-[36%] md:w-auto'
                        : 'w-[66%] sm:w-[70%] md:w-auto'
                      : 'w-[180px] md:w-auto'
                  }
                />
              ))}
            </colgroup>
            <thead className="max-md:block">
              <tr className={`border-b border-slate-200 align-top max-md:grid ${companies.length > 1 ? 'max-md:grid-cols-2' : 'max-md:grid-cols-1'}`}>
                <th
                  scope="col"
                  className={`border-r border-slate-200 bg-slate-50/90 p-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 align-top max-md:hidden ${
                    isFluid
                      ? 'w-[28%] sm:w-[28%] md:w-44'
                      : 'sticky left-0 z-30 w-32 md:w-44'
                  }`}
                >
                  Critério
                </th>
                {companies.map((company) => (
                  <th
                    key={company.id}
                    scope="col"
                    className={`min-w-0 border-r border-slate-200 bg-white p-3 align-top max-md:w-full max-md:border-r-0 max-md:p-2.5 ${
                      isFluid ? 'min-w-0' : 'min-w-[180px]'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5 min-w-0 w-full">
                      {/* Linha superior: Logo à esquerda, X à direita */}
                      <div className="flex items-center justify-between gap-1 w-full">
                        <CompanyLogo
                          logoUrl={company.logoUrl}
                          name={company.name}
                          size="custom"
                          badges={company.badges}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0 object-contain border border-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => onRemove(company.id)}
                          aria-label={`Remover ${company.name} da comparação`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors -mr-1 -mt-1"
                        >
                          <X className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Nome da empresa */}
                      <div className="min-w-0 w-full mt-1">
                        <div className="flex items-center gap-1 min-w-0 flex-wrap">
                          <Link
                            href={`/companies/${company.slug || company.id}`}
                            className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-blue-700 leading-snug break-words"
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
                        <span className="block truncate text-xs text-slate-500 mt-0.5">
                          {[company.city, company.state].filter(Boolean).join(', ') ||
                            'Local não informado'}
                        </span>
                      </div>

                      {/* Nota real com estrelas */}
                      {company.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mt-0.5">
                          <Star
                            className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0"
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
            <tbody className="max-md:block">
              <tr className={`border-t border-slate-200 bg-slate-50/50 align-top max-md:grid ${companies.length > 1 ? 'max-md:grid-cols-2' : 'max-md:grid-cols-1'}`}>
                <th
                  scope="row"
                  className={`border-r border-slate-200 bg-slate-50/90 p-3 text-xs font-bold text-slate-800 max-md:border-r-0 ${companies.length > 1 ? 'max-md:col-span-2' : ''} ${
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
                      className={`min-w-0 border-r border-slate-200 p-3 align-top max-md:border-r-0 max-md:p-2.5 ${
                        isFluid ? 'min-w-0' : 'min-w-[180px]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 w-full">
                        {eligible && (
                          <QuoteCTA
                            context="comparison"
                            onRequest={() => onQuote(company)}
                          />
                        )}
                        <Link
                          href={`/companies/${company.slug || company.id}`}
                          className="w-full py-1 text-center text-xs sm:text-[13px] font-semibold text-blue-700 hover:text-blue-800 hover:underline leading-tight min-w-0 break-words"
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
      <tbody className="max-md:block">
        <tr className="border-y border-slate-200/90 bg-slate-100/75 max-md:block">
          <th colSpan={companies.length + 1} className="p-0 text-left">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setIsOpen((current) => !current)}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3.5 py-2.5 sm:px-4 text-left text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </th>
        </tr>
      </tbody>
      <tbody id={contentId} hidden={!isOpen} className="max-md:block [&[hidden]]:hidden">
        {group.criteria.map((criterion) => (
          <tr key={criterion.label} className={`border-b border-slate-100 last:border-b-0 max-md:grid ${companies.length > 1 ? 'max-md:grid-cols-2' : 'max-md:grid-cols-1'}`}>
            <th
              scope="row"
              className={`border-r border-slate-200 bg-slate-50/70 p-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] font-medium text-slate-700 break-words max-md:border-r-0 max-md:bg-slate-50/90 max-md:px-3 max-md:py-2 ${companies.length > 1 ? 'max-md:col-span-2' : ''} ${
                isFluid ? '' : 'sticky left-0 z-20'
              }`}
            >
              {criterion.label}
            </th>
            {companies.map((company) => (
              <td
                key={company.id}
                className={`min-w-0 border-r border-slate-100 p-2.5 sm:px-4 sm:py-3 text-left sm:text-center text-xs sm:text-[13px] text-slate-800 break-words max-md:border-r-0 max-md:px-3 max-md:py-2.5 max-md:text-left ${
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
