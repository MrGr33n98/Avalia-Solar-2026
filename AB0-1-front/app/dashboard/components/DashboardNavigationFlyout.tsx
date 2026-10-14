'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { type NavigationItem } from '@/config/navigation';

interface DashboardNavigationFlyoutProps {
  item: NavigationItem;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isCompactRail: boolean;
  isCollapsed?: boolean;
  pendingReviewsCount?: number;
}

export function DashboardNavigationFlyout({
  item,
  activeTab,
  onTabChange,
  isCompactRail,
  isCollapsed = false,
  pendingReviewsCount = 0,
}: DashboardNavigationFlyoutProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const children = item.children || [];
  const isGroupActive = children.some((child) => child.id === activeTab);
  const Icon = item.icon;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const handleMouseLeave = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const handleChildSelect = (childId: string) => {
    clearCloseTimer();
    setOpen(false);
    onTabChange(childId);
  };

  // Keyboard navigation inside flyout
  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const focusable = contentRef.current?.querySelectorAll<HTMLButtonElement>('button[data-flyout-item="true"]');
      if (!focusable || focusable.length === 0) return;

      const itemsArray = Array.from(focusable);
      const currentIndex = itemsArray.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < itemsArray.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : itemsArray.length - 1;
      }
      itemsArray[nextIndex]?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      if (!open) {
        e.preventDefault();
        setOpen(true);
        // Focus first child after next tick
        setTimeout(() => {
          const first = contentRef.current?.querySelector<HTMLButtonElement>('button[data-flyout-item="true"]');
          first?.focus();
        }, 50);
      }
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            onKeyDown={handleTriggerKeyDown}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`${item.label} (submenu)`}
            title={item.label}
            className={cn(
              'group relative flex w-full items-center rounded-xl border border-transparent text-left outline-none transition-all duration-150',
              isGroupActive
                ? 'bg-blue-600 text-white font-medium shadow-sm border-blue-500/40'
                : open
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
              isCompactRail && !isCollapsed
                ? 'h-16 flex-col justify-center gap-1 px-1 py-1.5'
                : 'h-11 justify-start px-3 py-2',
              isCollapsed && 'h-11 justify-center px-0'
            )}
          >
            <Icon
              className={cn(
                'shrink-0 transition-colors',
                isCollapsed ? 'h-5 w-5' : isCompactRail ? 'h-6 w-6' : 'h-4 w-4',
                isGroupActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
              )}
            />

            <span
              className={cn(
                'min-w-0 break-words font-medium leading-tight select-none',
                isCollapsed
                  ? 'hidden'
                  : isCompactRail
                  ? 'block w-full px-1 text-center text-[10px] line-clamp-2'
                  : 'ml-3 flex-1 text-sm text-left truncate'
              )}
            >
              {item.label}
            </span>

            {/* Chevron Right indicator for desktop lateral flyout */}
            {!isCollapsed && !isCompactRail && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200',
                  open
                    ? 'translate-x-0.5 text-white'
                    : isGroupActive
                    ? 'text-white/80'
                    : 'text-slate-400 group-hover:text-white'
                )}
                aria-hidden="true"
              />
            )}
          </button>
        </PopoverPrimitive.Trigger>

        {/* Radix Portal avoids clipping by parent overflow-y-auto */}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={contentRef}
            side="right"
            align="start"
            sideOffset={isCompactRail ? 10 : 8}
            collisionPadding={16}
            avoidCollisions
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleContentKeyDown}
            className={cn(
              'z-[60] w-[260px] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)] outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=right]:slide-in-from-left-2',
              'dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.6)]'
            )}
          >
            {/* Header com o título do grupo */}
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {item.label}
              </span>
            </div>

            {/* Lista dos subitens */}
            <div className="space-y-0.5 pt-1">
              {children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = child.id === activeTab;
                const childBadge =
                  child.badge && child.id === 'reviews' ? pendingReviewsCount : 0;
                const hasMessageBadge = child.badge && child.id === 'live-inbox';

                return (
                  <button
                    key={child.id}
                    type="button"
                    data-flyout-item="true"
                    onClick={() => handleChildSelect(child.id)}
                    aria-current={isChildActive ? 'page' : undefined}
                    className={cn(
                      'group/item flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors outline-none',
                      isChildActive
                        ? 'border border-blue-100 bg-blue-50/90 font-semibold text-blue-700 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800'
                    )}
                  >
                    <ChildIcon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isChildActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 group-hover/item:text-slate-700 dark:text-slate-400 dark:group-hover/item:text-slate-200'
                      )}
                    />

                    <span className="flex-1 truncate">{child.label}</span>

                    {childBadge > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                        {childBadge}
                      </Badge>
                    )}

                    {hasMessageBadge && (
                      <span
                        className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"
                        aria-label="Novas mensagens"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
}
