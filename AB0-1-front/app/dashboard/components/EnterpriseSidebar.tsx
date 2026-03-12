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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect, useMemo, useState } from 'react';
import { DASHBOARD_NAVIGATION, filterNavigationByContext, type NavigationItem } from '@/config/navigation';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
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

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  pendingCount = 0,
  isCollapsed,
  onToggleCollapse,
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  pendingCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const groups: SidebarGroupItem[] = useMemo(() => {
    const navItems = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
    return navItems
      .filter(item => item.children && item.children.length > 0)
      .map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        children: item.children!.map(child => ({ id: child.id, label: child.label })),
      }));
  }, []);

  const leafItems: SidebarLeafItem[] = useMemo(() => {
    const navItems = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
    return navItems
      .filter(item => !item.children)
      .map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
      }));
  }, []);

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
    <div className={cn('flex flex-col h-full bg-[#002B4D]', isCollapsed ? 'w-[80px]' : 'w-[280px]')}>
      <div className={cn('h-16 flex items-center border-b border-white/10', isCollapsed ? 'px-3 justify-center' : 'px-5')}>
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
          <div className="h-10 w-10 rounded-xl bg-brand-blue flex items-center justify-center border-[0.5px] border-white/20 shadow-lg shadow-brand-blue/20">
            <Home className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <div className="text-sm font-bold text-white tracking-tight">Avaliasolar</div>
              <div className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider">Precision Energy</div>
            </div>
          )}
        </div>
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
  pendingCount = 0
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
        />
      </aside>
    </>
  );
}

