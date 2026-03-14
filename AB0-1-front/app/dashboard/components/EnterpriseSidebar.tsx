'use client';

import {
  BadgeCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  Home,
  Link2,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  Target
} from 'lucide-react';

interface EnterpriseSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    description: 'Dashboard principal',
    color: 'from-brand-blue to-brand-cyan'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Dados detalhados',
    color: 'from-brand-purple to-brand-pink'
  },
  {
    id: 'companies',
    label: 'Empresas',
    icon: Users,
    description: 'Gestão de clientes',
    color: 'from-emerald-400 to-brand-green'
  },
  {
    id: 'reviews',
    label: 'Avaliações',
    icon: MessageSquare,
    description: 'Feedback dos clientes',
    color: 'from-amber-400 to-brand-yellow'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Preferências do sistema',
    color: 'from-slate-400 to-slate-600'
  }
];

export default function EnterpriseSidebar({ activeTab, onTabChange }: EnterpriseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] clay-card border-r-2 border-white/10 transition-all duration-300",
        isCollapsed ? "w-20" : "w-80"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-8 h-8 w-8 rounded-full bg-brand-blue hover:bg-brand-blue/80 text-white shadow-lg flex items-center justify-center transition-all z-10"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="p-6 space-y-4">
        {/* Header */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center shadow-lg">
                  <Star className="h-5 w-5 text-white fill-white" />
                </div>
                <h2 className="text-xl font-black bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                  AvaliaSolar
                </h2>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Plataforma de Avaliação
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "w-full p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-gradient-to-r " + item.color + " text-white shadow-xl shadow-black/20"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Animated Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity",
                item.color
              )} />

              <div className="flex items-center gap-4 relative z-10">
                <motion.div
                  animate={{ 
                    rotate: hoveredItem === item.id ? [0, -10, 10, 0] : 0,
                    scale: activeTab === item.id ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    activeTab === item.id ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </motion.div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 text-left"
                    >
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className={cn(
                        "text-xs transition-colors",
                        activeTab === item.id ? "text-white/80" : "text-muted-foreground/60"
                      )}>
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active Indicator */}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="h-8 w-1 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>

              {/* Hover Effect */}
              {hoveredItem === item.id && !isCollapsed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 border-2 border-white/20 rounded-2xl"
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Unique Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 border border-brand-purple/20"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-brand-purple dark:text-brand-pink">
                    Potencial Ilimitado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sua empresa no topo
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type SidebarLeafItem = {
  id: string;
  label: string;
  icon: any;
};

type SidebarGroupItem = {
  id: string;
  label: string;
  icon: any;
  children: Array<{ id: string; label: string }>;
};

const COLLAPSE_STORAGE_KEY = 'avalia:enterpriseSidebarCollapsed';

import { useCompanyContext } from '@/context/CompanyContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, CheckCircle2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  pendingCount = 0,
  isCollapsed,
  onToggleCollapse,
  visibleTabIds,
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  pendingCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  visibleTabIds?: string[];
}) {
  const { companies, activeCompany, selectCompany } = useCompanyContext();
  const router = useRouter();

  const handleCompanySwitch = async (targetCompany: any) => {
    if (targetCompany.id === activeCompany?.id) return;
    try {
      await selectCompany(targetCompany);
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch company', error);
    }
  };

  const groups: SidebarGroupItem[] = useMemo(() => {
    const navItems = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
    return navItems
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => !visibleTabIds || visibleTabIds.includes(child.id)),
      }))
      .filter(item => item.children && item.children.length > 0)
      .map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        children: item.children!.map(child => ({ id: child.id, label: child.label })),
      }));
  }, [visibleTabIds]);

  const leafItems: SidebarLeafItem[] = useMemo(() => {
    const navItems = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
    return navItems
      .filter(item => !item.children)
      .filter((item) => !visibleTabIds || visibleTabIds.includes(item.id))
      .map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
      }));
  }, [visibleTabIds]);

  const groupByActiveTab = useMemo(() => {
    if (activeTab === 'analytics') return 'analytics-group';
    if (activeTab === 'reviews') return 'reviews-group';
    if (activeTab === 'leads') return 'interaction-group';
    if (activeTab.startsWith('product-')) return 'product-edit-group';
    return null;
  }, [activeTab]);

  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    if (!groupByActiveTab) return;
    setOpenGroups((prev) => (prev.includes(groupByActiveTab) ? prev : [...prev, groupByActiveTab]));
  }, [groupByActiveTab]);

  const renderLeafButton = (item: SidebarLeafItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          'w-full justify-start h-10 px-3 rounded-lg transition-all border-[0.5px] border-transparent',
          isCollapsed ? 'justify-center px-0' : 'justify-start',
          isActive
            ? 'bg-brand-blue text-white border-white/20'
            : 'text-white/60 hover:bg-white/10 hover:text-white hover:border-white/10'
        )}
        onClick={() => onTabChange(item.id)}
        aria-label={item.label}
        title={item.label}
      >
        <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-white' : 'text-white/50')} />
        {!isCollapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
      </Button>
    );
  };

  const renderChildButton = (child: { id: string; label: string }) => {
    const isActive = activeTab === child.id;

    const badgeValue =
      pendingCount > 0 && (child.id === 'reviews' || child.id === 'leads') ? pendingCount : null;

    return (
      <button
        key={child.id}
        type="button"
        onClick={() => onTabChange(child.id)}
        className={cn(
          'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors border-[0.5px] border-transparent',
          isActive
            ? 'bg-brand-blue/20 text-white border-brand-blue/40'
            : 'text-white/50 hover:bg-white/5 hover:text-white'
        )}
        aria-label={child.label}
        title={child.label}
      >
        <span className={cn('ml-7 flex-1 text-left', isCollapsed && 'ml-0')}>{child.label}</span>
        {badgeValue !== null && (
          <Badge className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] bg-brand-blue text-white border-none">
            {badgeValue}
          </Badge>
        )}
      </button>
    );
  };

  const renderGroupTrigger = (group: SidebarGroupItem) => {
    const Icon = group.icon;
    const groupIsActive = group.children.some((child) => child.id === activeTab);

    return (
      <AccordionTrigger
        className={cn(
          'px-3 py-2 rounded-lg hover:no-underline transition-all border-[0.5px] border-transparent',
          isCollapsed ? 'justify-center px-0' : 'justify-between',
          groupIsActive ? 'bg-white/5 text-white border-white/10' : 'text-white/60 hover:bg-white/10 hover:text-white'
        )}
        aria-label={group.label}
        title={group.label}
      >
        <div className={cn('flex items-center', isCollapsed ? 'justify-center w-full' : '')}>
          <Icon className={cn('h-[18px] w-[18px]', groupIsActive ? 'text-brand-cyan' : 'text-white/50')} />
          {!isCollapsed && <span className="ml-3 text-sm font-medium">{group.label}</span>}
        </div>
      </AccordionTrigger>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-[#0F172A] border-r border-white/5 shadow-2xl', isCollapsed ? 'w-[80px]' : 'w-[280px]')}>
      <div className={cn('h-16 flex items-center border-b border-white/10 bg-white/5', isCollapsed ? 'px-3 justify-center' : 'px-5')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn('flex items-center cursor-pointer hover:opacity-80 transition-opacity w-full', isCollapsed ? 'justify-center' : 'gap-3')}>
              <div className="h-10 w-10 rounded-xl bg-brand-blue flex items-center justify-center border-[0.5px] border-white/20 shadow-lg shadow-brand-blue/20 shrink-0">
                {activeCompany?.logo_url ? (
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={activeCompany.logo_url} className="object-cover p-1" />
                    <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                      {activeCompany.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Home className="h-5 w-5 text-white" />
                )}
              </div>
              {!isCollapsed && (
                <div className="leading-tight min-w-0 flex-1">
                  <div className="text-sm font-bold text-white tracking-tight truncate">
                    {activeCompany?.name || 'Avaliasolar'}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider truncate">
                      {activeCompany?.category || 'Precision Energy'}
                    </div>
                    <MoreVertical className="h-2.5 w-2.5 text-white/20" />
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-[#002B4D] border-white/10 text-white ml-2">
            <DropdownMenuLabel className="text-xs text-white/50">Trocar Empresa</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {companies.map((c) => (
              <DropdownMenuItem 
                key={c.id} 
                className={cn(
                  "cursor-pointer hover:bg-white/10",
                  c.id === activeCompany?.id && "bg-brand-blue/20 text-brand-cyan"
                )}
                onClick={() => handleCompanySwitch(c)}
              >
                <div className="flex items-center gap-2 min-w-0 w-full">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={c.logo_url} alt={c.name} />
                    <AvatarFallback className="text-[10px] bg-white/10">
                      {c.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1">{c.name}</span>
                  {c.id === activeCompany?.id && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-white/10 text-brand-cyan text-xs"
              onClick={() => router.push('/select-company')}
            >
              <Shield className="mr-2 h-3.5 w-3.5" />
              Ver todas as empresas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-6 space-y-2', isCollapsed ? 'px-2' : 'px-4')}>
        <div className="space-y-1">
          {leafItems.slice(0, 1).map(renderLeafButton)}
        </div>

        {isCollapsed ? (
          <div className="space-y-1">
            {groups.map((group) => {
              const Icon = group.icon;
              const groupIsActive = group.children.some((child) => child.id === activeTab);
              const target = group.children[0]?.id;
              return (
                <Button
                  key={group.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    'w-full justify-center h-10 px-0 rounded-lg transition-all border-[0.5px] border-transparent',
                    groupIsActive
                      ? 'bg-brand-blue text-white border-white/20'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                  onClick={() => target && onTabChange(target)}
                  aria-label={group.label}
                  title={group.label}
                >
                  <Icon className={cn('h-[18px] w-[18px]', groupIsActive ? 'text-white' : 'text-white/50')} />
                </Button>
              );
            })}
          </div>
        ) : (
          <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups} className="space-y-1">
            {groups.map((group) => (
              <div key={group.id}>
                <AccordionItem value={group.id} className="border-none">
                  {renderGroupTrigger(group)}
                  <AccordionContent className="pb-0 pt-2">
                    <div className="space-y-1">
                      {group.children.map(renderChildButton)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        )}

        <div className="space-y-1">
          {leafItems.slice(1).map(renderLeafButton)}
        </div>
      </nav>

      <div className={cn('border-t border-white/10', isCollapsed ? 'p-2' : 'p-4')}>
        <Button
          type="button"
          variant="ghost"
          onClick={onToggleCollapse}
          className={cn(
            'w-full h-10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white border-[0.5px] border-transparent hover:border-white/10',
            isCollapsed ? 'justify-center px-0' : 'justify-start px-3'
          )}
          aria-label="Recolher menu"
          title="Recolher menu"
        >
          {isCollapsed ? (
            <ChevronRight className="h-[18px] w-[18px] text-white/60" />
          ) : (
            <ChevronLeft className="h-[18px] w-[18px] text-white/60" />
          )}
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Recolher menu</span>}
        </Button>
      </div>
    </div>
  );
}

export default function EnterpriseSidebar({ 
  activeTab, 
  onTabChange, 
  isOpen,
  onClose,
  pendingCount = 0,
  visibleTabIds
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (stored === '1') setIsCollapsed(true);
    } catch {
      setIsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--enterprise-sidebar-width', isCollapsed ? '80px' : '280px');
    } catch {
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      } catch {
      }
      return next;
    });
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="left" 
          className="w-[280px] p-0 bg-[#002B4D] border-r border-white/10"
        >
          <SidebarContent 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            pendingCount={pendingCount} 
            isCollapsed={false}
            onToggleCollapse={() => {}}
            visibleTabIds={visibleTabIds}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-[#002B4D] transition-[width] duration-200',
          isCollapsed ? 'w-[80px]' : 'w-[280px]'
        )}
      >
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          pendingCount={pendingCount} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          visibleTabIds={visibleTabIds}
        />
      </aside>
    </>
  );
}

