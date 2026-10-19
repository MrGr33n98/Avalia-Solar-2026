'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente VISUAL e CONTROLADO de seleção para comparação de empresas (Web + PWA).
 * Não contém estado local de seleção: quem chama fornece `checked` a partir
 * de useComparison() ou do store real correspondente.
 *
 * Padrão canônico:
 * [☐] Comparar (desmarcado: borda cinza neutra, fundo branco)
 * [☑] Comparar (marcado: caixa azul #2563EB, check branco)
 * Rótulo sempre "Comparar" à direita, sem alternar para "Selecionada" ou "Comparando".
 */
export interface CompareCheckboxControlProps {
  companyName: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  /**
   * Alvo de toque acessível:
   * 'compact' (padrão): min-h-11 (44px) no mobile/PWA e min-h-9 (36px) no desktop.
   * 'comfortable': min-h-11 (44px) em todos os viewports.
   */
  density?: 'compact' | 'comfortable';
  title?: string;
}

export function CompareCheckboxControl({
  companyName,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  density = 'compact',
  title,
}: CompareCheckboxControlProps) {
  const inputId = React.useId();

  return (
    <label
      htmlFor={inputId}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.stopPropagation();
        }
      }}
      title={title}
      className={cn(
        'group relative inline-flex w-fit max-w-full select-none items-center justify-center gap-1.5',
        'rounded-md px-2 text-slate-700 transition-colors',
        'hover:bg-blue-50/60 focus-within:outline-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        density === 'compact' ? 'min-h-11 md:min-h-9' : 'min-h-11',
        className
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          onCheckedChange(event.currentTarget.checked);
        }}
        className="peer sr-only"
        aria-label={
          checked
            ? `Remover ${companyName} da comparação`
            : `Adicionar ${companyName} à comparação`
        }
      />

      <span
        aria-hidden="true"
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border',
          'transition-colors duration-150',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600',
          checked
            ? 'border-blue-600 bg-blue-600 shadow-[0_1px_3px_rgba(37,99,235,0.18)]'
            : 'border-slate-400 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] group-hover:border-blue-500'
        )}
      >
        {checked && <Check aria-hidden="true" className="h-3 w-3 stroke-[3] text-white" />}
      </span>

      <span className="whitespace-nowrap text-xs font-semibold leading-none text-slate-700 group-hover:text-blue-700">
        Comparar
      </span>
    </label>
  );
}

export default CompareCheckboxControl;
