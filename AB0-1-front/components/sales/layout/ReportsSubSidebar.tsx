'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Star,
  Ban,
  TrendingUp,
  Tag,
  LineChart,
  Package,
  CircleDollarSign,
  Sliders,
  Calendar,
  Mail,
  Clock,
  History,
  Filter,
  MessageSquare,
  CalendarDays,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const LEADS_ITEMS: NavItem[] = [
  { name: 'Sales', href: '/dashboard/sales/reports/sales', icon: Star },
  { name: 'Losses', href: '/dashboard/sales/reports/losses', icon: Ban },
  { name: 'New leads', href: '/dashboard/sales/reports/new-leads', icon: TrendingUp },
  { name: 'Attribution', href: '/dashboard/sales/reports/attribution', icon: Tag },
  { name: 'Forecast', href: '/dashboard/sales/reports/forecast', icon: LineChart },
  { name: 'Products', href: '/dashboard/sales/reports/products', icon: Package },
  { name: 'Installments', href: '/dashboard/sales/reports/installments', icon: CircleDollarSign },
  { name: 'Custom', href: '/dashboard/sales/reports/custom', icon: Sliders },
];

const EFFORT_ITEMS: NavItem[] = [
  { name: 'Activity', href: '/dashboard/sales/reports/activity', icon: Calendar },
  { name: 'Email', href: '/dashboard/sales/reports/email', icon: Mail },
  { name: 'Tasks', href: '/dashboard/sales/reports/tasks', icon: Clock },
];

const OTHER_ITEMS: NavItem[] = [
  { name: 'Snapshots', href: '/dashboard/sales/reports/snapshots', icon: History },
  { name: 'Funnel', href: '/dashboard/sales/reports/funnel', icon: Filter },
  { name: 'Engagement', href: '/dashboard/sales/reports/engagement', icon: MessageSquare },
  { name: 'Scheduler', href: '/dashboard/sales/reports/scheduler', icon: CalendarDays },
];

export default function ReportsSubSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crm_reports_subsidebar_collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('crm_reports_subsidebar_collapsed', String(nextState));
  };

  const isCurrent = (path: string) => {
    if (path === '/dashboard/sales/reports') {
      return pathname === '/dashboard/sales/reports';
    }
    return pathname?.startsWith(path) === true;
  };

  if (collapsed) {
    return (
      <aside className="w-10 bg-[#0e1333] border-r border-slate-800/80 flex flex-col items-center py-4 h-screen sticky top-0 z-20 select-none transition-all duration-300 ease-in-out">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-7 h-7 rounded-full bg-[#1b2252] text-slate-300 hover:text-white hover:bg-[#252f70] flex items-center justify-center transition-colors"
          title="Expandir menu de relatórios"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-56 bg-[#0e1333] text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800/80 text-xs select-none z-20 font-sans transition-all duration-300 ease-in-out shrink-0">
      {/* Overview Button */}
      <div className="p-3 pb-2 border-b border-slate-800/60">
        <Link
          href="/dashboard/sales/reports"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-xs transition-colors duration-150',
            isCurrent('/dashboard/sales/reports')
              ? 'bg-[#293570] text-white shadow-xs'
              : 'text-slate-300 hover:bg-[#18204d] hover:text-white'
          )}
        >
          <Sparkles className="w-4 h-4 text-indigo-300" />
          <span>Overview</span>
        </Link>
      </div>

      {/* Main Sections List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Leads Group */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 px-3 tracking-wide">
            Leads
          </span>
          <div className="mt-1 space-y-0.5">
            {LEADS_ITEMS.map((item) => {
              const active = isCurrent(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150 text-[12px]',
                    active
                      ? 'bg-[#222b5c] text-white font-medium'
                      : 'text-slate-300 hover:bg-[#161c42] hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn('w-3.5 h-3.5', active ? 'text-indigo-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </span>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Effort Group */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 px-3 tracking-wide">
            Effort
          </span>
          <div className="mt-1 space-y-0.5">
            {EFFORT_ITEMS.map((item) => {
              const active = isCurrent(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150 text-[12px]',
                    active
                      ? 'bg-[#222b5c] text-white font-medium'
                      : 'text-slate-300 hover:bg-[#161c42] hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn('w-3.5 h-3.5', active ? 'text-indigo-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Other Group */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 px-3 tracking-wide">
            Other
          </span>
          <div className="mt-1 space-y-0.5">
            {OTHER_ITEMS.map((item) => {
              const active = isCurrent(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150 text-[12px]',
                    active
                      ? 'bg-[#222b5c] text-white font-medium'
                      : 'text-slate-300 hover:bg-[#161c42] hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn('w-3.5 h-3.5', active ? 'text-indigo-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Wallboard & Collapse */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#090d26]">
        <Link
          href="/dashboard/sales/reports/wallboard"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#18204d] hover:bg-[#202a66] text-slate-200 hover:text-white text-xs font-medium border border-indigo-500/20 shadow-xs transition-colors"
        >
          <span>Launch wallboard</span>
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
        </Link>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-6 h-6 rounded-full bg-[#161b3d] hover:bg-[#202759] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Recolher menu de relatórios"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
