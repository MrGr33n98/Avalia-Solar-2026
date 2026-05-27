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
  pendingReviewsCount?: number;
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
  pendingReviewsCount = 0,
  isCollapsed,
  openGroups,
  setOpenGroups,
}: {
  items: NavigationItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
  pendingReviewsCount?: number;
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
                  'w-full h-11 rounded-lg border border-transparent justify-start px-3 text-left transition-all',
                  isGroupActive
                    ? 'bg-slate-100 text-slate-900 border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                  isCollapsed && 'justify-center px-0'
                )}
                title={item.label}
                aria-label={item.label}
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
                <div className="ml-4 space-y-1 border-l border-slate-100 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.id === activeTab;
                    const childBadge = child.badge && child.id === 'reviews' ? pendingReviewsCount : 0;

                    return (
                      <Button
                        key={child.id}
                        type="button"
                        variant="ghost"
                        onClick={() => onTabChange(child.id)}
                        aria-label={child.label}
                        className={cn(
                          'w-full h-10 rounded-lg justify-start px-3 text-left transition-all',
                          isChildActive
                            ? 'bg-primary/5 text-primary border border-primary/10'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              'w-full h-11 rounded-lg border border-transparent justify-start px-3 text-left transition-all',
              isActive
                ? 'bg-slate-100 text-slate-900 border-slate-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              isCollapsed && 'justify-center px-0'
            )}
            title={item.label}
            aria-label={item.label}
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
  pendingReviewsCount = 0,
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
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 active:scale-95">
          <Menu className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">AvaliaSolar</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Enterprise Panel</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarTree
          items={navItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingCount={pendingCount}
          pendingReviewsCount={pendingReviewsCount}
          isCollapsed={isCollapsed}
          openGroups={openGroups}
          setOpenGroups={setOpenGroups}
        />
      </div>

      <div className="border-t border-slate-100 p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            'w-full h-10 rounded-lg justify-start px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50',
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
        <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-200 bg-white sm:max-w-[280px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <motion.aside
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white lg:block',
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
