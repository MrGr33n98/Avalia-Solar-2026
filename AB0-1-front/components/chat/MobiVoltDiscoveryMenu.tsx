'use client';

import { useState, useCallback } from 'react';
import { track } from '@/lib/analytics/lazy';

export type DiscoveryActionKind = 'solar' | 'ev' | 'reviews' | 'compare' | 'quote' | 'explain' | 'human';

export interface DiscoveryAction {
  id: string;
  label: string;
  kind: DiscoveryActionKind;
  icon: string;
  description?: string;
  vertical?: 'solar' | 'electric_mobility';
}

const DISCOVERY_ACTIONS: DiscoveryAction[] = [
  {
    id: 'solar',
    label: 'Energia Solar',
    kind: 'solar',
    icon: '☀️',
    description: 'Instalação, financiamento e projetos solares',
    vertical: 'solar'
  },
  {
    id: 'ev',
    label: 'Mobilidade Elétrica',
    kind: 'ev',
    icon: '🔌',
    description: 'Carregadores, wallbox e infraestrutura EV',
    vertical: 'electric_mobility'
  },
  {
    id: 'reviews',
    label: 'Ver avaliações',
    kind: 'reviews',
    icon: '⭐',
    description: 'Empresas bem avaliadas perto de você'
  },
  {
    id: 'compare',
    label: 'Comparar empresas',
    kind: 'compare',
    icon: '📊',
    description: 'Compare notas, reviews e serviços'
  },
  {
    id: 'quote',
    label: 'Pedir orçamento',
    kind: 'quote',
    icon: '💰',
    description: 'Receba orçamentos personalizados'
  },
  {
    id: 'explain',
    label: 'Explicar necessidade',
    kind: 'explain',
    icon: '✍️',
    description: 'Descreva o que você precisa'
  },
  {
    id: 'human',
    label: 'Falar com humano',
    kind: 'human',
    icon: '👤',
    description: 'Atendimento personalizado'
  }
];

interface MobiVoltDiscoveryMenuProps {
  onActionSelect: (action: DiscoveryAction) => void;
  title?: string;
  subtitle?: string;
}

export default function MobiVoltDiscoveryMenu({
  onActionSelect,
  title = 'Como posso ajudar você hoje?',
  subtitle = 'Escolha uma opção abaixo para começar'
}: MobiVoltDiscoveryMenuProps) {
  const handleActionClick = useCallback((action: DiscoveryAction) => {
    track('mobivolt_discovery_action_selected', {
      action_id: action.id,
      action_label: action.label,
      action_kind: action.kind,
      vertical: action.vertical
    });
    onActionSelect(action);
  }, [onActionSelect]);

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Grid de Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DISCOVERY_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="group flex flex-col items-start p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:border-brand-blue/50 transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left"
          >
            <div className="flex items-start space-x-3 w-full">
              <span className="text-2xl flex-shrink-0">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-brand-blue transition-colors">
                  {action.label}
                </h4>
                {action.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {action.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer informativo */}
      <div className="pt-2 text-center">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
          Consultoria especializada 100% gratuita
        </p>
      </div>
    </div>
  );
}
