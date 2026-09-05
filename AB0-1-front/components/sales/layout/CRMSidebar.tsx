'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Megaphone,
  Settings,
  Sparkles,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CRMSidebarProps {
  onOpenSearch?: () => void;
  onOpenAddModal?: (type: string) => void;
}

export default function CRMSidebar({ _onOpenSearch, onOpenAddModal }: CRMSidebarProps) {
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
      {/* Edge Floating Toggle Button */}
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
      <div className={cn('p-3.5 border-b border-slate-800/60 flex items-center', collapsed ? 'justify-center' : 'justify-start')}>
        <Link
          href="/dashboard/sales"
          className={cn(
            'flex items-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/40 rounded-xl',
            collapsed
              ? 'p-1.5 bg-white shadow-md rounded-xl hover:scale-105 transition-transform'
              : 'px-3 py-1.5 bg-white rounded-xl shadow-xs border border-slate-200/20 hover:bg-slate-50 transition-colors'
          )}
          title="Avalia Solar CRM"
        >
          {collapsed ? (
            <div className="w-8 h-8 relative flex items-center justify-center overflow-hidden">
              <Image
                src="/images/avalia-solar-logo-horizontal.png"
                alt="Avalia Solar Logo"
                width={120}
                height={30}
                priority
                className="object-cover object-left h-7 w-auto max-w-none"
              />
            </div>
          ) : (
            <Image
              src="/images/avalia-solar-logo-horizontal.png"
              alt="Avalia Solar Logo"
              width={160}
              height={36}
              priority
              className="h-6.5 w-auto object-contain"
            />
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

        {/* Campanhas */}
        <Link
          href="/dashboard/sales/campaigns"
          title="Campanhas"
          className={cn(
            'transition-all duration-150 flex items-center gap-3',
            collapsed
              ? 'w-10 h-10 justify-center mx-auto rounded-xl'
              : 'px-3 py-2.5 rounded-xl font-medium',
            isCurrent('/dashboard/sales/campaigns')
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Megaphone className={cn('w-4 h-4 shrink-0', isCurrent('/dashboard/sales/campaigns') ? 'text-slate-900' : 'text-slate-300')} />
          {!collapsed && <span>Campanhas</span>}
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

        {/* Avalia AI */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenAddModal?.('ai')}
            title="Avalia AI"
            className={cn(
              'transition-all duration-150 flex items-center text-purple-200 bg-[#161233] border border-purple-700/50 hover:bg-[#1f1945]',
              collapsed
                ? 'w-10 h-10 justify-center mx-auto rounded-xl'
                : 'w-full px-3 py-2.5 rounded-xl font-semibold gap-3 text-xs'
            )}
          >
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            {!collapsed && <span>Avalia AI</span>}
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
