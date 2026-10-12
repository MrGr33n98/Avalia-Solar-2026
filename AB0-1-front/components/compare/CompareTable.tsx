'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ChevronDown, MinusCircle, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { CompanyLogo } from '@/components/CompanyLogo';
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
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                      ? 'w-[30%] sm:w-[28%] md:w-44'
                      : 'w-[36%] md:w-44'
                    : 'w-32 md:w-44'
                }
              />
              {companies.map((company) => (
                <col
                  key={company.id}
                  className={
                    isFluid
                      ? companies.length === 2
                        ? 'w-[35%] sm:w-[36%] md:w-auto'
                        : 'w-[64%] md:w-auto'
                      : 'w-[180px] md:w-auto'
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 align-top">
                <th
                  scope="col"
                  className={`border-r border-slate-200 bg-slate-50 p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-slate-500 ${
                    isFluid
                      ? 'w-[30%] sm:w-[28%] md:w-44'
                      : 'sticky left-0 z-30 w-32 md:w-44'
                  }`}
                >
                  Critério
                </th>
                {companies.map((company, index) => (
                  <th
                    key={company.id}
                    scope="col"
                    className={`relative border-r border-slate-200 p-2 sm:p-3 md:p-4 ${
                      isFluid ? 'min-w-0' : 'min-w-[180px]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onRemove(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="absolute right-1 top-1 sm:right-2 sm:top-2 rounded-md border border-slate-200/80 p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <div className="flex flex-col gap-1.5 pr-4 sm:pr-6">
                      <div className="flex items-center gap-2">
                        <CompanyLogo
                          logoUrl={company.logoUrl}
                          name={company.name}
                          size="sm"
                          badges={company.badges}
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/companies/${company.slug || company.id}`}
                            className="block truncate text-xs sm:text-sm font-black text-slate-950 hover:text-blue-700"
                          >
                            {company.name}
                          </Link>
                          <span className="block truncate text-[10px] sm:text-xs text-slate-500">
                            {[company.city, company.state].filter(Boolean).join(', ') ||
                              'Local não informado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {company.verified && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                            Verificada
                          </span>
                        )}
                        {company.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                            <Star
                              className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                              aria-hidden="true"
                            />
                            {company.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
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
              <tr className="border-t border-slate-200 bg-slate-50/70 align-top">
                <th
                  scope="row"
                  className={`border-r border-slate-200 bg-slate-50 p-2 sm:p-3 text-[11px] sm:text-xs font-semibold text-slate-700 md:p-4 ${
                    isFluid ? '' : 'sticky left-0 z-20'
                  }`}
                >
                  Próximo passo
                </th>
                {companies.map((company) => (
                  <td
                    key={company.id}
                    className={`border-l border-slate-200 p-2 sm:p-3 align-top ${
                      isFluid ? 'min-w-0' : 'min-w-[180px]'
                    }`}
                  >
                    {/* Botão de orçamento: apenas para empresas em plano pago */}
                    {canUsePaidConversion(company, 'quote') && (
                      <QuoteCTA context="comparison" onRequest={() => onQuote(company)} />
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className={`mt-1 w-full text-[11px] sm:text-xs text-blue-700 hover:bg-blue-50 ${
                        canUsePaidConversion(company, 'quote') ? '' : 'col-span-2'
                      }`}
                    >
                      <Link href={`/companies/${company.slug || company.id}`}>
                        Ver perfil completo
                      </Link>
                    </Button>
                  </td>
                ))}
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
        <tr className="border-y border-slate-200 bg-blue-50/60 md:bg-slate-50">
          <th colSpan={companies.length + 1} className="p-0 text-left">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setIsOpen((current) => !current)}
              className="flex min-h-8 sm:min-h-10 w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-blue-900 transition-colors hover:bg-blue-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:px-4"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
              className={`border-r border-slate-200 bg-slate-50/80 p-2 text-[11px] sm:text-xs font-medium text-slate-700 sm:px-3 sm:py-2.5 md:px-4 ${
                isFluid ? 'break-words' : 'sticky left-0 z-20 break-words'
              }`}
            >
              {criterion.label}
            </th>
            {companies.map((company) => (
              <td
                key={company.id}
                className={`border-r border-slate-100 p-2 text-left text-[11px] sm:text-xs text-slate-700 break-words sm:px-3 sm:py-2.5 sm:text-center ${
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
