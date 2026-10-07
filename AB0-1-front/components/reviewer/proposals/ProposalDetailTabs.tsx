'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProposalDetailTabsProps {
  activeTab: 'summary' | 'complete';
  onTabChange: (tab: 'summary' | 'complete') => void;
}

export function ProposalDetailTabs({ activeTab, onTabChange }: ProposalDetailTabsProps) {
  return (
    <div className="flex border-b border-border" role="tablist" aria-label="Abas de detalhes">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'summary'}
        onClick={() => onTabChange('summary')}
        className={cn(
          'flex-1 border-b-2 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none',
          activeTab === 'summary'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Detalhes da proposta
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'complete'}
        onClick={() => onTabChange('complete')}
        className={cn(
          'flex-1 border-b-2 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none',
          activeTab === 'complete'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Proposta completa
      </button>
    </div>
  );
}
