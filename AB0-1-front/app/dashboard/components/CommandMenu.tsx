'use client';

import * as React from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  BarChart3,
  Sparkles,
  TrendingUp,
  Award,
  Building2,
  FileText,
  Package,
  Star,
  Image as ImageIcon,
  Target,
  Megaphone,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandMenuProps {
  onSelectTab: (tabId: string) => void;
}

export function CommandMenu({ onSelectTab }: CommandMenuProps) {
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

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, group: 'Métricas' },
    { id: 'style-analysis', label: 'Design System', icon: Sparkles, group: 'Ferramentas' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, group: 'Métricas' },
    { id: 'benchmark', label: 'Benchmark', icon: Award, group: 'Métricas' },
    { id: 'info', label: 'Minha Empresa', icon: Building2, group: 'Gestão' },
    { id: 'categories', label: 'Categorias', icon: FileText, group: 'Gestão' },
    { id: 'banners', label: 'Banners', icon: Sparkles, group: 'Gestão' },
    { id: 'products', label: 'Produtos', icon: Package, group: 'Gestão' },
    { id: 'reviews', label: 'Reviews', icon: Star, group: 'Gestão' },
    { id: 'approvals', label: 'Aprovações', icon: FileText, group: 'Gestão' },
    { id: 'media', label: 'Mídia', icon: ImageIcon, group: 'Gestão' },
    { id: 'leads', label: 'Oportunidades', icon: Target, group: 'Gestão' },
    { id: 'campaigns', label: 'Campanhas', icon: Megaphone, group: 'Gestão' },
    { id: 'settings', label: 'Configurações', icon: Settings, group: 'Sistema' },
  ];

  const groups = Array.from(new Set(menuItems.map((item) => item.group)));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full sm:w-64 lg:w-80"
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="inline-flex">Buscar no dashboard...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
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
                        <Icon className="mr-2 h-4 w-4" />
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
