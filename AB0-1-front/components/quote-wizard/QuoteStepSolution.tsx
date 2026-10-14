'use client';

import React from 'react';
import Image from 'next/image';
import { Home, Building, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SOLUTION_OPTIONS,
  PROJECT_PROFILE_OPTIONS,
  type WizardFormState,
  type SolutionOption,
  type ProjectProfileOption,
} from './types';

interface QuoteStepSolutionProps {
  form: WizardFormState;
  onUpdate: (patch: Partial<WizardFormState>) => void;
}

export function QuoteStepSolution({ form, onUpdate }: QuoteStepSolutionProps) {
  const handleSelectSolution = (sol: SolutionOption) => {
    onUpdate({
      productVertical: sol.label,
      quoteType: sol.quoteType,
    });
  };

  const handleSelectProfile = (prof: ProjectProfileOption) => {
    onUpdate({
      projectProfile: prof.value,
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Grupo 1: Soluções com Ícones 3D Autênticos */}
      <fieldset className="space-y-2 border-none p-0 m-0">
        <legend className="text-xs font-black uppercase tracking-wider text-slate-700">
          O que você deseja comparar?
        </legend>
        <div
          role="radiogroup"
          aria-label="Solução desejada"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          {SOLUTION_OPTIONS.map((sol) => {
            const isSelected = form.productVertical === sol.label;
            return (
              <div
                key={sol.slug}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleSelectSolution(sol)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleSelectSolution(sol);
                  }
                }}
                className={cn(
                  'relative flex items-center sm:flex-col sm:items-start p-2.5 sm:p-3 rounded-2xl border-2 cursor-pointer transition-all gap-2.5 sm:gap-2 select-none',
                  'min-h-[64px] sm:min-h-[88px]',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                )}
              >
                {/* Ícone 3D Real */}
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100/80 p-0.5">
                  <Image
                    src={sol.iconAsset}
                    alt={sol.alt}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {sol.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block line-clamp-1">
                    {sol.tagline}
                  </p>
                </div>

                {/* Radio checkmark */}
                <div
                  className={cn(
                    'absolute right-2.5 top-2.5 sm:top-2 sm:right-2 h-4 w-4 rounded-full border flex items-center justify-center transition-all',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Grupo 2: Perfil do Projeto (Residencial, Condomínio, Comercial) */}
      <fieldset className="space-y-2 border-none p-0 m-0">
        <legend className="text-xs font-black uppercase tracking-wider text-slate-700">
          Qual é o seu projeto?
        </legend>
        <div
          role="radiogroup"
          aria-label="Perfil do projeto"
          className="grid grid-cols-3 gap-2"
        >
          {PROJECT_PROFILE_OPTIONS.map((prof) => {
            const isSelected = form.projectProfile === prof.value;
            return (
              <div
                key={prof.canonical}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleSelectProfile(prof)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleSelectProfile(prof);
                  }
                }}
                className={cn(
                  'relative flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all text-center select-none min-h-[56px]',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/20'
                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700 hover:bg-slate-50/50'
                )}
              >
                <div className="mb-1 text-slate-600">
                  {prof.iconName === 'Home' && <Home className="h-4 w-4" />}
                  {prof.iconName === 'Building' && <Building className="h-4 w-4" />}
                  {prof.iconName === 'Building2' && <Building2 className="h-4 w-4" />}
                </div>
                <span className="text-[11px] font-bold leading-tight">
                  {prof.label}
                </span>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
