'use client';

import { Skeleton } from '@/components/ui/skeleton';
import CompanyCard from '@/components/CompanyCard';
import { Company } from '@/lib/api';

interface CompaniesGridProps {
  companies: Company[];
  loading?: boolean;
  category: string;
}

export default function CompaniesGrid({
  companies,
  loading = false,
  category,
}: CompaniesGridProps) {
  if (loading) {
    return (
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:px-0 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[150px] w-[168px] shrink-0 rounded-xl md:h-[180px] md:w-auto"
          />
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
        <p className="mt-2 text-xs font-medium text-slate-600">
          Tente ajustar seus critérios de busca
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
      {companies.map((company) => (
        <div key={company.id} className="w-[168px] shrink-0 snap-start md:w-auto">
          <CompanyCard company={company} compact={true} category={category} className="h-full" />
        </div>
      ))}
    </div>
  );
}
