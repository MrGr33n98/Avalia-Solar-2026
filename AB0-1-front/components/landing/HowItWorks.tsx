import { ArrowRight, Search, Scale, Send } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Busque',
    description: 'Informe o que precisa e onde o projeto será instalado.',
  },
  {
    icon: Scale,
    title: 'Compare com evidências',
    description: 'Analise reputação, cobertura, verificação e avaliações.',
  },
  {
    icon: Send,
    title: 'Peça orçamentos',
    description: 'Selecione as melhores opções e receba propostas para decidir.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-14 sm:py-16" aria-labelledby="how-it-works-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Jornada simples</p>
          <h2 id="how-it-works-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Como funciona
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Da busca à proposta, você entende os critérios usados em cada etapa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-slate-200">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-3xl font-black tabular-nums text-slate-200">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>

              {index < steps.length - 1 ? (
                <span className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 md:flex">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
