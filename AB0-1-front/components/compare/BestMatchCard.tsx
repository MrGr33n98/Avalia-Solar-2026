import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { getBestMatch } from './compare-insights';
import type { CompareCompany } from './mapCompanyToCompareCompany';

interface BestMatchCardProps {
  companies: CompareCompany[];
  city?: string | null;
  onQuote: (company: CompareCompany) => void;
}

export default function BestMatchCard({ companies, city, onQuote }: BestMatchCardProps) {
  const company = getBestMatch(companies, city);
  if (!company) return null;

  return (
    <section
      className="flex flex-col gap-3 rounded-none border border-blue-100 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="best-match-title"
    >
      <div className="max-w-2xl">
        <p
          id="best-match-title"
          className="flex items-center gap-2 text-sm font-semibold text-blue-950"
        >
          <Sparkles className="h-4 w-4 text-blue-700" aria-hidden="true" />
          Melhor match para sua comparação
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">
          <strong>{company.name}</strong> parece ser a opção mais aderente com base nos dados
          disponíveis de nota, verificação, atendimento e cobertura.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/companies/${company.slug || company.id}`}>Ver perfil</Link>
        </Button>
        {/* Botão de orçamento: apenas para empresas em plano pago */}
        {company.premium && (
          <QuoteCTA context="comparison" onRequest={() => onQuote(company)} />
        )}
      </div>
    </section>
  );
}
