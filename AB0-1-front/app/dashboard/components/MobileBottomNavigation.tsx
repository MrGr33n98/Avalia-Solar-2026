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
  const primaryTabIsActive = items.some((item) => item.tabs.some((tab) => tab === activeTab));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel)/0.98)] px-[max(8px,var(--safe-area-inset-left))] pb-[var(--safe-area-inset-bottom)] backdrop-blur dashboard:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid h-[68px] max-w-xl grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.tabs.some((tab) => tab === activeTab);
          const badge = item.id === 'reviews' ? pendingReviewsCount : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--dashboard-ring))]',
                active
                  ? 'text-[hsl(var(--dashboard-accent))]'
                  : 'text-[hsl(var(--dashboard-muted))] hover:text-[hsl(var(--dashboard-ink))]'
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {badge > 0 && (
                  <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-[hsl(var(--dashboard-accent))] px-1 text-center text-[9px] leading-4 text-[hsl(var(--dashboard-accent-foreground))]">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span className="w-full truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenNavigation}
          className={cn(
            'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--dashboard-ring))]',
            primaryTabIsActive
              ? 'text-[hsl(var(--dashboard-muted))] hover:text-[hsl(var(--dashboard-ink))]'
              : 'text-[hsl(var(--dashboard-accent))]'
          )}
          aria-current={!primaryTabIsActive ? 'page' : undefined}
          aria-label="Abrir todas as áreas"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
