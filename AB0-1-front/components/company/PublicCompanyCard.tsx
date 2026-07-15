import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Building2, MapPin, Star } from 'lucide-react';

import { buildCompanyPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';

export type PublicCompanyCardData = {
  id: number | string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  average_rating?: number | string | null;
  rating_avg?: number | string | null;
  rating?: number | string | null;
  rating_count?: number | string | null;
  reviews_count?: number | string | null;
  total_reviews?: number | string | null;
  verified?: boolean | null;
  city?: string | null;
  state?: string | null;
  response_time_sla?: string | null;
};

type PublicCompanyCardProps = {
  company: PublicCompanyCardData;
  rank?: number;
};

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PublicCompanyCard({ company, rank }: PublicCompanyCardProps) {
  const href = buildCompanyPath(company.slug, company.name, company.id);
  const rating = numberValue(company.average_rating ?? company.rating_avg ?? company.rating);
  const reviews = numberValue(company.rating_count ?? company.reviews_count ?? company.total_reviews);
  const location = [company.city, company.state].filter(Boolean).join(', ');
  const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Link
          href={href}
          className="relative flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
          aria-label={`Ver perfil de ${company.name}`}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo da empresa ${company.name}`}
              fill
              sizes="64px"
              className="object-contain p-2"
            />
          ) : (
            <Building2 className="h-6 w-6 text-slate-300" aria-hidden="true" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={href} className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950 transition group-hover:text-blue-700">
                {rank ? `${rank}. ` : null}
                {company.name}
              </h3>
            </Link>
            {company.verified ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                OK
              </span>
            ) : null}
          </div>

          {location ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avaliação</p>
          <div className="mt-1 flex items-center gap-1 font-bold text-slate-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {rating > 0 ? rating.toFixed(1) : 'Sem nota'}
          </div>
          <p className="mt-1 text-xs text-slate-500">{reviews > 0 ? `${reviews} avaliações` : 'Aguardando reviews'}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resposta</p>
          <p className="mt-1 font-bold text-slate-900">{company.response_time_sla || 'Consultar'}</p>
          <p className="mt-1 text-xs text-slate-500">Primeiro contato</p>
        </div>
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
      >
        Ver perfil
      </Link>
    </article>
  );
}
