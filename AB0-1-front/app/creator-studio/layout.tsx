'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessReviewDashboard } from '@/lib/auth/role-access';
import { FileText, Home, Link2, LineChart, UserRound, Users } from 'lucide-react';

const creatorNavItems = [
  { label: 'Visão geral', href: '/creator-studio', icon: Home },
  { label: 'Publicações', href: '/creator-studio/publications', icon: FileText },
  { label: 'Perfil público', href: '/creator-studio/profile', icon: UserRound },
  { label: 'Tree', href: '/creator-studio/tree', icon: Link2 },
  { label: 'Leads', href: '/creator-studio/leads', icon: Users },
  { label: 'Analytics', href: '/creator-studio/analytics', icon: LineChart },
];

export default function CreatorStudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, reviewerProfile, loading } = useAuth();
  const creatorEnabled = reviewerProfile?.creator_enabled === true;
  const creatorSlug = reviewerProfile?.public_slug;

  if (loading) {
    return <div className="min-h-screen bg-slate-50" aria-busy="true" />;
  }

  if (!user || !canAccessReviewDashboard(user.role) || !creatorEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900">Creator Studio indisponível</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ative seu perfil público Creator para acessar ferramentas de publicação, Tree, leads e analytics.
          </p>
          <Link
            href="/review-dashboard/profile"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ativar perfil Creator
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Creator</p>
            <h1 className="text-xl font-bold">Creator Studio</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/feed" className="font-semibold text-slate-600 hover:text-blue-600">Feed</Link>
            {creatorSlug && (
              <Link href={`/creators/${encodeURIComponent(creatorSlug)}`} className="font-semibold text-blue-600 hover:text-blue-700">
                Ver meu perfil público
              </Link>
            )}
            <Link href="/review-dashboard" className="font-semibold text-slate-600 hover:text-blue-600">Meu painel</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8" aria-label="Creator Studio">
          {creatorNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/creator-studio' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold',
                  active ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
