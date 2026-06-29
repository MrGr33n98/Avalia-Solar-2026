'use client';

import Image from 'next/image';
import { ShieldCheck, Award, Clock, MapPin, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verificação rigorosa',
    description: 'Documentos e regularidade validados',
  },
  {
    icon: Award,
    title: 'Avaliações reais',
    description: 'Reputação baseada na experiência de clientes',
  },
  {
    icon: Clock,
    title: 'Resposta monitorada',
    description: 'Prazos claros para contato e atendimento',
  },
  {
    icon: MapPin,
    title: 'Cobertura regional',
    description: 'Empresas que atendem sua cidade e região',
  },
  {
    icon: Trophy,
    title: 'Qualidade comparável',
    description: 'Critérios justos para uma escolha inteligente',
  },
];

export default function DecisionTransparency() {
  return (
    <section className="bg-white py-14 md:py-20 border-b border-slate-100">
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

        {/* Bottom Section: 5 Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <Card key={idx} className="border border-slate-100/70 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-slate-200 transition-all rounded-2xl flex flex-col h-full justify-between">
                <CardContent className="p-0 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50/70 text-blue-600 border border-blue-100/50 shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-tight">
                        {feature.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
