'use client';

import Link from 'next/link';
import { ArrowRight, Search, Columns3, FileText } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Buscar',
    description:
      'Encontre instaladores qualificados na sua região com dados transparentes de reputação, verificação e histórico de atendimento.',
    linkText: 'Encontrar empresa ideal',
    linkHref: '/companies',
  },
  {
    icon: Columns3,
    title: 'Comparar',
    description:
      'Compare instaladores lado a lado por reputação, área de cobertura, tempo de resposta e garantia de forma transparente.',
    linkText: 'Compare empresas agora',
    linkHref: '/compare',
  },
  {
    icon: FileText,
    title: 'Pedir orçamento',
    description:
      'Solicite propostas personalizadas para integradores selecionados sem custo, sem intermediários e sem compromisso.',
    linkText: 'Simular economia',
    linkHref: '/quote-wizard',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="bg-slate-50 py-14 sm:py-20 border-b border-slate-100"
      aria-labelledby="how-it-works-title"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
            Jornada simples
          </p>
          <h2
            id="how-it-works-title"
            className="mt-2 text-3xl font-bold tracking-tight text-slate-950"
          >
            Como funciona
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Da busca à proposta, você entende os critérios usados em cada etapa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-slate-200 transition-all flex items-start gap-4 h-full"
              >
                {/* Ícone principal da etapa */}
                <div className="shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                    <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                </div>

                {/* Lado Direito: Texto */}
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-base font-bold text-slate-950 leading-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400 font-medium">
                      {step.description}
                    </p>
                  </div>

                  <Link
                    href={step.linkHref}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    {step.linkText} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
