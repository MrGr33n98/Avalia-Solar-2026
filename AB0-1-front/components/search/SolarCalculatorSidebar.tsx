'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Landmark, PanelTop, HelpCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

interface SolarCalculatorSidebarProps {
  className?: string;
}

export default function SolarCalculatorSidebar({ className }: SolarCalculatorSidebarProps) {
  const [billAmount, setBillAmount] = useState<number>(500);

  // Custos e coeficientes estimados para o mercado brasileiro
  const energyCostPerKwh = 0.95; // Custo médio estimado por kWh
  const hoursOfFullSun = 4.5;    // Média de horas de sol pleno
  const systemEfficiency = 0.8;  // Fator de eficiência do sistema (perdas de 20%)
  const panelPowerWp = 550;      // Potência média de um painel solar moderno em Wp

  // Cálculos baseados no valor da conta
  const monthlyConsumptionKwh = billAmount / energyCostPerKwh;
  const systemPowerKwp = monthlyConsumptionKwh / (30 * hoursOfFullSun * systemEfficiency);
  const panelsCount = Math.ceil((systemPowerKwp * 1000) / panelPowerWp);
  const areaNeededSqm = panelsCount * 2.0; // Média de 2m² por painel
  const annualSavings = billAmount * 0.90 * 12; // Estimativa de 90% de economia anual

  const handleSliderChange = (value: number[]) => {
    setBillAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value.replace(/\D/g, ''));
    if (!isNaN(val)) {
      setBillAmount(Math.min(Math.max(val, 150), 10000));
    }
  };

  const handleStartLeadWizard = () => {
    track('solar_calculator_lead_start', {
      simulated_bill: billAmount,
      calculated_kwp: parseFloat(systemPowerKwp.toFixed(2)),
      calculated_panels: panelsCount,
    });
    
    openLeadModal({
      source: 'search_solar_calculator',
      type: 'wizard',
    });
  };

  return (
    <div className={cn(
      "w-full rounded-2xl p-4.5 border transition-all duration-300",
      "bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/95 dark:to-slate-950/60",
      "border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.03)]",
      className
    )}>
      
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none uppercase">Simulador Express</h4>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Dimensionamento solar básico</span>
        </div>
      </div>

      {/* Bill Input / Slider */}
      <div className="space-y-4 mb-4.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="bill-amount" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sua conta mensal
          </label>
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">R$</span>
            <Input
              id="bill-amount"
              type="text"
              value={billAmount}
              onChange={handleInputChange}
              className="h-8 pl-8 pr-2 text-right text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <Slider
          defaultValue={[500]}
          min={150}
          max={5000}
          step={50}
          value={[billAmount]}
          onValueChange={handleSliderChange}
          className="py-1 cursor-pointer [&_[class*='Range']]:bg-amber-500 [&_[class*='Thumb']]:border-amber-500 [&_[class*='Thumb']]:focus-visible:ring-amber-500/30"
          aria-label="Ajustar valor da conta de energia"
        />
      </div>

      {/* Estimations Output */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 mb-4 text-left">
        
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-medium">
            Gerador Estimado
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
            {systemPowerKwp.toFixed(2)} <span className="text-[10px] font-bold text-slate-400">kWp</span>
          </span>
        </div>

        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-medium">
            Painéis Necessários
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
            {panelsCount} <span className="text-[10px] font-bold text-slate-400">unid.</span>
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/40">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-medium">
            Área de Telhado
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
            ~{areaNeededSqm.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">m²</span>
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/40">
          <span className="text-[9px] uppercase tracking-wider text-amber-600/90 dark:text-amber-500/80 block font-bold">
            Economia Anual
          </span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            R$ {Math.round(annualSavings).toLocaleString('pt-BR')}
          </span>
        </div>

      </div>

      {/* Action CTA */}
      <Button
        onClick={handleStartLeadWizard}
        className={cn(
          "w-full h-9 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200",
          "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
          "text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.35)]",
          "border-none"
        )}
      >
        Pedir Orçamento Grátis
      </Button>
      
      <p className="text-[8px] text-center text-slate-400 dark:text-slate-500 mt-2 leading-tight">
        *Cálculo aproximado para fins demonstrativos. Valores reais dependem das condições locais de insolação e do telhado.
      </p>
    </div>
  );
}
