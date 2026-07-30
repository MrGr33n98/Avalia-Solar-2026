'use client';

import Link from 'next/link';
import { Star, MapPin, Clock, FileText, CheckCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Company } from '@/lib/api';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { cn } from '@/lib/utils';
import { buildCompanyPath } from '@/lib/slug';

interface SearchCompanyListCardProps {
  company: Company;
  className?: string;
}

export function SearchCompanyListCard({ company, className }: SearchCompanyListCardProps) {
  const rating = Number(company.rating_avg || company.average_rating || company.rating || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '0.0';
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const href = buildCompanyPath(company);
  const reviewsHref = `${href}#avaliacoes`;

  const location = [company.city, company.state].filter(Boolean).join(', ');
  const description = company.description || company.about || 'Especialista em soluções de energia solar e eficiência energética.';
  const slaLabel = (company as any).operations?.sla_label || (company as any).response_time_sla || '24h';
  const coverageLabel = 'Consulte'; // Could map from API if available

  return (
    <article
      className={cn(
        "flex flex-col lg:flex-row items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300",
        className
      )}
    >
      {/* Left Column: Logo & Info */}
      <div className="flex w-full lg:w-[28%] flex-col justify-center p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
        <div className="flex items-center gap-4">
          <Link href={href} className="shrink-0">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={company.name}
              size="lg"
              badges={company.badges}
              verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
              className="border border-slate-100 bg-white shadow-sm"
            />
          </Link>
          <div className="min-w-0">
            <Link href={href}>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg hover:text-blue-700 transition-colors line-clamp-1">
                {company.name}
              </h3>
            </Link>
            
            <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                {ratingLabel}
              </span>
              <span className="text-slate-300">|</span>
              <span>{reviewCount} aval.</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{location || 'Brasil'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column 1: Description & Quick Features */}
      <div className="flex flex-1 flex-col justify-center p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Todo o Brasil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Resp: {slaLabel}</span>
          </div>
        </div>
      </div>

      {/* Middle Column 2: Stats (Respostas / Cobertura) */}
      <div className="hidden lg:flex w-[120px] flex-col justify-center items-center gap-4 p-5 border-r border-slate-100 text-center bg-slate-50/30">
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Respostas
          </span>
          <span className="font-bold text-slate-900 text-sm">
            {slaLabel}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Cobertura
          </span>
          <span className="font-bold text-slate-900 text-sm">
            {coverageLabel}
          </span>
        </div>
      </div>

      {/* Middle Column 3: Secondary Actions */}
      <div className="hidden lg:flex flex-col justify-center gap-2 p-4 border-r border-slate-100 w-[140px]">
        <ComparisonToggleButton 
          company={company as any} 
          variant="default"
          className="w-full h-8 text-[11px] rounded-lg"
        />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full h-8 rounded-lg text-[11px] font-bold border-slate-200 text-blue-600 hover:bg-slate-50 shadow-none gap-1.5"
        >
          <Link href={reviewsHref}>
            <Star className="w-3.5 h-3.5 fill-blue-600" />
            Avaliar
          </Link>
        </Button>
      </div>

      {/* Right Column: Primary CTA */}
      <div className="flex w-full lg:w-[180px] flex-col justify-center p-5 bg-slate-50/50">
        
        {/* Mobile secondary actions (visible only on small screens) */}
        <div className="flex lg:hidden gap-2 mb-3">
          <ComparisonToggleButton 
            company={company as any} 
            variant="default"
            className="flex-1 h-9 text-xs rounded-xl"
          />
          <Button
            asChild
            variant="outline"
            className="flex-1 h-9 rounded-xl text-xs font-bold border-slate-200 text-blue-600 hover:bg-slate-50 shadow-none gap-1.5"
          >
            <Link href={reviewsHref}>
              <Star className="w-3.5 h-3.5 fill-blue-600" />
              Avaliar
            </Link>
          </Button>
        </div>

        <Button
          asChild
          className="w-full h-11 lg:h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-none gap-1.5 transition-all"
        >
          <Link href={reviewsHref}>
            Ver avaliações {reviewCount} <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
