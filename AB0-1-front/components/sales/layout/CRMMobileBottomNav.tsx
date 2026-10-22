'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarClock,
  CheckSquare,
  CircleDollarSign,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CRMMobileBottomNavProps {
  onOpenMore?: () => void;
}

export default function CRMMobileBottomNav({ onOpenMore }: CRMMobileBottomNavProps) {
  const pathname = usePathname() || '';

  const isTodayActive = pathname.startsWith('/dashboard/sales/today');
  const isPipelineActive =
    pathname === '/dashboard/sales/pipeline' || pathname.startsWith('/dashboard/sales/pipeline/');
  const isAccountsActive =
    pathname.startsWith('/dashboard/sales/accounts') ||
    pathname.startsWith('/dashboard/sales/companies') ||
    pathname.startsWith('/dashboard/sales/people');
  const isTasksActive = pathname.startsWith('/dashboard/sales/tasks');
  const isMoreActive =
    !isTodayActive &&
    !isPipelineActive &&
    !isAccountsActive &&
    !isTasksActive &&
    pathname.startsWith('/dashboard/sales');

  const navItems = [
    {
      id: 'today',
      label: 'Hoje',
      href: '/dashboard/sales/today',
      icon: CalendarClock,
      active: isTodayActive,
      ariaLabel: 'Ir para a fila de trabalho de Hoje',
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      href: '/dashboard/sales/pipeline',
      icon: CircleDollarSign,
      active: isPipelineActive,
      ariaLabel: 'Ir para o Pipeline de Vendas',
    },
    {
      id: 'accounts',
      label: 'Empresas',
      href: '/dashboard/sales/accounts',
      icon: Building2,
      active: isAccountsActive,
      ariaLabel: 'Ir para a carteira de Empresas e Contatos',
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      href: '/dashboard/sales/tasks',
      icon: CheckSquare,
      active: isTasksActive,
      ariaLabel: 'Ir para a lista de Tarefas',
    },
    {
      id: 'more',
      label: 'Mais',
      href: '/dashboard/sales',
      icon: MoreHorizontal,
      active: isMoreActive,
      onClick: onOpenMore,
      ariaLabel: 'Abrir menu de opções e configurações do CRM',
    },
  ];

  return (
    <nav
      aria-label="Navegação do CRM Móvel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c102b] border-t border-slate-800 text-slate-400 select-none font-sans"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (item.onClick) {
                  item.onClick();
                }
              }}
              aria-label={item.ariaLabel}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-1 transition-colors min-w-[56px] min-h-[44px]',
                item.active ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.active && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
