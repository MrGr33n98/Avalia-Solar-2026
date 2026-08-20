'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  reviewerNavItems,
  isNavItemActive,
  type ReviewerNavItem,
} from '../reviewerNavigation';
import { layout } from '../tokens';

const STORAGE_KEY = 'reviewer_sidebar_collapsed';

export function ReviewerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const mainItems = reviewerNavItems.filter((i) => i.section === 'main');
  const systemItems = reviewerNavItems.filter((i) => i.section === 'system');

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out',
          'sticky top-[72px] h-[calc(100vh-72px)] shrink-0 z-20'
        )}
        style={{ width: collapsed ? layout.sidebarCollapsed : layout.sidebarExpanded }}
      >
        {/* Header */}
        {!collapsed && (
          <div className="px-5 pt-5 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              MEU PAINEL
            </span>
          </div>
        )}
        {collapsed && <div className="pt-4" />}

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          <ul className="space-y-0.5">
            {mainItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={isNavItemActive(pathname, item)}
                collapsed={collapsed}
              />
            ))}
          </ul>

          {/* Separator */}
          <Separator className="my-3 bg-slate-100" />

          {/* System nav */}
          <ul className="space-y-0.5">
            {systemItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={isNavItemActive(pathname, item)}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500',
              'hover:bg-slate-50 hover:text-slate-700 transition-colors'
            )}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-200',
                collapsed && 'rotate-180'
              )}
            />
            {!collapsed && <span>Recolher menu</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
}: {
  item: ReviewerNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-[#1e5eff]/10 text-[#1e5eff] font-bold'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        collapsed && 'justify-center px-0'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          active ? 'text-[#1e5eff]' : 'text-slate-400 group-hover:text-slate-600'
        )}
      />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}

      {/* Notification dot */}
      {item.badge === 'dot' && !collapsed && (
        <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
      )}
      {item.badge === 'dot' && collapsed && (
        <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-blue-600" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
}
