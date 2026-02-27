'use client';

import CompanyCard from '@/components/CompanyCard';
import { Sparkles } from 'lucide-react';
import { Company } from '@/lib/api';

interface SponsoredSectionProps {
  companies: Company[];
  category: string;
}

export default function SponsoredSection({
  companies,
  category,
}: SponsoredSectionProps) {
  // Limitar a máximo 4 patrocinados
  const sponsoredCompanies = companies.slice(0, 4);

  if (sponsoredCompanies.length === 0) {
    return null;
  }

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
        <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
          Destaques Patrocinados
        </h2>
      </div>

      {/* Grid - 2-4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sponsoredCompanies.map((company) => (
          <div key={company.id} className="relative">
            {/* Card with premium styling - relying on CompanyCard built-in sponsored badge */}
            <div className="border border-amber-100 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md h-full">
              <CompanyCard
                company={{ ...company, sponsored: true } as Company}
                compact={true}
                category={category}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center opacity-70">
        Publicidade • O Ranking não é afetado
      </p>
    </section>
  );
}
