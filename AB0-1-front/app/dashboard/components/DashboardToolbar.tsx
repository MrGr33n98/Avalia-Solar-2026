'use client';

import { ChevronDown, HelpCircle, Menu } from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardToolbarProps {
  company: { name?: string } | null;
  onTabChange: (tabId: string) => void;
  onOpenNavigation?: () => void;
  themeToggle?: React.ReactNode;
}

export default function DashboardToolbar({
  company,
  onTabChange,
  onOpenNavigation,
  themeToggle,
}: DashboardToolbarProps) {
  const { user } = useAuth();
  const userInitials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 mb-4 flex min-h-[56px] min-w-0 items-center justify-between gap-2 border-b border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 py-2 pt-[var(--safe-area-inset-top)] sm:px-4 md:static md:mb-5 md:pt-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-[hsl(var(--dashboard-ink))] dashboard:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <BrandLogo className="hidden h-6 w-auto min-[360px]:block" />
        {/* Empresa ativa */}
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex min-w-0 items-center gap-2 rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-2 py-2 text-left shadow-sm transition hover:bg-[hsl(var(--dashboard-surface))]"
          aria-label="Ir para visão geral"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--dashboard-accent))] text-[10px] font-black text-[hsl(var(--dashboard-accent-foreground))]">
            {company?.name?.slice(0, 2).toUpperCase() || 'AS'}
          </span>
          <span className="hidden max-w-[140px] truncate text-xs font-bold text-[hsl(var(--dashboard-ink))] sm:inline sm:max-w-[200px]">
            {company?.name || 'Empresa'}
          </span>
          <ChevronDown
            className="hidden h-4 w-4 shrink-0 text-[hsl(var(--dashboard-muted))] sm:block"
            aria-hidden="true"
          />
        </button>

        {/* Busca global do dashboard — uma por viewport */}
        <div className="sm:hidden">
          <CommandMenu onSelectTab={onTabChange} compact />
        </div>
        <div className="hidden w-full max-w-[280px] sm:block lg:max-w-[320px]">
          <CommandMenu onSelectTab={onTabChange} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-medium text-[hsl(var(--dashboard-muted))] hover:bg-[hsl(var(--dashboard-surface))] sm:inline-flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" /> Ajuda
        </button>
        {themeToggle && (
          <div className="flex h-9 items-center justify-center rounded-md border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-1 transition-colors">
            {themeToggle}
          </div>
        )}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]"
          aria-label="Abrir perfil da conta"
        >
          <Avatar className="h-8 w-8 ring-1 ring-[hsl(var(--dashboard-border))] ring-offset-0">
            <AvatarImage src={user?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-[hsl(var(--dashboard-accent))] text-xs font-bold text-[hsl(var(--dashboard-accent-foreground))]">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
