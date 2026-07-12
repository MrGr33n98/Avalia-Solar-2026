'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    title: 'Energia limpa e inteligente',
    description: 'Conectamos você às melhores empresas de energia solar e mobilidade elétrica.',
    image: '/assets/energia-limpa-inteligente.png',
  },
  {
    title: 'Empresas verificadas',
    description: 'Compare fornecedores com dados, reputação e área de atendimento validados.',
    image: '/assets/empresas-verificadas.png',
  },
  {
    title: 'Mobilidade elétrica na prática',
    description: 'Encontre empresas para wallbox, carregadores, frotas e infraestrutura de recarga.',
    image: '/assets/mobilidade-eletrica-na-pratica.png',
  },
  {
    title: 'Energia solar para sua casa',
    description: 'Veja instaladores, avaliações e soluções solares para reduzir sua conta de luz.',
    image: '/assets/energia-solar-para-sua-casa.png',
  },
  {
    title: 'Soluções para empresas',
    description: 'Compare projetos comerciais, industriais, baterias, manutenção e atendimento especializado.',
    image: '/assets/solucoes-para-empresas.png',
  },
  {
    title: 'Decisão com mais segurança',
    description: 'Use avaliações reais, critérios claros e comparações para escolher melhor antes de contratar.',
    image: '/assets/decisao-com-mais-seguranca.png',
  },
];

export default function DecisionTransparency() {
  const [activeFeature, setActiveFeature] = useState(0);
  const feature = FEATURES[activeFeature];

  const showFeature = (index: number) => {
    setActiveFeature((index + FEATURES.length) % FEATURES.length);
  };

  return (
    <section className="bg-transparent py-14 md:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Top Section: Text & Graphics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
          {/* Left Column — Text */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-blue-700 uppercase">
              Decisão com transparência
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1]">
              Encontre as melhores empresas para energia solar e mobilidade elétrica
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl leading-relaxed">
              Compare empresas, veja avaliações reais e escolha com segurança a solução ideal para o seu projeto ou veículo.
            </p>
          </div>

          {/* Right Column — Combined Graphics Asset */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] sm:aspect-[1.6/1] lg:aspect-[1.3/1] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.04)] border border-slate-100/80 bg-white">
              <Image
                src="/images/avalia-solar-landing-page.png"
                alt="Encontre as melhores empresas de energia solar e mobilidade elétrica no Brasil"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover hover:scale-[1.01] transition-transform duration-500"
                priority
              />
            </div>
          </div>
        </div>

        <div aria-roledescription="carrossel" aria-label="Benefícios da plataforma">
          <article className="grid min-h-[190px] overflow-hidden rounded-none border border-slate-200 bg-white shadow-none sm:grid-cols-[46%_1fr] lg:min-h-[300px] lg:grid-cols-[55%_1fr]" aria-live="polite">
            <div className="relative min-h-[180px] border-b border-slate-200 sm:min-h-full sm:border-b-0 sm:border-r">
              <Image
                key={feature.image}
                src={feature.image}
                alt={feature.title}
                fill
                sizes="(max-width: 640px) 100vw, 55vw"
                className="object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6 lg:p-10">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 sm:text-xs">
                    Benefício {activeFeature + 1} de {FEATURES.length}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => showFeature(activeFeature - 1)} aria-label="Benefício anterior" className="flex h-9 w-9 items-center justify-center rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => showFeature(activeFeature + 1)} aria-label="Próximo benefício" className="flex h-9 w-9 items-center justify-center rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight text-slate-950 sm:text-xl lg:text-3xl">{feature.title}</h3>
                <p className="mt-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 lg:text-base">{feature.description}</p>
              </div>

              <div className="mt-5 flex items-center gap-1.5" aria-label={`Benefício ${activeFeature + 1} de ${FEATURES.length}`}>
                {FEATURES.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => showFeature(index)}
                    aria-label={`Mostrar ${item.title}`}
                    aria-current={index === activeFeature ? 'true' : undefined}
                    className={`h-1.5 transition-all ${index === activeFeature ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            </div>
          </article>
        </div>

      </div>
    </section>
  );
}
