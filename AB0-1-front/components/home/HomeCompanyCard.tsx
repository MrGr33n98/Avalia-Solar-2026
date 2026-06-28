'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Building2, Clock3, MapPin, Scale, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Company } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { useComparison } from '@/hooks/useComparison';
import { getFullImageUrl } from '@/utils/image';

type HomeCompanyCardProps = {
  company: Company;
};

const getListCount = (value?: string | string[]): number => {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (!value) return 0;
  return value.split(',').map((item) => item.trim()).filter(Boolean).length;
};

export default function HomeCompanyCard({ company }: HomeCompanyCardProps) {
  const [logoError, setLogoError] = useState(false);
  const { isInComparison, toggleComparison, canAddMore } = useComparison();
  const selected = isInComparison(company.id);
  const companyPath = `/companies/${company.slug || company.id}`;
  const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
  const reviewCount = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
  const coverageCount = Math.max(
    getListCount(company.coverage_cities),
    getListCount(company.coverage_states)
  );
  const logoUrl = getFullImageUrl(company.logo_url || company.banner_url);
  const responseTime = company.response_time_sla || 'Prazo informado no contato';
  const matchReason = company.verified
    ? 'Perfil verificado e informações públicas para comparar com segurança.'
    : company.description || 'Conheça serviços, reputação e área de atendimento.';

  const handleCompare = () => {
    if (!selected && !canAddMore) return;
    toggleComparison(company);
    track(selected ? 'comparison_remove' : 'comparison_add', {
      company_id: company.id,
      company_name: company.name,
      source: 'home_recommended_companies',
    });
  };

  const handleQuote = () => {
    track('company_cta_clicked', {
      company_id: company.id,
      company_name: company.name,
      cta_type: 'quote_request',
      source: 'home_recommended_companies',
    });
    openQuoteWizard({ preferredCompanyId: company.id, source: 'home-recommended-company' });
  };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300">
      <div className="flex items-start justify-between gap-4">
        <div className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          {logoUrl && !logoError ? (
            <Image
              src={logoUrl}
              alt={`Logo da ${company.name}`}
              fill
              sizes="96px"
              className="object-contain p-2"
              onError={() => setLogoError(true)}
            />
          ) : (
            <Building2 className="h-7 w-7 text-slate-300" aria-hidden="true" />
          )}
        </div>

        {company.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verificada
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex-1">
        <Link href={companyPath} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <h3 className="line-clamp-2 text-lg font-black leading-tight tracking-tight text-slate-950 hover:text-blue-700">
            {company.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
          {rating > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-slate-800">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
              {reviewCount > 0 ? <span className="font-medium text-slate-500">({reviewCount})</span> : null}
            </span>
          ) : (
            <span className="font-medium text-slate-500">Nova na plataforma</span>
          )}
          {company.city || company.state ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              {[company.city, company.state].filter(Boolean).join(', ')}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{matchReason}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
          <div>
            <span className="block font-semibold text-slate-500">Resposta</span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-extrabold text-slate-900">
              {responseTime}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">Cobertura</span>
            <span className="mt-0.5 block font-extrabold text-slate-900">
              {coverageCount > 0 ? `${coverageCount} regiões` : 'Consulte a empresa'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCompare}
          disabled={!selected && !canAddMore}
          className={selected ? 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-slate-300 text-slate-700'}
        >
          <Scale className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {selected ? 'Selecionada' : 'Comparar'}
        </Button>

        {company.active_admin === true ? (
          <Button type="button" onClick={handleQuote} className="bg-blue-600 font-bold text-white hover:bg-blue-700">
            Pedir orçamento
          </Button>
        ) : (
          <Button asChild className="bg-blue-600 font-bold text-white hover:bg-blue-700">
            <Link href={companyPath}>Ver perfil</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
