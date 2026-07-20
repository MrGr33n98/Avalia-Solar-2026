'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
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
  Trophy,
  UserRound,
  Award,
  Leaf,
  Car,
  BatteryCharging,
  Recycle,
  Medal,
  LogOut,
  Star,
  MessageSquare,
  Search,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { User } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useNotificationStore } from '@/store/notificationStore';

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
  notificationsCount: propNotificationsCount,
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
  const {
    notifications,
    unreadCount,
    unreadMessagesCount,
    fetchNotifications,
    fetchUnreadCount,
    fetchUnreadMessagesCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadMessagesCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchUnreadMessagesCount]);

  const activeUnreadCount = unreadCount || propNotificationsCount || 0;

  return (
    <TooltipProvider>
      <header className="sticky top-[72px] z-30 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:h-auto md:min-h-[72px] md:gap-4 md:p-4 md:px-6 lg:px-8">
        {/* Esquerda: Boas-vindas (Desktop) ou Marca/Mobile Nav (Mobile) */}
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-none border-slate-200 bg-white md:h-11 md:w-11 lg:hidden"
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

        {/* Direita: Ações de Cabeçalho (Conforme Imagem 1 Desktop e Imagem 2 Mobile) */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {/* Busca (Mobile e Desktop) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-slate-100 md:h-10 md:w-10"
                onClick={onOpenCommand}
              >
                <Search className="h-5 w-5 text-slate-700" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar no Avalia Solar</TooltipContent>
          </Tooltip>

          {/* Mensagens com Badge (Imagem 1 & 2) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/chat"
                className="relative flex flex-col items-center justify-center p-1 text-slate-700 transition-colors hover:text-blue-600"
              >
                <div className="relative">
                  <MessageSquare className="h-5 w-5 text-slate-800 md:h-6 md:w-6" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span className="hidden text-[11px] font-semibold text-slate-700 md:inline-block">
                  Mensagens
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Central de Mensagens</TooltipContent>
          </Tooltip>

          {/* Notificações com Badge Vermelho (Imagem 1 & 2) */}
          <Popover onOpenChange={(open) => open && fetchNotifications()}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex flex-col items-center justify-center p-1 text-slate-700 transition-colors hover:text-blue-600 focus:outline-none"
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-slate-800 md:h-6 md:w-6" />
                  {activeUnreadCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
                      {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
                    </span>
                  )}
                </div>
                <span className="hidden text-[11px] font-semibold text-slate-700 md:inline-block">
                  Notificações
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-lg border-slate-200 p-0 shadow-lg md:w-96">
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-950">Notificações</p>
                  <p className="text-xs text-slate-500">
                    {activeUnreadCount} não lidas
                  </p>
                </div>
                {activeUnreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Marcar todas lidas
                  </Button>
                )}
              </div>
              <Separator />
              <ScrollArea className="h-[320px] p-2">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => !item.read && markAsRead(item.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors hover:bg-slate-100',
                          !item.read ? 'bg-blue-50/70 font-semibold' : 'bg-white'
                        )}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <Bell className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{item.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(item.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Botão de Atualizar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-slate-100 md:h-10 md:w-10"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCcw
              className={cn('h-4 w-4 text-slate-600 md:h-5 md:w-5', refreshing && 'animate-spin')}
            />
          </Button>

          {/* Avatar e Perfil (Imagem 2 Mobile / Desktop) */}
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border border-slate-200 shadow-sm md:h-10 md:w-10">
              <AvatarImage src={user.avatar_url || ''} alt={user.name} />
              <AvatarFallback className="bg-amber-100 font-bold text-amber-800">
                {initialsFromName(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-[100px] md:block">
              <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="text-xs font-medium text-amber-600">
                Nível {greenScore >= 760 ? 'Ouro' : 'Prata'}
              </p>
            </div>
          </div>

          {/* Menu de Grade / Dots (Imagem 2 Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-slate-100 md:hidden"
            onClick={onOpenMobileNav}
          >
            <LayoutGrid className="h-5 w-5 text-slate-800" />
          </Button>
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
    <aside className="fixed top-[72px] bottom-0 left-0 z-30 hidden w-[280px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
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

export type SidebarCollapsibleGroup = {
  label: string;
  href?: string;
  icon: LucideIcon;
  items?: Array<{ label: string; href: string }>;
};

export const sidebarMenuGroups: SidebarCollapsibleGroup[] = [
  { label: 'Dashboard', href: '/review-dashboard', icon: Home },
  {
    label: 'Avaliações',
    icon: Star,
    items: [
      { label: 'Todas as avaliações', href: '/review-dashboard#reviews' },
      { label: 'Minhas avaliações', href: '/review-dashboard#reviews' },
      { label: 'Rascunhos', href: '/review-dashboard#drafts' },
      { label: 'Respostas recebidas', href: '/review-dashboard#company-replies' },
    ],
  },
  {
    label: 'Propostas',
    icon: MessageCircle,
    items: [
      { label: 'Todas as propostas', href: '/review-dashboard#proposals' },
      { label: 'Em andamento', href: '/review-dashboard#proposals-progress' },
      { label: 'Concluídas', href: '/review-dashboard#proposals-done' },
    ],
  },
  {
    label: 'Empresas',
    icon: Building2,
    items: [
      { label: 'Minhas empresas', href: '/review-dashboard#companies' },
      { label: 'Soluções em uso', href: '/review-dashboard#solutions' },
    ],
  },
  {
    label: 'Meu perfil',
    icon: UserRound,
    items: [
      { label: 'Dados da empresa', href: '/review-dashboard/profile#company' },
      { label: 'Dados pessoais', href: '/review-dashboard/profile#personal' },
      { label: 'Interesses e atuação', href: '/review-dashboard/profile#interests' },
      { label: 'Redes sociais', href: '/review-dashboard/profile#social' },
      { label: 'Privacidade e visibilidade', href: '/review-dashboard/profile#privacy' },
      { label: 'Publicação e avaliação', href: '/review-dashboard/profile#publishing' },
    ],
  },
  {
    label: 'Soluções salvas',
    icon: Leaf,
    items: [
      { label: 'Energia Solar', href: '/review-dashboard#solutions' },
      { label: 'Mobilidade Elétrica', href: '/review-dashboard#mobility' },
    ],
  },
  {
    label: 'Relatórios',
    icon: Trophy,
    items: [
      { label: 'Resumo mensal', href: '/review-dashboard#reports' },
      { label: 'Estatísticas de impacto', href: '/review-dashboard#impact' },
    ],
  },
  {
    label: 'Configurações',
    icon: Command,
    items: [
      { label: 'Dados da conta', href: '/review-dashboard/profile' },
      { label: 'Notificações', href: '/review-dashboard#notifications' },
      { label: 'Privacidade', href: '/review-dashboard/profile#privacy' },
    ],
  },
  {
    label: 'Ajuda e suporte',
    href: '/faq',
    icon: Bell,
  },
];

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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Meu perfil': true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev: Record<string, boolean>) => ({ ...prev, [label]: !prev[label] }));
  };

  const name = user?.name || 'Avaliador';
  const initials = initialsFromName(name);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top Profile Card inside Sidebar */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-800 border border-slate-200">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{name}</p>
              <Link
                href="/review-dashboard/profile"
                onClick={onNavigate}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Ver meu perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {sidebarMenuGroups.map((group) => {
            const Icon = group.icon;
            const hasSubitems = Array.isArray(group.items) && group.items.length > 0;
            const isOpen = !!openGroups[group.label];
            const isDirectActive = group.href && pathname === group.href;

            if (!hasSubitems && group.href) {
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    isDirectActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <Icon className={cn('h-4.5 w-4.5', isDirectActive ? 'text-blue-600' : 'text-slate-500')} />
                  <span>{group.label}</span>
                </Link>
              );
            }

            return (
              <div key={group.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 text-slate-500" />
                    <span>{group.label}</span>
                  </span>
                  <span className="text-slate-400">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && group.items && (
                  <div className="ml-9 space-y-1 border-l border-slate-100 pl-3">
                    {group.items.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={onNavigate}
                        className="block rounded-lg py-1.5 px-2 text-xs font-normal text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-100 p-4">
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-950"
          onClick={async () => {
            if (onNavigate) onNavigate();
            await logout();
            router.push('/login');
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
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
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-none border-t-2 px-1 py-1.5 text-[11px] font-medium',
                active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-blue-700'
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
