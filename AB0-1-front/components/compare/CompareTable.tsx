'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ChevronDown, MinusCircle, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { CompareCompany } from './mapCompanyToCompareCompany';

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
    label: 'Atendimento',
    criteria: [
      { label: 'Responde avaliações', value: (company) => company.respondsToReviews },
      { label: 'Tempo médio de resposta', value: (company) => company.responseTimeLabel },
      { label: 'Orçamento gratuito', value: (company) => company.freeQuoteAvailable },
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
    label: 'Comercial',
    criteria: [
      {
        label: 'Financiamento',
        value: (company) =>
          company.financing_enabled === undefined ? null : Boolean(company.financing_enabled),
      },
      {
        label: 'Formas de pagamento',
        value: (company) => company.paymentMethods.join(', ') || null,
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
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Sim
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <MinusCircle className="h-4 w-4" aria-hidden="true" /> Não
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
  return (
    <section aria-label="Tabela de comparação lado a lado">
      <p className="mb-2 flex items-center justify-end gap-1 text-[11px] font-medium text-blue-700 md:hidden">
        Arraste para o lado para ver mais empresas <span aria-hidden="true">→</span>
      </p>
      <div className="relative overflow-hidden border border-slate-200 bg-white">
        <div className="w-full touch-auto snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth">
          <table
            className="table-fixed border-collapse text-left"
            style={{ minWidth: `${120 + Math.max(companies.length, 1) * 200}px`, width: '100%' }}
          >
            <caption className="sr-only">
              Critérios das empresas selecionadas para comparação
            </caption>
            <colgroup>
              <col className="w-[120px] md:w-40" />
              {companies.map((company) => (
                <col key={company.id} className="w-[200px] md:w-auto" />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 align-top">
                <th
                  scope="col"
                  className="sticky left-0 z-30 w-[120px] border-r border-slate-200 bg-slate-50 p-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:w-40 md:p-4"
                >
                  Critério
                </th>
                {companies.map((company, index) => (
                  <th
                    key={company.id}
                    scope="col"
                    className="relative min-w-[200px] border-r border-slate-200 p-3 md:p-4"
                  >
                    <span className="mb-2 inline-flex bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-700">
                      Empresa {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(company.id)}
                      aria-label={`Remover ${company.name} da comparação`}
                      className="absolute right-2 top-2 rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-2 pr-7 md:gap-3">
                      <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/companies/${company.slug || company.id}`}
                          className="block truncate text-sm font-black text-slate-950 hover:text-blue-700"
                        >
                          {company.name}
                        </Link>
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                          {company.rating > 0 ? company.rating.toFixed(1) : 'Sem nota'}
                          <Star
                            className="h-3 w-3 fill-amber-400 text-amber-400"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="ml-1 text-[10px] font-normal text-slate-500">
                          ({company.reviewsCount}{' '}
                          {company.reviewsCount === 1 ? 'avaliação' : 'avaliações'})
                        </span>
                        {company.verified && (
                          <span className="ml-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                            Verificada
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <TableGroup key={group.id} group={group} companies={companies} />
            ))}
            <tbody>
              <tr className="border-t border-slate-200 bg-slate-50/70 align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 md:p-4"
                >
                  Próximo passo
                </th>
                {companies.map((company) => (
                  <td key={company.id} className="border-l border-slate-200 p-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onQuote(company)}
                      aria-label={`Solicitar orçamento da ${company.name}`}
                    >
                      Solicitar orçamento
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="mt-1 w-full text-blue-700">
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/65 to-transparent md:hidden"
        />
      </div>
    </section>
  );
}

function TableGroup({ group, companies }: { group: Group; companies: CompareCompany[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = `comparison-group-${group.id}`;

  return (
    <>
      <tbody>
        <tr className="border-y border-slate-200 bg-slate-50">
          <th colSpan={companies.length + 1} className="p-0 text-left">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setIsOpen((current) => !current)}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 md:px-4"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
              className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-700 md:px-4 md:py-2.5"
            >
              {criterion.label}
            </th>
            {companies.map((company) => (
              <td
                key={company.id}
                className="min-w-[200px] border-r border-slate-100 px-3 py-3 text-left text-xs text-slate-700 md:px-4 md:py-2.5 md:text-center"
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
