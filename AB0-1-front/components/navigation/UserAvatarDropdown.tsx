'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  UserRound,
  LogOut,
  CheckCircle2,
  Globe,
  PenLine,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CREATOR_EXPERIENCE_ENABLED, SOCIAL_FEED_ENABLED } from '@/lib/mvp-reviews';
import { getFullImageUrl } from '@/utils/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { reviewerNavItems } from '@/components/review-dashboard/reviewerNavigation';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMonthYear(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
}

export function UserAvatarDropdown({
  compact = false,
  onCompactClick,
}: {
  compact?: boolean;
  onCompactClick?: () => void;
}) {
  const { user, logout, reviewerProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  if (!user) return null;

  // Reviewer-specific navigation only in the reviewer area; other roles stay unchanged.
  const isReviewerContext = user.role === 'review' && !!pathname?.startsWith('/review-dashboard');

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  const isCreator = reviewerProfile?.creator_enabled === true;
  const creatorSlug = reviewerProfile?.public_slug;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu da conta"
          onClick={(event) => {
            if (compact && onCompactClick) {
              event.preventDefault();
              onCompactClick();
            }
          }}
          className={cn(
            'group flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white p-1 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
            compact ? 'h-[40px] px-1.5' : 'h-[44px] xl:h-[40px] max-w-[115px]'
          )}
        >
          {user.avatar_url ? (
            <Image
              src={getFullImageUrl(user.avatar_url)}
              alt={user.name || 'Avatar'}
              width={34}
              height={34}
              unoptimized
              className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-white/10"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {initialsFromName(user.name)}
            </div>
          )}
          <span
            className={cn(
              'max-w-[54px] truncate text-xs font-semibold text-slate-700 dark:text-white/80',
              compact ? 'hidden' : 'hidden sm:block'
            )}
          >
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-1rem))] max-h-[min(80dvh,680px)] overflow-y-auto overscroll-contain rounded-2xl border-slate-200/80 p-0 shadow-2xl bg-white z-[2000]"
      >
        {/* Card de Perfil */}
        <div className="flex flex-col items-center p-6 text-center bg-slate-50/50">
          <div className="relative mb-3">
            {user.avatar_url ? (
              <Image
                src={getFullImageUrl(user.avatar_url)}
                alt={user.name}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg border-2 border-white shadow-md">
                {initialsFromName(user.name)}
              </div>
            )}
            {!isReviewerContext && (
              <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white shadow">
                <CheckCircle2 className="h-3 w-3 fill-white text-emerald-500" />
              </div>
            )}
          </div>

          <h4 className="text-base font-bold text-slate-900 line-clamp-1">{user.name}</h4>
          {isReviewerContext && reviewerProfile?.profession && (
            <p className="mt-1 text-xs text-slate-600">{reviewerProfile.profession}</p>
          )}
          {isReviewerContext && reviewerProfile?.company_name && (
            <p className="mt-1 text-xs text-slate-600">{reviewerProfile.company_name}</p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            Membro desde {formatMonthYear(user.created_at)}
          </p>
        </div>

        <Separator />

        {/* Links do Menu */}
        <div className="p-2 space-y-0.5">
          {isReviewerContext ? (
            reviewerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50',
                    pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })
          ) : (
            <>
              {SOCIAL_FEED_ENABLED && <Link
                href="/feed"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Globe className="h-4.5 w-4.5 text-slate-400" />
                Feed
              </Link>}

              <Link
                href="/review-dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LayoutDashboard className="h-4.5 w-4.5 text-slate-400" />
                Meu Painel
              </Link>

              {CREATOR_EXPERIENCE_ENABLED && isCreator && (
                <>
                  <Link
                    href="/creator-studio"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <PenLine className="h-4.5 w-4.5 text-slate-400" />
                    Creator Studio
                  </Link>

                  {creatorSlug && (
                    <Link
                      href={`/creators/${creatorSlug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-4.5 w-4.5 text-slate-400" />
                      Meu Perfil Público
                    </Link>
                  )}
                </>
              )}

              <Link
                href="/review-dashboard/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserRound className="h-4.5 w-4.5 text-slate-400" />
                Configurações
              </Link>

            </>
          )}
        </div>

        <Separator />

        {/* Sair */}
        <div className="p-2 bg-slate-50/50">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 text-red-500" />
            Sair da Conta
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
