'use client';

import Link from 'next/link';
import { CheckCircle2, MinusCircle, Star, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
    <section aria-labelledby="comparison-table-title">
      <h2 id="comparison-table-title" className="text-lg font-black text-slate-950">
        Comparação lado a lado
      </h2>
      <p className="mt-1 text-sm text-slate-500">{companies.length} de 3 empresas selecionadas</p>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <caption className="sr-only">Critérios das empresas selecionadas para comparação</caption>
          <thead>
            <tr className="border-b border-slate-200 align-top">
              <th
                scope="col"
                className="w-40 bg-slate-50 p-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Critério
              </th>
              {companies.map((company) => (
                <th key={company.id} scope="col" className="relative border-l border-slate-200 p-4">
                  <button
                    type="button"
                    onClick={() => onRemove(company.id)}
                    aria-label={`Remover ${company.name} da comparação`}
                    className="absolute right-2 top-2 rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <div className="flex items-center gap-3 pr-7">
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
          <tbody>
            {groups.map((group) => (
              <TableGroup key={group.id} group={group} companies={companies} />
            ))}
            <tr className="border-t border-slate-200 bg-slate-50/70 align-top">
              <th scope="row" className="p-4 text-xs font-bold text-slate-700">
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

      <Accordion
        type="multiple"
        defaultValue={groups.map((group) => group.id)}
        className="mt-4 rounded-xl border border-slate-200 bg-white px-4 shadow-sm md:hidden"
      >
        {groups.map((group) => (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger className="text-sm font-black text-slate-900 hover:no-underline">
              {group.label}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {group.criteria.map((criterion) => (
                  <div key={criterion.label}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      {criterion.label}
                    </p>
                    <div className="grid gap-2">
                      {companies.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                        >
                          <span className="truncate font-bold text-slate-800">{company.name}</span>
                          <span className="text-right text-slate-700">
                            <DisplayValue
                              value={criterion.value(company)}
                              suffix={criterion.suffix}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-4 grid gap-3 md:hidden">
        {companies.map((company) => (
          <div key={company.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-black text-slate-900">{company.name}</span>
              <button
                type="button"
                onClick={() => onRemove(company.id)}
                aria-label={`Remover ${company.name} da comparação`}
                className="p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button className="mt-3 w-full" size="sm" onClick={() => onQuote(company)}>
              Solicitar orçamento
            </Button>
            <Button asChild className="mt-1 w-full" size="sm" variant="ghost">
              <Link href={`/companies/${company.slug || company.id}`}>Ver perfil completo</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TableGroup({ group, companies }: { group: Group; companies: CompareCompany[] }) {
  return (
    <>
      <tr className="border-y border-slate-200 bg-slate-50">
        <th
          colSpan={companies.length + 1}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600"
        >
          {group.label}
        </th>
      </tr>
      {group.criteria.map((criterion) => (
        <tr key={criterion.label} className="border-b border-slate-100 last:border-b-0">
          <th scope="row" className="bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-700">
            {criterion.label}
          </th>
          {companies.map((company) => (
            <td
              key={company.id}
              className="border-l border-slate-100 px-4 py-2.5 text-center text-xs text-slate-700"
            >
              <DisplayValue value={criterion.value(company)} suffix={criterion.suffix} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
