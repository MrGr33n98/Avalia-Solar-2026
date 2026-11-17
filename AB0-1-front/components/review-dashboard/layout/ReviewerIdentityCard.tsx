'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFullImageUrl } from '@/utils/image';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function memberSince(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

/**
 * Compact identity header for reviewer dashboard only.
 * No synthetic verification badge, reputation score or company affiliation.
 * Data comes from the existing authenticated user/reviewer profile context.
 */
export function ReviewerIdentityCard() {
  const { user, reviewerProfile } = useAuth();
  if (!user || (user.role !== 'review' && user.role !== 'admin')) return null;

  const name = user.name?.trim() || 'Nome não informado';
  const avatarUrl = user.avatar_url ? getFullImageUrl(user.avatar_url) : null;
  const profession = reviewerProfile?.profession?.trim();
  const company = reviewerProfile?.company_name?.trim();
  const membershipDate = memberSince(user.created_at);

  return (
    <section
      aria-label="Identidade do avaliador"
      className="mx-3 mb-3 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
      data-testid="reviewer-identity-card"
    >
      <Link
        href="/review-dashboard/profile"
        aria-label="Editar meus dados de perfil"
        className="group relative mx-auto mb-3 block h-16 w-16 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-lg font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 object-cover"
            />
          ) : initials(name)}
        </span>
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm group-hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </Link>
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={name}>{name}</p>
      {profession && <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{profession}</p>}
      {company && <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{company}</p>}
      {membershipDate && (
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          Membro desde {membershipDate}
        </p>
      )}
    </section>
  );
}
