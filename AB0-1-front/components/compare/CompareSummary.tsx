import { Clock3, Map, ShieldCheck, Star } from 'lucide-react';
import { buildCompareSummary } from './compare-insights';
import type { CompareCompany } from './mapCompanyToCompareCompany';

const summaryConfig: Record<
  string,
  {
    icon: typeof ShieldCheck;
    iconBg: string;
    iconColor: string;
    order: number;
  }
> = {
  verified: {
    icon: ShieldCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    order: 1,
  },
  coverage: {
    icon: Map,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    order: 2,
  },
  rating: {
    icon: Star,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500 fill-amber-400',
    order: 3,
  },
  response: {
    icon: Clock3,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    order: 4,
  },
};

export default function CompareSummary({ companies }: { companies: CompareCompany[] }) {
  const allItems = buildCompareSummary(companies);
  const items = allItems
    .filter((item) => item.key in summaryConfig)
    .sort((a, b) => summaryConfig[a.key].order - summaryConfig[b.key].order);

  return (
    <section aria-labelledby="compare-summary-title">
      <h2 id="compare-summary-title" className="mb-2.5 text-base font-bold text-slate-950">
        Resumo da comparação
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const config = summaryConfig[item.key];
          const Icon = config.icon;
          const hasData = Boolean(item.companyName);

          return (
            <article
              key={item.key}
              className="flex flex-col justify-between rounded-xl border border-blue-100/70 bg-white p-2.5 shadow-sm sm:p-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="truncate text-[11px] font-semibold text-slate-900 sm:text-xs">
                  {item.label}
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <p className="truncate text-xs font-bold text-slate-950 sm:text-sm">
                  {item.companyName || 'Dados insuficientes'}
                </p>
                <div className="mt-1">
                  {item.key === 'verified' && hasData ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Verificada
                    </span>
                  ) : (
                    <p className="text-[11px] text-slate-500 sm:text-xs">
                      {hasData ? item.detail : '—'}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[10px] text-slate-400">
        Resumo calculado apenas com as informações públicas disponíveis para as empresas
        selecionadas.
      </p>
    </section>
  );
}
