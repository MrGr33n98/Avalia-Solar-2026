'use client';

interface TemplateTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TemplateTabs({ activeTab, onTabChange }: TemplateTabsProps) {
  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Ativos' },
    { id: 'draft', label: 'Rascunhos' },
    { id: 'shared', label: 'Compartilhados' },
    { id: 'archived', label: 'Arquivados' },
  ];

  return (
    <div className="flex border-b border-border space-x-6 overflow-x-auto text-sm font-medium">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 transition-colors relative whitespace-nowrap ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
        );
      })}
    </div>
  );
}
