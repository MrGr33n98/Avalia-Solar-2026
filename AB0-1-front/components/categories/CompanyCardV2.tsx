'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Building2 } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { track } from '@/lib/analytics/lazy';
import LeadCTA from './LeadCTA';
import { Company } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CompanyCardV2Props {
  company: Company;
  variant?: 'compact' | 'rich';
  category: string;
  onLeadModalOpen?: (company: Company) => void;
}

export default function CompanyCardV2({
  company,
  variant = 'compact',
  category,
  onLeadModalOpen,
}: CompanyCardV2Props) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = !imageError ? (company.logo_url || company.banner_url) : null;
  const imageHeight = variant === 'rich' ? 'h-[180px]' : 'h-[140px]';

  return (
    <div
      className={cn(
        'group flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-200 cursor-pointer h-full',
      )}
      onClick={() => {
        track('company_card_click', {
          company_id: company.id,
          company_name: company.name,
          category,
          placement: 'organic',
          variant,
        });
      }}
    >
      {/* Header Image */}
      <div className={cn('relative w-full shrink-0 bg-slate-50 overflow-hidden', imageHeight)}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={company.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Building2 className="w-10 h-10 text-slate-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Content */}
      <CardContent className="flex-grow p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm md:text-base font-black text-slate-950 line-clamp-2 uppercase tracking-tight">
            {company.name}
          </h3>
          {company.verified && (
            <PremiumBadge className="h-6" />
          )}
        </div>

        {/* Rating */}
        {(company.rating || company.rating_avg || company.average_rating) ? (
          <div className="flex items-center gap-2" aria-label={`Avaliação: ${Number(company.rating || company.rating_avg || company.average_rating || 0).toFixed(1)} de 5 estrelas`}>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={0} aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">
                {Number(company.rating || company.rating_avg || company.average_rating || 0).toFixed(1)}/5.0
              </span>
            </div>
            {company.rating_count && (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                ({company.rating_count} {company.rating_count === 1 ? 'avaliação' : 'avaliações'})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold">Sem avaliações</span>
          </div>
        )}
      </CardContent>

      {/* CTA */}
      <CardFooter className="p-5 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <LeadCTA
          company={company}
          category={category}
          variant={variant}
          onLeadModalOpen={onLeadModalOpen}
        />
      </CardFooter>
    </div>
  );
}
