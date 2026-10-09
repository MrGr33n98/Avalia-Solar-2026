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
      className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4"
      aria-labelledby="best-match-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Trophy className="h-5 w-5 fill-amber-500/20" aria-hidden="true" />
        </div>
        <div className="max-w-2xl min-w-0">
          <p
            id="best-match-title"
            className="text-sm font-bold text-slate-950 sm:text-base"
          >
            Melhor match para sua comparação
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
            <strong className="font-bold text-slate-900">{company.name}</strong> parece ser a opção mais aderente com base
            nos dados disponíveis de {factorsText}.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <Button asChild size="sm" variant="outline" className="rounded-lg border-amber-300/80 bg-white hover:bg-amber-50">
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
