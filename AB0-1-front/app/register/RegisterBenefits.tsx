'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Star, TrendingUp, Search } from 'lucide-react';
import Image from 'next/image';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Receba leads qualificados',
    description: 'Conecte-se com clientes que buscam exatamente o que você oferece.'
  },
  {
    icon: Star,
    title: 'Ganhe avaliações e prova social',
    description: 'Construa reputação e confiança com reviews autênticos.'
  },
  {
    icon: Search,
    title: 'Apareça nas buscas',
    description: 'Melhore sua visibilidade e seja encontrado por novos clientes.'
  }
];

export default function RegisterBenefits() {
  return (
    <div className="h-full bg-slate-50 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="mb-8">
           {/* Logo Placeholder - Usando asset real do projeto se disponível, senão texto */}
           <div className="flex items-center gap-2 mb-6">
             <Image 
                src="/images/logo.png" 
                alt="Avalia Solar Logo" 
                width={150} 
                height={40} 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                    // Fallback se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if(parent) {
                        const textNode = document.createElement('span');
                        textNode.className = 'text-2xl font-bold text-emerald-600';
                        textNode.innerText = 'Avalia Solar';
                        parent.appendChild(textNode);
                    }
                }}
             />
           </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-slate-900 leading-tight mb-4"
          >
            Cadastre sua empresa no <span className="text-emerald-600">Avalia Solar</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 text-lg"
          >
            Junte-se à maior plataforma de avaliação de energia solar do Brasil.
          </motion.p>
        </div>

        {/* Benefits List */}
        <div className="space-y-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600">
                <benefit.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer / Trust Indicators */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 pt-8 mt-8 border-t border-slate-200"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Cadastro gratuito e seguro</span>
        </div>
      </motion.div>
    </div>
  );
}
