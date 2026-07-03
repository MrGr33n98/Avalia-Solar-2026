import { Award, Clock3, Map, ShieldCheck, Star } from 'lucide-react';
import { buildCompareSummary } from './compare-insights';
import type { CompareCompany } from './mapCompanyToCompareCompany';

const icons = {
  rating: Star,
  reviews: Award,
  response: Clock3,
  verified: ShieldCheck,
  coverage: Map,
};

export default function CompareSummary({ companies }: { companies: CompareCompany[] }) {
  const items = buildCompareSummary(companies);

  return (
    <section aria-labelledby="compare-summary-title">
      <h2 id="compare-summary-title" className="mb-2 text-base font-semibold text-slate-950">
        Resumo da comparação
      </h2>
      <div className="grid overflow-x-auto rounded-none border border-slate-200 bg-white shadow-none sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = icons[item.key];
          return (
            <article
              key={item.key}
              className="min-h-[76px] min-w-[180px] border-b border-slate-200 px-4 py-3 last:border-b-0 sm:min-w-0 sm:border-r lg:border-b-0"
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <Icon className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                {item.label}
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-slate-950">
                {item.companyName || 'Dados insuficientes'}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </article>
          );
        })}
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-slate-500">
        Resumo calculado apenas com as informações públicas disponíveis para as empresas
        selecionadas.
      </p>
    </section>
  );
}
