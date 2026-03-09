'use client';

import { Company } from '@/lib/api';
import TopCompanyCard from './TopCompanyCard';
import { cn } from '@/lib/utils';

interface Props {
  companies: Company[];
  title?: string;
  className?: string;
}

export default function TopCompaniesGrid({ companies, title = "Top Empresas da Região", className }: Props) {
  if (!companies || companies.length === 0) return null;

  return (
    <div className={cn("w-full py-6 px-4 md:px-0", className)}>
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-1 bg-[#004791] rounded-full" />
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
          {title}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-fr items-stretch">
        {companies.slice(0, 3).map((company, index) => (
          <TopCompanyCard 
            key={company.id} 
            company={company} 
            rank={index + 1} 
          />
        ))}
      </div>
    </div>
  );
}
