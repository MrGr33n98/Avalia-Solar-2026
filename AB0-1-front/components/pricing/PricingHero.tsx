'use client';

import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingHero({ onViewPlans }: { onViewPlans: () => void }) {
  return (
    <section className="bg-brand-blue text-white">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
            Avalia Solar para empresas
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Transforme seu perfil em um canal de{' '}
            <span className="text-amber-400">aquisição de clientes.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100">
            Apareça com mais destaque, facilite o contato e acompanhe os resultados da sua empresa
            na Avalia Solar.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={onViewPlans}
              className="h-11 bg-amber-400 px-6 font-bold text-slate-950 hover:bg-yellow-400"
            >
              Ver planos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-white/60 bg-transparent px-6 font-bold text-white hover:bg-white/10"
            >
              <a href="/register?plan=free">Começar gratuitamente</a>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-100">
            {['Sem fidelidade', 'Upgrade a qualquer momento', 'Cadastro gratuito'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-amber-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <PricingValuePreview />
      </div>
    </section>
  );
}

function PricingValuePreview() {
  const rows = [
    ['Visibilidade', 'Básica', 'Alta'],
    ['Contato', 'Limitado', 'CTAs'],
    ['Destaque', '—', 'Categorias'],
    ['Analytics', '—', 'Avançado'],
  ];
  return (
    <div className="rounded-2xl bg-white p-4 text-sm text-slate-900 shadow-xl sm:p-6">
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {['Seu perfil hoje', 'Com Pro'].map((title, index) => (
          <div key={title} className="px-3 sm:px-5">
            <h2 className="font-black text-brand-blue">{title}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {index ? 'Mais visibilidade, mais clientes' : 'Plano Gratuito'}
            </p>
            <div className="mt-5 space-y-3">
              {rows.map(([label, free, pro]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-xs"
                >
                  <span>{label}</span>
                  <strong>{index ? pro : free}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
