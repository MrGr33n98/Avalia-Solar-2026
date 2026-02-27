'use client';

import CompanyCardV2 from './CompanyCardV2';
import { Sparkles } from 'lucide-react';
import { Company } from '@/lib/api';

interface SponsoredSectionProps {
  companies: Company[];
  category: string;
  onLeadModalOpen?: (company: Company) => void;
}

export default function SponsoredSection({
  companies,
  category,
  onLeadModalOpen,
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
            {/* Sponsored Badge */}
            <div className="absolute top-2 right-2 z-10">
              <div className="inline-flex items-center gap-1 bg-amber-100/90 backdrop-blur-sm text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                Patrocinado
              </div>
            </div>

            {/* Card with premium styling */}
            <div className="border border-amber-100 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <CompanyCardV2
                company={company}
                variant="compact"
                category={category}
                onLeadModalOpen={onLeadModalOpen}
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
