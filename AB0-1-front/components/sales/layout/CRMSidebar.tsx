'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  FileText,
  Mail,
  Megaphone,
  Plus,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CRMSidebarProps {
  onOpenSearch?: () => void;
  onOpenAddModal?: (type: string) => void;
}

export default function CRMSidebar({ onOpenSearch, onOpenAddModal }: CRMSidebarProps) {
  const pathname = usePathname();
  const [salesExpanded, setSalesExpanded] = useState(true);

  const isCurrent = (path: string) => pathname === path || pathname.startsWith(path);

  return (
    <aside className="w-60 bg-[#0c1a30] text-slate-200 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none font-sans z-30">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
        <Link href="/dashboard/sales" className="flex items-center gap-2">
          <BrandLogo className="h-7 text-white" sizes="120px" priority />
        </Link>
      </div>

      {/* Action Header: Search & + Add new */}
      <div className="p-3 space-y-2 border-b border-slate-800/60">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-slate-900/80 hover:bg-slate-800/90 rounded-md border border-slate-750 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search or press Ctrl+K...</span>
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium text-xs justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add new</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-slate-900 text-slate-100 border-slate-800">
            <DropdownMenuLabel className="text-xs text-slate-400">Criar Novo Registro</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => onOpenAddModal?.('company')} className="cursor-pointer hover:bg-slate-800">
              <Building2 className="w-4 h-4 mr-2 text-blue-400" /> Empresa (Company)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('contact')} className="cursor-pointer hover:bg-slate-800">
              <Users className="w-4 h-4 mr-2 text-emerald-400" /> Pessoa (Contact)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('opportunity')} className="cursor-pointer hover:bg-slate-800">
              <Target className="w-4 h-4 mr-2 text-amber-400" /> Oportunidade / Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('quote')} className="cursor-pointer hover:bg-slate-800">
              <FileText className="w-4 h-4 mr-2 text-indigo-400" /> Proposta Solar / Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('task')} className="cursor-pointer hover:bg-slate-800">
              <CalendarClock className="w-4 h-4 mr-2 text-sky-400" /> Tarefa / Compromisso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-xs">
        <Link
          href="/dashboard/sales"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            pathname === '/dashboard/sales'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Compass className="w-4 h-4 text-slate-400" />
          <span>Explore</span>
        </Link>

        {/* Sales Group */}
        <div>
          <button
            onClick={() => setSalesExpanded(!salesExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-300 hover:bg-slate-850 transition-colors font-medium"
          >
            <span className="flex items-center gap-2.5">
              <BriefcaseBusiness className="w-4 h-4 text-amber-400" />
              <span>Sales</span>
            </span>
            {salesExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {salesExpanded && (
            <div className="ml-4 pl-2 border-l border-slate-800/80 my-1 space-y-0.5 text-slate-400">
              <Link
                href="/dashboard/sales/today"
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/60 hover:text-slate-100 transition-colors',
                  pathname === '/dashboard/sales/today' && 'text-amber-400 font-semibold'
                )}
              >
                <span>Today (Work Queue)</span>
              </Link>
              <Link
                href="/dashboard/sales/quotes"
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/60 hover:text-slate-100 transition-colors',
                  pathname === '/dashboard/sales/quotes' && 'text-amber-400 font-semibold'
                )}
              >
                <span>Quotes & Proposals</span>
              </Link>
              <Link
                href="/dashboard/sales/tasks"
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/60 hover:text-slate-100 transition-colors',
                  pathname === '/dashboard/sales/tasks' && 'text-amber-400 font-semibold'
                )}
              >
                <span>Tasks & Follow-ups</span>
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/sales/emails"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/emails')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Mail className="w-4 h-4 text-sky-400" />
          <span>Marketing / Outreach</span>
        </Link>

        <Link
          href="/dashboard/sales/prospects"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/prospects')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Engagement</span>
        </Link>

        <Link
          href="/dashboard/sales/accounts"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/accounts')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Companies</span>
        </Link>

        <Link
          href="/dashboard/sales/people"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/people')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>People</span>
        </Link>

        <Link
          href="/dashboard/sales/pipeline"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/pipeline')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <Target className="w-4 h-4 text-amber-400" />
          <span>Leads & Pipeline</span>
        </Link>

        <Link
          href="/dashboard/sales/reports"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/reports')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span>Reports</span>
        </Link>

        <Link
          href="/dashboard/sales/import"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors font-medium',
            isCurrent('/dashboard/sales/import')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-850 hover:text-white'
          )}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Import (.CSV)</span>
        </Link>

        <div className="pt-2">
          <button
            onClick={() => onOpenAddModal?.('ai')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-purple-300 hover:bg-slate-850 hover:text-purple-200 transition-colors font-medium text-xs bg-purple-950/40 border border-purple-800/40"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Avalia AI</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer: Settings */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <Link
          href="/dashboard/sales/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
            isCurrent('/dashboard/sales/settings')
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
          )}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
