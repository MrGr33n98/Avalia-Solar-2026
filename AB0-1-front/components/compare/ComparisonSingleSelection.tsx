'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { COMPARISON_LIMITS } from '@/lib/comparison/config';

interface SelectedCompany {
  id: number;
  slug?: string;
  name: string;
  city?: string;
  state?: string;
  logo_url?: string | null;
}

interface Props {
  company: SelectedCompany;
  onAddCompany: () => void;
  onRemoveCompany: (id: number) => void;
  onViewProfile: () => void;
}

/** S1: selecting a company is not yet a side-by-side comparison. */
export default function ComparisonSingleSelection({
  company,
  onAddCompany,
  onRemoveCompany,
  onViewProfile,
}: Props) {
  const location = [company.city, company.state].filter(Boolean).join(', ');
  const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;

  return (
    <section
      aria-label="Uma empresa selecionada"
      data-testid="comparison-single-selection"
      className="flex min-h-0 flex-col gap-4 overflow-y-auto px-3 py-4 md:px-6 md:py-6"
    >
      <p className="text-[13px] leading-5 text-slate-600 md:text-sm">
        Você selecionou uma empresa. Escolha mais uma para comparar os mesmos critérios lado a lado.
      </p>

      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1.5"
            />
          ) : (
            <span aria-hidden="true" className="text-sm font-bold text-slate-500">
              {company.name.trim().slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-900">
            {company.name}
          </p>
          <p className="mt-0.5 truncate text-xs leading-4 text-slate-500">
            {location || 'Localização não informada'}
          </p>
          <p className="mt-1 text-xs font-medium text-blue-700">
            <span className="md:hidden">1 de {COMPARISON_LIMITS.mobile} selecionadas</span>
            <span className="hidden md:inline">1 de {COMPARISON_LIMITS.desktop} selecionadas</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemoveCompany(company.id)}
          aria-label={`Remover ${company.name} da comparação`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-4 text-center">
        <p className="text-sm font-semibold text-slate-900">Falta uma empresa para comparar</p>
        <p className="mx-auto mt-1 max-w-[320px] text-xs leading-5 text-slate-600">
          Compare atendimento, reputação, serviços, financiamento e condições de suporte.
        </p>
        <button
          type="button"
          onClick={onAddCompany}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar outra empresa
        </button>
      </div>

      <Link
        href={`/companies/${company.slug || company.id}`}
        onClick={onViewProfile}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Ver perfil da empresa
      </Link>
    </section>
  );
}
