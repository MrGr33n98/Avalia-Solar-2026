'use client';

import CompanyCardV2 from './CompanyCardV2';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';

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
    <section className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
            🏆 Top {topCompanies.length} da Categoria
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Ranking baseado em confiabilidade
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMethodologyClick}
          className="text-slate-400 hover:text-blue-600 font-bold text-xs"
        >
          <Info className="w-4 h-4 mr-1" />
          MÉTODO
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topCompanies.map((company, index) => (
          <div key={company.id} className="relative">
            {/* Rank Badge */}
            <div className="absolute -top-3 -left-2 z-10">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                    : index === 1
                      ? 'bg-gradient-to-br from-slate-300 to-slate-400'
                      : 'bg-gradient-to-br from-orange-500 to-amber-700'
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
    </section>
  );
}
