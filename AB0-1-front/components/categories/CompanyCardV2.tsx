'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Building2 } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import LeadCTA from './LeadCTA';

interface Company {
  id: number;
  name: string;
  logo_url?: string;
  banner_url?: string;
  rating?: number;
  rating_count?: number;
  verified?: boolean;
  segment?: string;
  direct_lead_enabled?: boolean;
  direct_lead_url?: string;
}

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
  const height = variant === 'rich' ? 'h-[180px]' : 'h-[120px]';

  return (
    <article
      className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300 border-slate-200 border rounded-lg"
      aria-label={`${company.name}, avaliação ${company.rating || 'sem'}. Clique para solicitar orçamento`}
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
      {/* Image 1:1 (quadrado) */}
      <div className={`relative ${height} bg-slate-100 overflow-hidden`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Logo de ${company.name}`}
            fill
            className="object-contain p-4"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <Building2 className="w-12 h-12 text-slate-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex-grow p-2 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-xs md:text-sm font-bold text-slate-950 line-clamp-2">
            {company.name}
          </h3>
          {company.verified && (
            <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold whitespace-nowrap" aria-label="Empresa verificada">
              ✓
            </Badge>
          )}
        </div>

        {variant === 'rich' && company.segment && (
          <p className="text-xs text-slate-600 font-medium">{company.segment}</p>
        )}

        {/* Rating */}
        {company.rating && (
          <div className="flex items-center gap-1 text-xs" aria-label={`Avaliação: ${company.rating.toFixed(1)} de 5 estrelas`}>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-900">
                {company.rating.toFixed(1)}
              </span>
            </div>
            {company.rating_count && (
              <span className="text-xs text-slate-500">
                ({company.rating_count})
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* CTA */}
      <CardFooter className="p-2 bg-slate-50 border-t border-slate-100">
        <LeadCTA
          company={company}
          category={category}
          placement="card"
          onLeadModalOpen={onLeadModalOpen}
        />
      </CardFooter>
    </article>
  );
}
