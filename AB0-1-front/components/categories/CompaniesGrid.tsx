'use client';

import { Skeleton } from '@/components/ui/skeleton';
import CompanyCardV2 from './CompanyCardV2';

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

interface CompaniesGridProps {
  companies: Company[];
  loading?: boolean;
  category: string;
  onLeadModalOpen?: (company: Company) => void;
}

export default function CompaniesGrid({
  companies,
  loading = false,
  category,
  onLeadModalOpen,
}: CompaniesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-500 font-medium">
          Nenhuma empresa encontrada com estes filtros
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <CompanyCardV2
          key={company.id}
          company={company}
          category={category}
          variant="compact"
          onLeadModalOpen={onLeadModalOpen}
        />
      ))}
    </div>
  );
}
