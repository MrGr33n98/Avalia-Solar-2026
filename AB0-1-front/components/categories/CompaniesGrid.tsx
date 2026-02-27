'use client';

import { Skeleton } from '@/components/ui/skeleton';
import CompanyCardV2 from './CompanyCardV2';
import { Company } from '@/lib/api';

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">
          Nenhuma empresa encontrada com estes filtros
        </p>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Tente ajustar seus critérios de busca
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
