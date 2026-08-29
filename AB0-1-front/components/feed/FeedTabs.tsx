'use client';

import React from 'react';

interface FeedTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  activeType: string;
  onTypeChange: (type: string) => void;
}

export function FeedTabs({ activeView, onViewChange, activeType, onTypeChange }: FeedTabsProps) {
  const tabs = [
    { id: 'for_you', label: 'Para Você' },
    { id: 'following', label: 'Seguindo' },
    { id: 'recent', label: 'Recentes' },
  ];

  return (
    <div className="space-y-2 border-b border-border pb-2">
      <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`py-2.5 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeView === tab.id
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          {tab.label}
        </button>
      ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar" aria-label="Tipo de conteúdo">
        {[['', 'Tudo'], ['ReviewerPublication', 'Publicações'], ['Review', 'Avaliações'], ['GroupPost', 'Comunidades']].map(([id, label]) => (
          <button key={id || 'all'} type="button" onClick={() => onTypeChange(id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${activeType === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
