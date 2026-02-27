'use client';

import CompanyCardV2 from './CompanyCardV2';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface TopRankingSectionProps {
  companies: Company[];
  category: string;
  onLeadModalOpen?: (company: Company) => void;
  onMethodologyClick?: () => void;
}

export default function TopRankingSection({
  companies,
  category,
  onLeadModalOpen,
  onMethodologyClick,
}: TopRankingSectionProps) {
  const topCompanies = companies.slice(0, 3);

  if (topCompanies.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 bg-gradient-to-br from-blue-50 to-slate-50 border-b border-slate-200">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              🏆 Top {topCompanies.length} desta Categoria
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Ranking baseado em avaliações verificadas e confiabilidade
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMethodologyClick}
            className="text-slate-600 hover:text-blue-600"
          >
            <Info className="w-4 h-4 mr-1" />
            Metodologia
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topCompanies.map((company, index) => (
            <div key={company.id} className="relative">
              {/* Rank Badge */}
              <div className="absolute -top-3 -left-2 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm ${
                    index === 0
                      ? 'bg-yellow-500 shadow-lg'
                      : index === 1
                        ? 'bg-slate-400'
                        : 'bg-amber-600'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Card - Rich Variant */}
              <CompanyCardV2
                company={company}
                variant="rich"
                category={category}
                onLeadModalOpen={onLeadModalOpen}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
