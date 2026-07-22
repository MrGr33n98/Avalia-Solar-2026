'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, HelpCircle } from 'lucide-react';

export function IcpImpactCard() {
  return (
    <Card className="bg-[#0B1F3A] border-none rounded-md shadow-none p-5 text-white space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#1F5EFF]" />
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          Como funciona o cálculo?
        </h3>
      </div>

      <CardContent className="p-0 space-y-3.5">
        <p className="text-[10px] text-white/70 leading-relaxed font-medium">
          Nosso motor de pontuação analisa os critérios configurados em tempo real e calcula a aderência de cada lead de 0 a 100 ao seu ICP:
        </p>

        <div className="space-y-2 text-[10px] font-bold">
          <div className="flex justify-between items-center pb-1 border-b border-white/5">
            <span className="text-white/60">Faturamento & Consumo</span>
            <span className="text-[#1F5EFF] font-mono">35%</span>
          </div>
          <div className="flex justify-between items-center pb-1 border-b border-white/5">
            <span className="text-white/60">Estrutura & Imóvel</span>
            <span className="text-[#1F5EFF] font-mono">25%</span>
          </div>
          <div className="flex justify-between items-center pb-1 border-b border-white/5">
            <span className="text-white/60">Localização Geográfica</span>
            <span className="text-[#1F5EFF] font-mono">25%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Urgência & Comportamento</span>
            <span className="text-[#1F5EFF] font-mono">15%</span>
          </div>
        </div>

        <div className="pt-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-[#1F5EFF] hover:text-[#EEF4FF] transition-colors"
          >
            Entenda o cálculo do match
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
