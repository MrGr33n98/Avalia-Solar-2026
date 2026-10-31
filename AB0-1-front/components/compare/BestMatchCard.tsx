import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { getBestMatch } from './compare-insights';
import type { CompareCompany } from './mapCompanyToCompareCompany';
import { canUsePaidConversion } from '@/lib/feature-access';

interface BestMatchCardProps {
  companies: CompareCompany[];
  city?: string | null;
  onQuote: (company: CompareCompany) => void;
}

export default function BestMatchCard({ companies, city, onQuote }: BestMatchCardProps) {
  const company = getBestMatch(companies, city);
  if (!company) return null;

  const factorsText =
    company.matchFactors && company.matchFactors.length > 0
      ? company.matchFactors.join(' e ')
      : 'verificação e cobertura';

  return (
    <section
      className="flex flex-col gap-3.5 rounded-xl border border-amber-300/80 bg-amber-50/75 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-sm"
      aria-labelledby="best-match-title"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
          <Trophy className="h-5 w-5 fill-amber-500/20" aria-hidden="true" />
        </div>
        <div className="max-w-2xl min-w-0">
          <p
            id="best-match-title"
            className="text-sm sm:text-base font-bold text-slate-950"
          >
            Melhor match para sua comparação
          </p>
          <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-700">
            <strong className="font-bold text-slate-950">{company.name}</strong> parece ser a opção mais aderente com base
            nos dados disponíveis de {factorsText}.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <Button asChild size="sm" variant="outline" className="rounded-lg border-amber-300 bg-white hover:bg-amber-50 text-slate-900 font-semibold h-9 px-3.5">
          <Link href={`/companies/${company.slug || company.id}`}>Ver perfil</Link>
        </Button>
        {/* Botão de orçamento: apenas para empresas em plano pago */}
        {canUsePaidConversion(company, 'quote') && (
          <QuoteCTA context="comparison" onRequest={() => onQuote(company)} />
        )}
      </div>
    </section>
  );
}
