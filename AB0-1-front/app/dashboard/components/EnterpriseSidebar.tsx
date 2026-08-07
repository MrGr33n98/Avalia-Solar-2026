'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { BrandLogo } from '@/components/brand/BrandLogo';
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
const COMPACT_RAIL_BREAKPOINT_PX = 1180;

function filterVisibleItems(items: NavigationItem[], visibleTabIds?: string[]): NavigationItem[] {
  return items
    .map((item) => ({
      ...item,
      children: item.children?.filter(
        (child) => !visibleTabIds || visibleTabIds.includes(child.id)
      ),
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
  isCompactRail,
  openGroups,
  setOpenGroups,
}: {
  items: NavigationItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
  pendingReviewsCount?: number;
  isCollapsed: boolean;
  isCompactRail: boolean;
  openGroups: string[];
  setOpenGroups: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const renderedItems = isCompactRail
    ? items.flatMap((item) => (item.children?.length ? item.children : [item]))
    : items;

  return (
    <nav className={cn('space-y-2', isCompactRail && 'space-y-1')}>
      {renderedItems.map((item) => {
        const Icon = item.icon;

        if (item.children?.length) {
          const isGroupActive = item.children.some((child) => child.id === activeTab);
          const isOpen = openGroups.includes(item.id);

          return (
            <div key={item.id} className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (isCompactRail) {
                    onTabChange(item.children?.[0]?.id || item.id);
                    return;
                  }
                  setOpenGroups((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
                className={cn(
                  'w-full rounded-lg border border-transparent text-left transition-colors',
                  isGroupActive
                    ? 'border-blue-400/40 bg-blue-600 text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white',
                  isCompactRail && !isCollapsed
                    ? 'h-16 flex-col justify-center gap-1 px-1'
                    : 'h-11 justify-start px-3',
                  isCollapsed && 'h-11 justify-center px-0'
                )}
                title={item.label}
                aria-label={item.label}
                aria-current={isGroupActive ? 'true' : undefined}
              >
                <Icon className={cn('shrink-0', isCollapsed ? 'h-5 w-5' : isCompactRail ? 'h-6 w-6' : 'h-4 w-4')} />
                <span
                  className={cn(
                    'min-w-0 truncate font-medium whitespace-nowrap',
                    isCompactRail ? 'block w-full text-center text-[10px]' : 'ml-3 flex-1 text-sm',
                    isCollapsed && 'hidden'
                  )}
                >
                  {item.label}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    (isCollapsed || isCompactRail) && 'hidden',
                    isOpen && 'rotate-180'
                  )}
                />
              </Button>

              {!isCollapsed && !isCompactRail && isOpen && (
                <div className="ml-4 space-y-1 border-l border-white/15 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.id === activeTab;
                    const childBadge =
                      child.badge && child.id === 'reviews' ? pendingReviewsCount : 0;
                    const hasMessageBadge = child.badge && child.id === 'live-inbox';

                    return (
                      <Button
                        key={child.id}
                        type="button"
                        variant="ghost"
                        onClick={() => onTabChange(child.id)}
                        aria-label={child.label}
                        aria-current={isChildActive ? 'page' : undefined}
                        className={cn(
                          'w-full h-10 rounded-lg justify-start px-3 text-left transition-all',
                          isChildActive
                            ? 'bg-primary/5 text-primary border border-primary/10'
                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                        )}
                      >
                        <ChildIcon className="h-4 w-4 shrink-0" />
                        <span className="ml-3 flex-1 truncate text-sm">{child.label}</span>
                        {childBadge > 0 && (
                          <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                            {childBadge}
                          </Badge>
                        )}
                        {hasMessageBadge && (
                          <span
                            className="ml-2 h-2.5 w-2.5 rounded-full bg-[hsl(var(--dashboard-accent))] ring-2 ring-[hsl(var(--dashboard-panel))]"
                            aria-label="Central de mensagens"
                          />
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
              'w-full rounded-lg border border-transparent text-left transition-colors',
              isActive
                ? 'border-blue-400/40 bg-blue-600 text-white shadow-sm'
                : 'text-slate-200 hover:bg-white/10 hover:text-white',
              isCompactRail && !isCollapsed
                ? 'h-16 flex-col justify-center gap-1 px-1'
                : 'h-11 justify-start px-3',
              isCollapsed && 'h-11 justify-center px-0'
            )}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={cn('shrink-0', isCollapsed ? 'h-5 w-5' : isCompactRail ? 'h-6 w-6' : 'h-4 w-4')} />
            <span
              className={cn(
                'min-w-0 truncate font-medium whitespace-nowrap',
                isCompactRail ? 'block w-full text-center text-[10px]' : 'ml-3 flex-1 text-sm',
                isCollapsed && 'hidden'
              )}
            >
              {item.label}
            </span>
            {badgeCount > 0 && (
              <Badge
                className={cn(
                  'ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]',
                  (isCollapsed || isCompactRail) && 'hidden'
                )}
              >
                {badgeCount}
              </Badge>
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
  const [isCompactViewport, setIsCompactViewport] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([
    'analytics-group',
    'reviews-group',
    'product-edit-group',
  ]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      setIsCollapsed(stored === '1');
    } catch {
      setIsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const updateCompact = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsCompactViewport(width < COMPACT_RAIL_BREAKPOINT_PX);
    };
    updateCompact();
    window.addEventListener('resize', updateCompact);
    return () => window.removeEventListener('resize', updateCompact);
  }, []);

  useEffect(() => {
    try {
      const width = isMobile ? '64px' : isCollapsed ? '72px' : isCompactViewport ? '112px' : '240px';
      document.documentElement.style.setProperty('--enterprise-sidebar-width', width);
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, isCollapsed ? '1' : '0');
    } catch {
      // noop
    }
  }, [isCollapsed, isCompactViewport, isMobile]);

  const navItems = useMemo(
    () =>
      filterVisibleItems(
        filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational'),
        visibleTabIds
      ),
    [visibleTabIds]
  );

  useEffect(() => {
    const activeParent = navItems.find((item) =>
      item.children?.some((child) => child.id === activeTab)
    );
    if (!activeParent) return;

    setOpenGroups((prev) => (prev.includes(activeParent.id) ? prev : [...prev, activeParent.id]));
  }, [activeTab, navItems]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const sidebarContent = (isDrawer = false) => (
    <div className="flex h-full flex-col bg-[hsl(var(--dashboard-rail))] pb-[var(--safe-area-inset-bottom)] text-white">
      <div className="flex min-h-[72px] items-center justify-center border-b border-white/10 px-3 py-3">
        <div
          className={cn(
            'overflow-hidden rounded-md bg-white px-1',
            !isDrawer && (isCollapsed || isCompactViewport || isMobile) ? 'w-10' : 'w-[156px]'
          )}
        >
          <BrandLogo className="h-9 max-w-none" sizes="156px" priority />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarTree
          items={navItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingCount={pendingCount}
          pendingReviewsCount={pendingReviewsCount}
          isCollapsed={isDrawer ? false : isCollapsed || isMobile}
          isCompactRail={isDrawer ? false : isMobile || (isCompactViewport && !isCollapsed)}
          openGroups={openGroups}
          setOpenGroups={setOpenGroups}
        />
      </div>

      {!isDrawer && !isMobile && (
        <div className="border-t border-white/10 p-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'w-full h-11 rounded-lg justify-start px-3 text-slate-300 hover:bg-white/10 hover:text-white',
              (isCollapsed || isCompactViewport) && 'h-14 flex-col justify-center gap-1 px-1'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span
              className={cn(
                'font-medium whitespace-nowrap',
                isCompactViewport ? 'ml-0 text-[10px]' : 'ml-3 text-sm',
                isCollapsed && 'hidden'
              )}
            >
              Recolher menu
            </span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="left"
          className="w-[min(320px,calc(100vw-24px))] p-0 border-r border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-rail))] pl-[var(--safe-area-inset-left)] sm:max-w-[320px]"
        >
          <SheetTitle className="sr-only">Navegação do dashboard</SheetTitle>
          <SheetDescription className="sr-only">
            Escolha uma área do painel da empresa.
          </SheetDescription>
          {sidebarContent(true)}
        </SheetContent>
      </Sheet>

      <motion.aside
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-[hsl(var(--dashboard-rail))] pl-[var(--safe-area-inset-left)] transition-[width] duration-200',
          isMobile ? 'w-[64px]' : isCollapsed ? 'w-[72px]' : 'w-[112px] dashboard:w-[240px]'
        )}
      >
        {sidebarContent()}
      </motion.aside>
    </>
  );
}
