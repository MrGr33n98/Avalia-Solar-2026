'use client';

import React from 'react';

interface FeedTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function FeedTabs({ activeView, onViewChange }: FeedTabsProps) {
  const tabs = [
    { id: 'for_you', label: 'Para Você' },
    { id: 'following', label: 'Seguindo' },
    { id: 'creators', label: 'Creators' },
    { id: 'companies', label: 'Empresas' },
    { id: 'recent', label: 'Recentes' },
  ];

  return (
    <div className="border-b border-border flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
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
  );
}
