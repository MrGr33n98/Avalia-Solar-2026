'use client';

import Link from 'next/link';
import { BadgeCheck, Briefcase, Clock, MapPin, Star } from 'lucide-react';

import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyChatButton } from '@/components/company/CompanyChatButton';
import type { Company } from '@/lib/api';
import { buildCompanyPath } from '@/lib/slug';

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
  projects_count?: number | string | null;
  project_count?: number | string | null;
  projects?: number | string | null;
  badges?: Array<{ image_url?: string | null; name?: string | null }> | null;
  p2p_chat_enabled?: boolean | null;
  actions?: { p2p_chat_enabled?: boolean } | null;
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
  const companyId = numberValue(company.id);
  const rating = numberValue(company.average_rating ?? company.rating_avg ?? company.rating);
  const location = [company.city, company.state].filter(Boolean).join(', ');

  const projectsCount = numberValue(
    company.projects_count ?? company.project_count ?? company.projects
  );

  const comparisonCompany = {
    ...company,
    id: companyId,
    slug: company.slug || String(company.id),
    city: company.city || '',
    state: company.state || '',
    status: 'active',
    verified: Boolean(company.verified),
    category: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
  } as Company;

  const p2pChatEnabled =
    company.p2p_chat_enabled === true ||
    (company as any)?.actions?.p2p_chat_enabled === true;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Header: Logo + Title + Verified + Location */}
      <div className="flex items-center gap-3.5">
        <Link href={href} className="shrink-0" aria-label={`Ver perfil de ${company.name}`}>
          <CompanyLogo
            logoUrl={company.logo_url}
            name={company.name}
            size="md"
            badges={company.badges}
            verifiedBadgeUrl={(company as any).verified_badge_image_url || (company as any).verified_badge_url}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={href} className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-950 transition group-hover:text-blue-700">
                {rank ? `${rank}. ` : null}
                {company.name}
              </h3>
            </Link>
            {company.verified && (
              <BadgeCheck className="h-4.5 w-4.5 fill-blue-600 text-white shrink-0" aria-hidden="true" />
            )}
          </div>

          {location ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* 3 Metric Columns: Avaliação | Resposta Média | Projetos */}
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span>{rating > 0 ? rating.toFixed(1).replace('.', ',') : '4,5'}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Avaliação</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>{company.response_time_sla || '24h'}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Resposta média</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>{projectsCount > 0 ? projectsCount : '96'}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Projetos</p>
        </div>
      </div>

      {/* Bottom Actions: 2 Buttons (Comparar e Chat/Perfil) */}
      <div className="mt-auto pt-5 grid grid-cols-2 gap-2.5">
        <ComparisonToggleButton
          company={comparisonCompany}
          variant="card"
          size="sm"
          className="h-10 w-full rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-none hover:bg-slate-50"
          animated={false}
        />
        {p2pChatEnabled ? (
          <CompanyChatButton
            companyId={company.id}
            companyName={company.name}
            variant="button"
            className="h-10 w-full rounded-xl text-xs"
          />
        ) : (
          <Link
            href={href}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Ver perfil
          </Link>
        )}
      </div>
    </article>
  );
}
