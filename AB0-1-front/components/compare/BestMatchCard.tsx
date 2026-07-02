import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="best-match-title"
    >
      <div className="max-w-2xl">
        <p
          id="best-match-title"
          className="flex items-center gap-2 text-sm font-black text-blue-950"
        >
          <Sparkles className="h-4 w-4 text-blue-700" aria-hidden="true" />
          Melhor match para sua comparação
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          <strong>{company.name}</strong> parece ser a opção mais aderente com base nos dados
          disponíveis de nota, verificação, atendimento e cobertura.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/companies/${company.slug || company.id}`}>Ver perfil</Link>
        </Button>
        <Button
          size="sm"
          onClick={() => onQuote(company)}
          aria-label={`Solicitar orçamento da ${company.name}`}
        >
          Solicitar orçamento
        </Button>
      </div>
    </section>
  );
}
