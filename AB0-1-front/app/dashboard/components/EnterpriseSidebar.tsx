'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DASHBOARD_NAVIGATION,
  filterNavigationByContext,
  type NavigationItem,
} from '@/config/navigation';

interface EnterpriseSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
  visibleTabIds?: string[];
}

const COLLAPSE_STORAGE_KEY = 'avalia:enterprise-sidebar-collapsed';

function filterVisibleItems(items: NavigationItem[], visibleTabIds?: string[]): NavigationItem[] {
  return items
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => !visibleTabIds || visibleTabIds.includes(child.id)),
    }))
    .filter((item) => {
      if (item.children) return item.children.length > 0;
      return !visibleTabIds || visibleTabIds.includes(item.id);
    });
}

function SidebarTree({
  items,
  activeTab,
  onTabChange,
  pendingCount = 0,
  isCollapsed,
  openGroups,
  setOpenGroups,
}: {
  items: NavigationItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
  isCollapsed: boolean;
  openGroups: string[];
  setOpenGroups: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;

        if (item.children?.length) {
          const isGroupActive = item.children.some((child) => child.id === activeTab);
          const isOpen = openGroups.includes(item.id);

          return (
            <div key={item.id} className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setOpenGroups((prev) =>
                    prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                  )
                }
                className={cn(
                  'w-full h-11 rounded-xl border border-transparent justify-start px-3 text-left',
                  isGroupActive
                    ? 'bg-brand-blue/15 text-white border-brand-blue/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                  isCollapsed && 'justify-center px-0'
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 truncate text-sm font-medium">{item.label}</span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                  </>
                )}
              </Button>

              {!isCollapsed && isOpen && (
                <div className="ml-4 space-y-1 border-l border-white/10 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.id === activeTab;
                    const childBadge = child.badge && child.id === 'reviews' ? pendingCount : 0;

                    return (
                      <Button
                        key={child.id}
                        type="button"
                        variant="ghost"
                        onClick={() => onTabChange(child.id)}
                        className={cn(
                          'w-full h-10 rounded-lg justify-start px-3 text-left',
                          isChildActive
                            ? 'bg-white/10 text-white border border-white/10'
                            : 'text-white/65 hover:text-white hover:bg-white/5'
                        )}
                      >
                        <ChildIcon className="h-4 w-4 shrink-0" />
                        <span className="ml-3 flex-1 truncate text-sm">{child.label}</span>
                        {childBadge > 0 && (
                          <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                            {childBadge}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive = item.id === activeTab;
        const badgeCount = item.badge && item.id === 'reviews' ? pendingCount : 0;

        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full h-11 rounded-xl border border-transparent justify-start px-3 text-left',
              isActive
                ? 'bg-brand-blue/15 text-white border-brand-blue/30'
                : 'text-white/70 hover:text-white hover:bg-white/5',
              isCollapsed && 'justify-center px-0'
            )}
            title={item.label}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="ml-3 flex-1 truncate text-sm font-medium">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]">{badgeCount}</Badge>
                )}
              </>
            )}
          </Button>
        );
      })}
    </nav>
  );
}

export default function EnterpriseSidebar({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  pendingCount = 0,
  visibleTabIds,
}: EnterpriseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['analytics-group', 'reviews-group', 'product-edit-group']);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      setIsCollapsed(stored === '1');
    } catch {
      setIsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.style.setProperty(
        '--enterprise-sidebar-width',
        isCollapsed ? '72px' : '240px'
      );
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, isCollapsed ? '1' : '0');
    } catch {
      // noop
    }
  }, [isCollapsed]);

  const navItems = useMemo(
    () => filterVisibleItems(filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational'), visibleTabIds),
    [visibleTabIds]
  );

  useEffect(() => {
    const activeParent = navItems.find((item) => item.children?.some((child) => child.id === activeTab));
    if (!activeParent) return;

    setOpenGroups((prev) => (prev.includes(activeParent.id) ? prev : [...prev, activeParent.id]));
  }, [activeTab, navItems]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#002B4D] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white shadow-lg">
          <Menu className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">AvaliaSolar</p>
            <p className="text-xs text-white/60">Dashboard empresarial</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarTree
          items={navItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingCount={pendingCount}
          isCollapsed={isCollapsed}
          openGroups={openGroups}
          setOpenGroups={setOpenGroups}
        />
      </div>

      <div className="border-t border-white/10 p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={cn(
            'w-full h-10 rounded-xl justify-start px-3 text-white/70 hover:text-white hover:bg-white/5',
            isCollapsed && 'justify-center px-0'
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Recolher menu</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-white/10 bg-[#002B4D] sm:max-w-[280px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <motion.aside
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[#002B4D] lg:block',
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
