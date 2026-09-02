'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  ChevronRight,
  Database,
  Globe,
  Key,
  Layers,
  MapPin,
  Shield,
  Sliders,
  Tag,
  Users,
  Webhook,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsSubSidebar() {
  const pathname = usePathname();

  const isCurrent = (path: string) => pathname === path;

  return (
    <aside className="w-56 bg-slate-900/95 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800/80 text-xs select-none z-20">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold text-slate-100 text-sm">Your settings</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Customize your sales workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Administration */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
            Administration
          </span>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/dashboard/sales/settings"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>General Setup</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/access"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/access') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Team & Permissions</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Data & Security */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
            Data & Security
          </span>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/dashboard/sales/settings/custom-fields"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/custom-fields') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Custom fields</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/api-keys"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/api-keys') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>API keys</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/integrations"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/integrations') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5 text-slate-400" />
                <span>Integrations & Webhooks</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Organization */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
            Organization
          </span>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/dashboard/sales/settings/activity-types"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/activity-types') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Activity types</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/company-types"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/company-types') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Company types</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/industries"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/industries') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Industries</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/markets"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/markets') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Markets</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/tags"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/tags') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags</span>
              </span>
            </Link>
            <Link
              href="/dashboard/sales/settings/territories"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors',
                isCurrent('/dashboard/sales/settings/territories') && 'bg-slate-800 text-white font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Territories</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
