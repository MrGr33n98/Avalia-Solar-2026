'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Megaphone,
  MessageSquare,
  Settings,
  Sparkles,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AcornBadgeIcon } from '@/components/sales/layout/CRMUserPopover';

interface CRMSidebarProps {
  onOpenSearch?: () => void;
  onOpenAddModal?: (type: string) => void;
}

export default function CRMSidebar({ onOpenSearch, onOpenAddModal }: CRMSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crm_sidebar_collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('crm_sidebar_collapsed', String(nextState));
  };

  const isCurrent = (path: string) => {
    if (path === '/dashboard/sales') {
      return pathname === '/dashboard/sales';
    }
    return pathname?.startsWith(path) === true;
  };

  const isSalesActive = pathname?.startsWith('/dashboard/sales/today') ||
    pathname?.startsWith('/dashboard/sales/quotes') ||
    pathname?.startsWith('/dashboard/sales/tasks');

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-[#0c102b] text-slate-200 border-r border-slate-800/80 select-none font-sans z-30 transition-all duration-300 ease-in-out shrink-0 relative',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Edge Floating Toggle Button (Image 3) */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="absolute -right-4 bottom-12 w-8 h-8 rounded-full bg-[#0c102b] text-white shadow-xl border border-slate-700/80 flex items-center justify-center cursor-pointer hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all z-40 focus:outline-none"
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-white stroke-[2.5]" />
        )}
      </button>

      {/* Brand Header */}
      <div className={cn('p-4 border-b border-slate-800/60 flex items-center', collapsed ? 'justify-center' : 'justify-start gap-3')}>
        <Link href="/dashboard/sales" className="flex items-center gap-3 focus:outline-none">
          <AcornBadgeIcon className={collapsed ? 'w-9 h-9' : 'w-7 h-7'} />
          {!collapsed && (
            <span className="font-bold text-sm text-white tracking-tight">Avalia Solar</span>
          )}
        </Link>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-xs">
        {/* Explore */}
        <Link
          href="/dashboard/sales"
          title="Explore"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Zap className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Explore</span>}
        </Link>

        {/* Sales */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (collapsed) toggleCollapsed();
              setSalesExpanded(!salesExpanded);
            }}
            title="Sales"
            className={cn(
              'w-full transition-all duration-150 flex items-center justify-between',
              collapsed
                ? 'w-10 h-10 justify-center mx-auto rounded-xl'
                : 'px-3 py-2.5 rounded-xl font-medium',
              isSalesActive
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            )}
          >
            <span className="flex items-center gap-3">
              <CircleDollarSign className={cn('w-4 h-4 shrink-0', isSalesActive ? 'text-slate-900' : 'text-slate-300')} />
              {!collapsed && <span>Sales</span>}
            </span>
            {!collapsed && (
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', salesExpanded && 'rotate-180')} />
            )}
          </button>

          {!collapsed && salesExpanded && (
            <div className="ml-4 pl-3 border-l border-slate-800/80 my-1 space-y-1 text-slate-400 text-[11px]">
              <Link
                href="/dashboard/sales/today"
                className={cn(
                  'block py-1.5 px-2 rounded-md hover:text-white hover:bg-slate-800/60 transition-colors',
                  pathname === '/dashboard/sales/today' && 'text-amber-400 font-semibold'
                )}
              >
                Fila Diária (Today)
              </Link>
              <Link
                href="/dashboard/sales/quotes"
                className={cn(
                  'block py-1.5 px-2 rounded-md hover:text-white hover:bg-slate-800/60 transition-colors',
                  pathname === '/dashboard/sales/quotes' && 'text-amber-400 font-semibold'
                )}
              >
                Propostas Solar
              </Link>
              <Link
                href="/dashboard/sales/tasks"
                className={cn(
                  'block py-1.5 px-2 rounded-md hover:text-white hover:bg-slate-800/60 transition-colors',
                  pathname === '/dashboard/sales/tasks' && 'text-amber-400 font-semibold'
                )}
              >
                Tarefas & Follow-ups
              </Link>
            </div>
          )}
        </div>

        {/* Marketing */}
        <Link
          href="/dashboard/sales/marketing"
          title="Marketing"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/marketing')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Megaphone className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/marketing') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Marketing</span>}
        </Link>

        {/* Engagement */}
        <Link
          href="/dashboard/sales/engagement"
          title="Engagement"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/engagement')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <MessageSquare className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/engagement') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Engagement</span>}
        </Link>

        <div className="border-t border-slate-800/80 my-3 mx-1" />

        {/* Companies */}
        <Link
          href="/dashboard/sales/accounts"
          title="Companies"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/accounts')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Building2 className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/accounts') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Companies</span>}
        </Link>

        {/* People */}
        <Link
          href="/dashboard/sales/people"
          title="People"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/people')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <User className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/people') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>People</span>}
        </Link>

        {/* Leads */}
        <Link
          href="/dashboard/sales/leads"
          title="Leads"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/leads')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Tag className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/leads') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Leads</span>}
        </Link>

        {/* Reports */}
        <Link
          href="/dashboard/sales/reports"
          title="Reports"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/reports')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <BarChart3 className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/reports') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Reports</span>}
        </Link>

        <div className="border-t border-slate-800/80 my-3 mx-1" />

        {/* Nutshell AI / Avalia AI */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenAddModal?.('ai')}
            title="Nutshell AI"
            className={cn(
              'transition-all duration-150 flex items-center text-purple-200 bg-[#161233] border border-purple-700/50 hover:bg-[#1f1945]',
              collapsed
                ? 'w-10 h-10 justify-center mx-auto rounded-xl'
                : 'w-full px-3 py-2.5 rounded-xl font-semibold gap-3 text-xs'
            )}
          >
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            {!collapsed && <span>Nutshell AI</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer: Settings */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090d23]">
        <Link
          href="/dashboard/sales/settings"
          title="Settings"
          className={cn(
            'transition-all duration-150 flex items-center gap-3 text-xs font-medium',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2 rounded-xl',
            isCurrent('/dashboard/sales/settings')
              ? 'bg-white text-slate-900 font-semibold'
              : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
          )}
        >
          <Settings className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/settings') ? 'text-slate-900' : 'text-slate-400')} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
