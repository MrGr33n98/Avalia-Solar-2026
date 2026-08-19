'use client';

import { BarChart3, Home, Menu, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onOpenNavigation: () => void;
  pendingReviewsCount?: number;
}

const items = [
  { id: 'overview', label: 'Início', icon: Home, tabs: ['overview'] },
  { id: 'reviews', label: 'Avaliações', icon: Star, tabs: ['reviews', 'review-forms'] },
  { id: 'live-inbox', label: 'Mensagens', icon: MessageCircle, tabs: ['live-inbox'] },
  {
    id: 'ranking-performance',
    label: 'Desempenho',
    icon: BarChart3,
    tabs: ['ranking-performance', 'analytics'],
  },
] as const;

export default function MobileBottomNavigation({
  activeTab,
  onTabChange,
  onOpenNavigation,
  pendingReviewsCount = 0,
}: MobileBottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,var(--sab,env(safe-area-inset-bottom)))] pt-2 shadow-lg backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 items-center text-center">
        {items.map((item) => {
          const isActive = (item.tabs as readonly string[]).includes(activeTab);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-extrabold transition-colors',
                isActive ? 'text-blue-700 bg-blue-50/70' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
              {item.id === 'reviews' && pendingReviewsCount > 0 && (
                <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Abrir todas as áreas"
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-extrabold text-slate-500 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
          <span className="truncate">Mais</span>
        </button>
      </div>
    </nav>
  );
}
