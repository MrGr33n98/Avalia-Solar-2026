'use client';

import React from 'react';
import { Search, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const steps = [
  {
    icon: Search,
    title: '1. Busque e Compare',
    description: 'Encontre instaladores solares verificados na sua cidade por categoria e avaliações.',
    color: 'bg-brand-blue/10 text-brand-blue'
  },
  {
    icon: FileText,
    title: '2. Peça Orçamentos',
    description: 'Solicite orçamentos gratuitos para as empresas escolhidas em poucos segundos.',
    color: 'bg-brand-cyan/10 text-brand-cyan'
  },
  {
    icon: CheckCircle2,
    title: '3. Escolha a Melhor',
    description: 'Analise as propostas, tire suas dúvidas e feche o melhor negócio com segurança.',
    color: 'bg-brand-green/10 text-brand-green'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
            Como o Avalia Solar funciona?
          </h2>
          <p className="text-sm text-slate-600">
            Simplificamos sua jornada para a energia limpa em 3 passos simples.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative p-4 border-none shadow-none text-center group">
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-4 transform group-hover:scale-105 transition-transform duration-300`}>
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-snug">
                {step.description}
              </p>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 translate-y-[-50%] w-8 h-px bg-slate-200" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
