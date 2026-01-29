'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Zap, TrendingDown, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics';

export default function SavingsCalculator() {
  const [bill, setBill] = useState(350);

  const stats = useMemo(() => {
    const monthlySavings = bill * 0.95; // Assuming 95% reduction
    const yearlySavings = monthlySavings * 12;
    const savings25Years = yearlySavings * 25;
    
    return {
      monthly: monthlySavings,
      yearly: yearlySavings,
      total: savings25Years
    };
  }, [bill]);

  const handleConsultation = () => {
    track('home_calculator_consultation_click', { bill_value: bill });
    openLeadModal({ source: 'home-calculator', type: 'quick' });
  };

  return (
    <section className="py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <Zap className="absolute -top-10 -right-10 w-48 h-48 text-primary rotate-12" />
        <TrendingDown className="absolute -bottom-10 -left-10 w-56 h-56 text-primary -rotate-12" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold mb-4">
              <Calculator className="h-3 w-3" />
              Calculadora de Economia
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Quanto você pode <span className="text-primary">economizar</span> com energia solar?
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-snug">
              Descubra o potencial de redução na sua conta de luz e o retorno sobre o investimento em poucos segundos.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-300">Sua conta de luz mensal</label>
                  <span className="text-xl font-bold text-white">R$ {bill}</span>
                </div>
                <Slider
                  value={[bill]}
                  min={100}
                  max={5000}
                  step={50}
                  onValueChange={(val) => setBill(val[0])}
                  className="mb-1"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>R$ 100</span>
                  <span>R$ 5.000+</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex gap-2 items-start">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-tight">
                  Cálculo baseado na tarifa média nacional e durabilidade média de 25 anos dos equipamentos.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <motion.div
              key={bill}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 gap-3"
            >
              <Card className="bg-white/10 border-white/10 backdrop-blur-md overflow-hidden">
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Economia Mensal</p>
                      <h3 className="text-xl font-bold text-white">R$ {stats.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Economia Anual</p>
                      <h3 className="text-xl font-bold text-primary">R$ {stats.yearly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Economia em 25 anos</p>
                    <h3 className="text-3xl md:text-4xl font-black text-white">
                      R$ {stats.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </h3>
                  </div>

                  <div className="mt-6">
                    <Button 
                      onClick={handleConsultation}
                      className="w-full h-11 lg:h-10 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 group"
                    >
                      Solicitar Estudo Personalizado
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-emerald-400 text-[10px] font-bold uppercase mb-0.5">Redução</p>
                  <p className="text-lg font-black text-emerald-400">Até 95%</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-blue-400 text-[10px] font-bold uppercase mb-0.5">Payback Médio</p>
                  <p className="text-lg font-black text-blue-400">3-4 Anos</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
