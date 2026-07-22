'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IcpSliderFieldProps {
  label: string;
  tooltipText?: string;
  value: number;
  onValueChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  helperText?: string;
  isCurrency?: boolean;
}

export function IcpSliderField({
  label,
  tooltipText,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit,
  helperText,
  isCurrency = false,
}: IcpSliderFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value.replace(/\D/g, ''));
    if (!isNaN(val)) {
      onValueChange(Math.max(min, Math.min(max, val)));
    }
  };

  const formattedDisplay = isCurrency
    ? `R$ ${value.toLocaleString('pt-BR')}`
    : `${value} ${unit}`;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A]">{label}</Label>
          {tooltipText && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-[#7A8797] hover:text-[#0B1F3A] transition-colors" aria-label={`Informação sobre ${label}`}>
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#0B1F3A] border-none text-white text-[10px] p-2 max-w-[200px] rounded-sm font-medium">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {isCurrency && <span className="absolute left-3 text-xs font-bold text-[#526071]">R$</span>}
            <Input
              type="text"
              value={value}
              onChange={handleInputChange}
              className={`h-8 w-20 text-right text-xs font-bold rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] ${
                isCurrency ? 'pl-7 pr-3' : 'px-2'
              } focus:ring-1 focus:ring-[#1F5EFF] focus:border-[#1F5EFF]`}
              aria-label={`Valor numérico de ${label}`}
            />
          </div>
          <span className="text-[10px] font-bold text-[#526071] uppercase">{unit}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(val) => onValueChange(val[0])}
          className="py-1"
          aria-label={label}
        />
        
        <div className="flex justify-between items-center text-[9px] font-bold text-[#7A8797] uppercase font-mono">
          <span>{isCurrency ? `R$ ${min.toLocaleString('pt-BR')}` : `${min} ${unit}`}</span>
          <span>{isCurrency ? `R$ ${max.toLocaleString('pt-BR')}` : `${max} ${unit}`}</span>
        </div>
      </div>

      {helperText && (
        <p className="text-[10px] text-[#526071] leading-relaxed font-medium">
          {helperText}
        </p>
      )}
    </div>
  );
}
