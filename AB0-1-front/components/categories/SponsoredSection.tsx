'use client';

import CompanyCardV2 from './CompanyCardV2';
import { Sparkles } from 'lucide-react';

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
    <section className="py-8 px-4 bg-white border-b border-slate-200">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black text-slate-950">
            Destaques Patrocinados
          </h2>
        </div>

        {/* Grid - 2-4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {sponsoredCompanies.map((company) => (
            <div key={company.id} className="relative">
              {/* Sponsored Badge */}
              <div className="absolute top-2 right-2 z-10">
                <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-bold border border-amber-200">
                  <Sparkles className="w-3 h-3" />
                  Patrocinado
                </div>
              </div>

              {/* Card with premium styling */}
              <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
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
        <p className="text-xs text-slate-500 mt-4 text-center">
          Empresas patrocinadas recebem destaque especial. Ranking não é afetado.
        </p>
      </div>
    </section>
  );
}
