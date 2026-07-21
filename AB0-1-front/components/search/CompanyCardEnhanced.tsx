'use client';

import Link from 'next/link';
import { BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';
import { CompanyChatButton } from '@/components/company/CompanyChatButton';
import type { Company } from '@/lib/api';
import { buildCompanyPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

interface CompanyCardEnhancedProps {
  company: Company;
  favorite: boolean;
  onToggleFavorite: () => void;
}

export function CompanyCardEnhanced({
  company,
  favorite,
  onToggleFavorite,
}: CompanyCardEnhancedProps) {
  const verified = Boolean(
    company.verified || ['verified', 'premium'].includes(company.trust?.verification_status || '')
  );
  const rating = Number(
    company.reputation?.rating_avg ||
      company.average_rating ||
      company.rating_avg ||
      company.rating ||
      0
  );
  const reviewsCount = Number(
    company.reputation?.rating_count || company.reviews_count || company.total_reviews || 0
  );
  const services = (company.services_offered || company.project_types || [])
    .filter(Boolean)
    .slice(0, 3);
  const href = buildCompanyPath(company.slug, company.name, company.id);
  const p2pChatEnabled =
    company.p2p_chat_enabled === true ||
    (company as any)?.actions?.p2p_chat_enabled === true;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo logoUrl={company.logo_url} name={company.name} size="lg" />
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${company.name} dos favoritos`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <Link href={href} className="mt-3 hover:text-blue-700">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-950 inline-flex items-center gap-1">
          {company.name}
          {verified && <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0" />}
        </h3>
      </Link>
      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" />
        {[company.city, company.state].filter(Boolean).join(', ') || 'Localização não informada'}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {rating > 0 ? (
          <>
            <strong className="text-slate-800">{rating.toFixed(1)}</strong>
            <span className="text-slate-400">({reviewsCount})</span>
          </>
        ) : (
          <span className="text-slate-400">Sem avaliações</span>
        )}
      </div>

      <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
        {services.length > 0 ? (
          services.map((service) => (
            <span
              key={service}
              className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
            >
              {service}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400">Serviços não informados</span>
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link
          href={href}
          className="flex h-10 items-center justify-center rounded-lg border border-slate-300 text-xs font-bold text-slate-800 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          Ver perfil
        </Link>
        {p2pChatEnabled && (
          <CompanyChatButton companyId={company.id} companyName={company.name} variant="button" className="h-10 rounded-lg text-xs" />
        )}
        <ReviewCompanyButton
          company={company}
          className="col-span-2 h-10 rounded-lg text-xs"
        />
      </div>
    </article>
  );
}
