'use client';

import CompanyCard from '@/components/CompanyCard';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';

interface TopRankingSectionProps {
  companies: Company[];
  category: string;
  onMethodologyClick?: () => void;
}

export default function TopRankingSection({
  companies,
  category,
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
            {/* Card - Rich Variant (compact=false) */}
            <CompanyCard
              company={company}
              compact={false}
              rank={index + 1}
              category={category}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
