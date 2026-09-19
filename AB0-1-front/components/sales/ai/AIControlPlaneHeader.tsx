'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Inbox, CheckCircle2, PlayCircle, Bot, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApprovalStats } from '@/lib/api/mcp/approvals';

export function AIControlPlaneHeader() {
  const pathname = usePathname();
  const { data: stats } = useApprovalStats();

  const tabs = [
    {
      name: 'Inbox',
      href: '/dashboard/sales/ai/inbox',
      icon: Inbox,
      count: stats?.active_pending,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      name: 'Approvals',
      href: '/dashboard/sales/ai/approvals',
      icon: CheckCircle2,
      count: stats?.pending,
    },
    {
      name: 'Executions',
      href: '/dashboard/sales/ai/executions',
      icon: PlayCircle,
      count: stats?.executed,
    },
    {
      name: 'Agents',
      href: '/dashboard/sales/ai/agents',
      icon: Bot,
    },
    {
      name: 'Activity',
      href: '/dashboard/sales/ai/activity',
      icon: Activity,
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">AI Control Plane</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200/60">
                Governance R3/R4
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Operações Human-in-the-Loop, revisão e execução durável de agentes de inteligência
            </p>
          </div>
        </div>

        {stats && (
          <div className="flex items-center gap-2 text-xs">
            {stats.high_risk_pending > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {stats.high_risk_pending} Risco Elevado (R3/R4)
              </div>
            )}
            {stats.expiring_soon > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                {stats.expiring_soon} Expirando em breve
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <nav className="flex items-center gap-1 mt-4 -mb-4 overflow-x-auto pb-1" aria-label="Abas do AI Control Plane">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-indigo-600 text-indigo-700 font-semibold bg-indigo-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-slate-400')} />
              <span>{tab.name}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    tab.badgeColor || (isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600')
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
