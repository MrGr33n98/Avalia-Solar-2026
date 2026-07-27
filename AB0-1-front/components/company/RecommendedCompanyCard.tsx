import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { BadgeCheck, Briefcase, Clock, Star, Megaphone } from 'lucide-react';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Company } from '@/lib/api';
import type { RecommendationItem, RecommendationMeta } from '@/lib/api-public';
import { buildCompanyPath } from '@/lib/slug';
import {
  trackRecommendedCompanyImpression,
  trackRecommendedPrimaryCtaClicked,
} from '@/lib/analytics/recommendations';

type RecommendedCompanyCardProps = {
  company: RecommendationItem;
  meta?: RecommendationMeta | null;
};

export default function RecommendedCompanyCard({ company, meta }: RecommendedCompanyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || impressionTracked.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            impressionTracked.current = true;
            trackRecommendedCompanyImpression(company, meta);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [company, meta]);

  const href = company.primary_cta?.url || buildCompanyPath(company.slug, company.name, company.id);

  const comparisonCompany = {
    id: company.id,
    name: company.name,
    slug: company.slug || String(company.id),
    city: '',
    state: '',
    status: 'active',
    verified: Boolean(company.verified),
    category: company.segment || '',
    description: '',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
  } as Company;

  const isSponsored = Boolean(company.sponsored);
  const ratingAvg = company.rating?.average;
  const ratingCount = company.rating?.count ?? 0;

  const responseLabel = company.response_time?.value || company.response_time?.label || 'Tempo de resposta não informado';
  const projectsLabel = company.projects?.count ? `${company.projects.count}` : (company.projects?.label || 'Não informado');

  const primaryCtaText = company.primary_cta?.label || 'Avaliar essa empresa';
  const primaryCtaUrl = company.primary_cta?.url || href;

  return (
    <article
      ref={cardRef}
      className={`group relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isSponsored ? 'border-amber-200 bg-gradient-to-b from-amber-50/20 via-white to-white' : 'border-slate-200 hover:border-blue-200'
      }`}
    >
      {/* Header: Logo + Title + Verified + Location */}
      <div className="flex items-start gap-3.5">
        <Link href={primaryCtaUrl} className="shrink-0" aria-label={`Ver perfil de ${company.name}`}>
          <CompanyLogo
            logoUrl={company.logo_url}
            name={company.name}
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={primaryCtaUrl} className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-950 transition group-hover:text-blue-700">
                {company.name}
              </h3>
            </Link>
            {company.verified && (
              <BadgeCheck className="h-4.5 w-4.5 fill-blue-600 text-white shrink-0" aria-label="Perfil Verificado" />
            )}
            {isSponsored && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                <Megaphone className="h-2.5 w-2.5" aria-hidden="true" />
                Patrocinado
              </span>
            )}
          </div>

</div>
      </div>

      {/* 3 Metric Columns: Avaliação | Resposta Média | Projetos */}
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className={ratingAvg && ratingAvg > 0 ? '' : 'text-[11px] font-semibold text-slate-500'}>
              {ratingAvg && ratingAvg > 0 ? ratingAvg.toFixed(1).replace('.', ',') : 'Sem avaliações'}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">
            {ratingCount > 0 ? `Avaliação (${ratingCount})` : 'Avaliação'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span className={company.response_time?.value ? '' : 'text-[10px] font-semibold text-slate-500'}>
              {responseLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">Resposta média</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span className={company.projects?.count ? '' : 'text-[11px] font-semibold text-slate-500'}>
              {projectsLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">Projetos</p>
        </div>
      </div>

      {/* Bottom Actions: 2 Buttons (Comparar e CTA Dinâmico) */}
      <div className="mt-auto pt-5 grid grid-cols-2 gap-2.5">
        <ComparisonToggleButton
          company={comparisonCompany}
          variant="card"
          size="sm"
          className="h-11 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-none hover:bg-slate-50"
          animated={false}
        />
        <Link
          href={primaryCtaUrl}
          onClick={() => trackRecommendedPrimaryCtaClicked(company, meta)}
          className="inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-xl border border-blue-600 bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {primaryCtaText}
        </Link>
      </div>
    </article>
  );
}
