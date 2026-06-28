import Link from 'next/link';
import { ArrowRight, MessageSquare, LayoutGrid, Lightbulb } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'Avaliações verificadas',
    description: 'Descubra empresas confiáveis de energia solar e mobilidade elétrica com base em reviews reais, reputação e histórico de atendimento.',
    linkText: 'Encontrar empresa ideal',
    linkHref: '/companies',
  },
  {
    icon: LayoutGrid,
    title: 'Comparações em profundidade',
    description: 'Compare instaladores lado a lado por reputação, área de cobertura, tempo de resposta e garantia de forma transparente.',
    linkText: 'Compare empresas agora',
    linkHref: '/compare',
  },
  {
    icon: Lightbulb,
    title: 'Pesquisa especializada',
    description: 'Calcule seu potencial de economia com nossa calculadora inteligente e receba propostas personalizadas sem compromisso.',
    linkText: 'Simular economia',
    linkHref: '/quote-wizard',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-14 sm:py-16" aria-labelledby="how-it-works-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Jornada simples</p>
          <h2 id="how-it-works-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Como funciona
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Da busca à proposta, você entende os critérios usados em cada etapa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="text-center flex flex-col items-center">
                {/* Wrapper do ícone igual a imagem de referência */}
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-transform hover:scale-105">
                  <Icon className="h-5 w-5 text-slate-800" aria-hidden="true" />
                </div>
                
                <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-sm">{step.description}</p>
                
                <Link 
                  href={step.linkHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline"
                >
                  {step.linkText} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

