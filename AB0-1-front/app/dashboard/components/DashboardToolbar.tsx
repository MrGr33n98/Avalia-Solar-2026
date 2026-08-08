'use client';

import { ChevronDown, HelpCircle, PanelLeft, Settings } from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardToolbarProps {
  company: { name?: string } | null;
  onTabChange: (tabId: string) => void;
  onToggleNavigation?: () => void;
  navigationOpen?: boolean;
  themeToggle?: React.ReactNode;
}

export default function DashboardToolbar({
  company,
  onTabChange,
  onToggleNavigation,
  navigationOpen = false,
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
    <header className="sticky top-0 z-30 mb-4 border-b border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel)/0.96)] pt-[var(--safe-area-inset-top)] backdrop-blur md:static md:mb-5 md:pt-0">
      <div className="flex min-h-14 min-w-0 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleNavigation}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[hsl(var(--dashboard-ink))] transition-colors hover:bg-[hsl(var(--dashboard-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))] dashboard:hidden"
            aria-label={navigationOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={navigationOpen}
          >
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <BrandLogo className="h-7 w-auto max-w-[148px] min-[360px]:max-w-[176px] md:hidden" />
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="hidden min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[hsl(var(--dashboard-surface))] sm:flex"
            aria-label="Ir para visão geral"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--dashboard-accent))] text-[10px] font-black text-[hsl(var(--dashboard-accent-foreground))]">
              {company?.name?.slice(0, 2).toUpperCase() || 'AS'}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs font-bold text-[hsl(var(--dashboard-ink))] md:inline">
              {company?.name || 'Empresa'}
            </span>
            <ChevronDown
              className="hidden h-4 w-4 shrink-0 text-[hsl(var(--dashboard-muted))] md:block"
              aria-hidden="true"
            />
          </button>
          <div className="hidden w-full max-w-[240px] md:block lg:max-w-[320px]">
            <CommandMenu onSelectTab={onTabChange} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {themeToggle && (
            <div className="hidden md:flex items-center mr-2">
              {themeToggle}
            </div>
          )}
          <button
            type="button"
            className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-medium text-[hsl(var(--dashboard-muted))] hover:bg-[hsl(var(--dashboard-surface))] md:inline-flex"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" /> Ajuda
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]"
                aria-label="Abrir perfil da conta"
              >
                <Avatar className="h-9 w-9 ring-1 ring-[hsl(var(--dashboard-border))] ring-offset-0">
                  <AvatarImage src={user?.avatar_url || undefined} alt="" />
                  <AvatarFallback className="bg-[hsl(var(--dashboard-accent))] text-xs font-bold text-[hsl(var(--dashboard-accent-foreground))]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-[hsl(var(--dashboard-panel))] text-[hsl(var(--dashboard-ink))]"
            >
              <DropdownMenuLabel className="normal-case tracking-normal">
                <span className="block truncate text-sm font-semibold">
                  {user?.name || 'Minha conta'}
                </span>
                {user?.email && (
                  <span className="block truncate text-xs font-normal text-[hsl(var(--dashboard-muted))]">
                    {user.email}
                  </span>
                )}
              </DropdownMenuLabel>
              {user && (
                <div className="grid gap-2 px-2 pb-2 text-xs text-[hsl(var(--dashboard-muted))]">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <span>Perfil</span>
                    <span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">
                      {user.role === 'admin' ? 'Administrador' : user.role === 'company' ? 'Empresa' : 'Avaliador'}
                    </span>
                    <span>ID</span>
                    <span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">{user.id}</span>
                    {user.company_id != null && <><span>Empresa</span><span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">{user.company_id}</span></>}
                    {user.phone && <><span>Telefone</span><span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">{user.phone}</span></>}
                    {(user.city || user.state) && <><span>Local</span><span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">{[user.city, user.state].filter(Boolean).join(' / ')}</span></>}
                    <span>Status</span>
                    <span className="truncate text-right font-medium text-[hsl(var(--dashboard-ink))]">{user.approved_by_admin ? 'Aprovado' : 'Pendente'}</span>
                  </div>
                </div>
              )}
              <DropdownMenuSeparator />
              {themeToggle && (
                <div className="flex min-h-11 items-center justify-between rounded-xl px-3 py-1.5 text-sm font-medium">
                  <span>Aparência</span>
                  {themeToggle}
                </div>
              )}
              <DropdownMenuItem onSelect={() => onTabChange('settings')}>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex min-h-12 min-w-0 items-center gap-2 border-t border-[hsl(var(--dashboard-border))] px-3 sm:hidden">
        <div className="min-w-0 flex-1">
          <CommandMenu onSelectTab={onTabChange} mobile />
        </div>
        <button
          type="button"
          onClick={() => onTabChange('review-forms')}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[hsl(var(--dashboard-accent))] px-3 text-xs font-bold text-[hsl(var(--dashboard-accent-foreground))] shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]"
        >
          Coletar QR
        </button>
      </div>
    </header>
  );
}
