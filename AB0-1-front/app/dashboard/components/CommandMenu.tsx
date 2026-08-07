'use client';

import * as React from 'react';
import { Search } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { getFlatNavigationByContext } from '@/config/navigation';

interface CommandMenuProps {
  onSelectTab: (tabId: string) => void;
  visibleTabIds?: string[];
  compact?: boolean;
  mobile?: boolean;
}

export function CommandMenu({
  onSelectTab,
  visibleTabIds,
  compact = false,
  mobile = false,
}: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-menu', handleOpen);
    return () => window.removeEventListener('open-command-menu', handleOpen);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const menuItems = React.useMemo(() => {
    return getFlatNavigationByContext('operational')
      .filter((item) => !visibleTabIds || visibleTabIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        group: item.parentLabel || item.group || 'Geral',
      }));
  }, [visibleTabIds]);

  const groups = Array.from(new Set(menuItems.map((item) => item.group)));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'grid h-10 w-10 place-items-center rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-[hsl(var(--dashboard-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]'
            : mobile
              ? 'relative inline-flex h-10 min-w-0 w-full items-center justify-start rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-sm font-medium text-[hsl(var(--dashboard-muted))] shadow-sm transition-colors hover:bg-[hsl(var(--dashboard-surface))] hover:text-[hsl(var(--dashboard-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]'
              : 'relative inline-flex w-full items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-64 lg:w-80'
        }
      >
        <Search
          className={
            compact
              ? 'h-[18px] w-[18px]'
              : 'mr-2 h-[18px] w-[18px] shrink-0 text-[hsl(var(--dashboard-muted))]'
          }
          aria-hidden="true"
        />
        {compact ? (
          <span className="sr-only">Buscar no dashboard</span>
        ) : (
          <span className="min-w-0 truncate">Buscar no dashboard...</span>
        )}
        {!compact && !mobile && (
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {groups.map((group) => (
            <React.Fragment key={group}>
              <CommandGroup heading={group}>
                {menuItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        onSelect={() => runCommand(() => onSelectTab(item.id))}
                      >
                        <Icon className="mr-2 h-[18px] w-[18px]" />
                        <span>{item.label}</span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
