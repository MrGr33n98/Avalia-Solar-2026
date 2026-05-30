"use client";

import { Calendar, Package, MessageSquare, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Company } from "@/lib/api";

interface CompanyHighlightsGridProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
    productCount: number;
    yearsInBusiness: number;
  };
}

export default function CompanyHighlightsGrid({ company, companyStats }: CompanyHighlightsGridProps) {
  // Cálculo resiliente dos anos de atuação
  const currentYear = new Date().getFullYear();
  const foundedYear = company.founded_year;
  let yearsInBusiness = companyStats.yearsInBusiness;

  if (foundedYear && foundedYear > 0 && foundedYear <= currentYear) {
    yearsInBusiness = currentYear - foundedYear;
  }

  // Garantir pelo menos 1 ano de atuação se founded_year for o ano corrente ou próximo
  const yearsText = yearsInBusiness > 0 ? `${yearsInBusiness} ${yearsInBusiness === 1 ? 'ano' : 'anos'}` : "1 ano";

  const metrics = [
    {
      label: "Tempo de mercado",
      value: yearsText,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Soluções cadastradas",
      value: `${companyStats.productCount || 0}`,
      icon: Package,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Avaliações publicadas",
      value: `${companyStats.reviewCount || 0}`,
      icon: MessageSquare,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Nota média",
      value: companyStats.rating && companyStats.rating !== "0.0" ? companyStats.rating : "Novo",
      icon: Star,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 w-full">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <Card
            key={idx}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5"
          >
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {metric.label}
                </p>
                <div className={`p-2 rounded-xl border ${metric.color} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
