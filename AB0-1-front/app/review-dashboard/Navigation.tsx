'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Command,
  FileText,
  Home,
  Menu,
  MessageCircle,
  Network,
  Plus,
  RefreshCcw,
  Sun,
  Trophy,
  UserRound,
  Award,
  Leaf,
  Car,
  BatteryCharging,
  Recycle,
  Medal,
  type LucideIcon,
} from 'lucide-react';
import { User } from '@/lib/api';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  replies?: boolean;
  notifications?: boolean;
};

export const sidebarSections: Array<{ title: string; items: DashboardNavItem[] }> = [
  {
    title: 'Dashboard',
    items: [{ label: 'Meu Dashboard', href: '/review-dashboard', icon: Home }],
  },
  {
    title: 'Avaliações',
    items: [
      { label: 'Minhas Avaliações', href: '/review-dashboard#reviews', icon: ClipboardList },
      { label: 'Empresas Avaliadas', href: '/review-dashboard#companies', icon: Building2 },
      { label: 'Rascunhos', href: '/review-dashboard#drafts', icon: FileText },
      {
        label: 'Respostas das Empresas',
        href: '/review-dashboard#company-replies',
        icon: MessageCircle,
        replies: true,
      },
    ],
  },
  {
    title: 'Oportunidades',
    items: [
      { label: 'Minhas Propostas', href: '/review-dashboard#opportunities', icon: MessageCircle },
    ],
  },
  {
    title: 'Jornada Sustentável',
    items: [
      { label: 'Meu Green House', href: '/review-dashboard#green-house', icon: Leaf },
      { label: 'Mobilidade Elétrica', href: '/review-dashboard#mobility', icon: Car },
      {
        label: 'Bateria e Armazenamento',
        href: '/review-dashboard#battery',
        icon: BatteryCharging,
      },
      { label: 'Consumo Consciente', href: '/review-dashboard#consumption', icon: Recycle },
    ],
  },
  {
    title: 'Perfil',
    items: [
      { label: 'Meu Perfil', href: '/review-dashboard/profile', icon: UserRound },
      { label: 'Conquistas', href: '/review-dashboard#achievements', icon: Trophy },
      { label: 'Reputação', href: '/review-dashboard#reputation', icon: Medal },
      {
        label: 'Notificações',
        href: '/review-dashboard#notifications',
        icon: Bell,
        notifications: true,
      },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { label: 'Feed', href: '/review-dashboard#activity-feed', icon: Network },
      { label: 'Ranking', href: '/review-dashboard#ranking', icon: Award },
      { label: 'Eventos', href: '/review-dashboard#events', icon: CalendarDays },
    ],
  },
];

const bottomNav: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/review-dashboard', icon: Home },
  { label: 'Avaliações', href: '/review-dashboard#reviews', icon: ClipboardList },
  { label: 'Propostas', href: '/review-dashboard#opportunities', icon: MessageCircle },
  { label: 'Reputação', href: '/review-dashboard#reputation', icon: Award },
  { label: 'Perfil', href: '/review-dashboard/profile', icon: UserRound },
];

export function Header({
  firstName,
  user,
  greenScore,
  notificationsCount,
  refreshing,
  onRefresh,
  onOpenCommand,
  onOpenMobileNav,
}: {
  firstName: string;
  user: User & { avatar_url?: string };
  greenScore: number;
  notificationsCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCommand: () => void;
  onOpenMobileNav: () => void;
}) {
  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:h-auto md:min-h-[72px] md:gap-4 md:p-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-slate-200 bg-white md:h-11 md:w-11 md:rounded-2xl lg:hidden"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-950 md:text-3xl">
              {greeting()}, {firstName}!
            </h1>
            <p className="truncate text-[10px] font-normal leading-tight text-slate-500 md:text-sm md:font-medium">
              Construindo um futuro mais sustentável.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-11 w-11 rounded-2xl border-slate-200 bg-white md:inline-flex"
                onClick={onOpenCommand}
              >
                <Command className="h-5 w-5 text-slate-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Menu de comandos</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 rounded-xl border-slate-200 bg-white md:h-11 md:w-11 md:rounded-2xl"
              >
                <Bell className="h-4 w-4 text-slate-600 md:h-5 md:w-5" />
                {notificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white md:h-5 md:min-w-5 md:text-[10px]">
                    {notificationsCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-2xl border-slate-200 p-0 shadow-xl">
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-950">Notificações</p>
                <p className="text-xs font-medium text-slate-500">
                  Curtidas, comentários, respostas e conquistas.
                </p>
              </div>
              <Separator />
              <div className="space-y-1 p-2">
                {[
                  'Novas respostas das empresas',
                  'Curtidas em avaliações',
                  'Conquista desbloqueada',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Bell className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-slate-200 bg-white md:h-11 md:w-11 md:rounded-2xl"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCcw
              className={cn('h-4 w-4 text-slate-600 md:h-5 md:w-5', refreshing && 'animate-spin')}
            />
          </Button>

          <div className="hidden items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm md:flex border border-slate-200">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || ''} alt={user.name} />
              <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-[120px]">
              <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="text-xs font-medium text-amber-600">
                Nível {greenScore >= 760 ? 'Ouro' : 'Prata'}
              </p>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

export function DesktopSidebar({
  repliesCount,
  notificationsCount,
}: {
  repliesCount: number;
  notificationsCount: number;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <SidebarContent repliesCount={repliesCount} notificationsCount={notificationsCount} />
    </aside>
  );
}

export function MobileDrawer({
  open,
  onOpenChange,
  repliesCount,
  notificationsCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repliesCount: number;
  notificationsCount: number;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navegação</SheetTitle>
          <SheetDescription>Menu principal da Central de Reputação.</SheetDescription>
        </SheetHeader>
        <SidebarContent
          repliesCount={repliesCount}
          notificationsCount={notificationsCount}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function SidebarContent({
  repliesCount,
  notificationsCount,
  onNavigate,
}: {
  repliesCount: number;
  notificationsCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] items-center gap-2 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <Sun className="h-6 w-6 fill-yellow-400" />
        </div>
        <span className="text-lg font-semibold uppercase text-slate-950">Avalia Solar</span>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-6 pb-6 mt-4">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-2 text-xs font-semibold uppercase text-slate-500">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const count = item.replies
                    ? repliesCount
                    : item.notifications
                      ? notificationsCount
                      : 0;
                  const active =
                    pathname === item.href ||
                    (pathname === '/review-dashboard' && item.href === '/review-dashboard');
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group flex h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-green-50 text-emerald-800'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                        item.replies &&
                          repliesCount > 0 &&
                          'border border-emerald-300 bg-emerald-50 text-slate-950'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active ? 'text-emerald-700' : 'text-slate-500'
                          )}
                        />
                        <span className="truncate">
                          {item.label}
                          {item.replies && repliesCount > 0 ? ` (${repliesCount})` : ''}
                        </span>
                      </span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white',
                            item.replies ? 'animate-pulse bg-red-600' : 'bg-red-500'
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-100 p-4">
        <Button
          className="h-12 w-full rounded-xl bg-emerald-600 font-medium hover:bg-emerald-700"
          asChild
        >
          <Link href="/companies">
            <Plus className="mr-2 h-4 w-4" />
            Avaliar empresa
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function MobileDashboardNav({ repliesCount }: { repliesCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,var(--safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium',
                active ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-700'
              )}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {item.replies && repliesCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                    {repliesCount}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
