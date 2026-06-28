import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BadgeCheck, Building2, Clock3, MapPinned, Scale, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';

type HomeComparisonPreviewProps = {
  companies: Company[];
};

const coverageLabel = (company: Company) => {
  const cities = Array.isArray(company.coverage_cities)
    ? company.coverage_cities
    : String(company.coverage_cities || '').split(',').filter(Boolean);
  const states = Array.isArray(company.coverage_states)
    ? company.coverage_states
    : String(company.coverage_states || '').split(',').filter(Boolean);
  const count = cities.length || states.length;
  return count > 0 ? `${count} regiões` : [company.city, company.state].filter(Boolean).join(', ') || 'Consultar';
};

export default function HomeComparisonPreview({ companies }: HomeComparisonPreviewProps) {
  const selected = companies.slice(0, 3);
  if (selected.length < 2) return null;

  return (
    <section className="bg-white pb-16 sm:pb-20" aria-labelledby="comparison-preview-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:flex-row sm:items-end sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-blue-700">
                <Scale className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-extrabold uppercase tracking-[0.14em]">Comparação transparente</span>
              </div>
              <h2 id="comparison-preview-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Compare empresas lado a lado
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Reputação, resposta e cobertura usando os mesmos critérios para todas.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800">
              <Link href="/compare">
                Abrir comparação <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="w-48 p-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 sm:p-5">Critério</th>
                  {selected.map((company) => {
                    const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
                    return (
                      <th key={company.id} className="border-l border-slate-200 p-4 text-base font-black text-slate-950 sm:p-5">
                        <div className="flex flex-col gap-3">
                          <div className="relative flex h-10 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={`Logo da ${company.name}`}
                                className="h-full w-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-slate-300" aria-hidden="true" />
                            )}
                          </div>
                          <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-700">
                            {company.name}
                          </Link>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <ComparisonRow icon={Star} label="Reputação">
                  {selected.map((company) => {
                    const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
                    return <Value key={company.id}>{rating > 0 ? `${rating.toFixed(1)} de 5` : 'Sem nota'}</Value>;
                  })}
                </ComparisonRow>
                <ComparisonRow icon={BadgeCheck} label="Verificação">
                  {selected.map((company) => <Value key={company.id}>{company.verified ? 'Verificada' : 'Em análise'}</Value>)}
                </ComparisonRow>
                <ComparisonRow icon={Clock3} label="Tempo de resposta">
                  {selected.map((company) => <Value key={company.id}>{company.response_time_sla || 'Consultar'}</Value>)}
                </ComparisonRow>
                <ComparisonRow icon={MapPinned} label="Cobertura">
                  {selected.map((company) => <Value key={company.id}>{coverageLabel(company)}</Value>)}
                </ComparisonRow>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ icon: Icon, label, children }: { icon: typeof Star; label: string; children: ReactNode }) {
  return (
    <tr>
      <th className="p-4 font-bold text-slate-700 sm:p-5">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-700" aria-hidden="true" /> {label}
        </span>
      </th>
      {children}
    </tr>
  );
}

function Value({ children }: { children: ReactNode }) {
  return <td className="border-l border-slate-200 p-4 font-semibold text-slate-800 sm:p-5">{children}</td>;
}
