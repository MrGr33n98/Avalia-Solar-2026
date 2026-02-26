import { Trophy } from 'lucide-react';

import type { Company } from '@/lib/api';
import { cn } from '@/lib/utils';

type BadgeSource = {
  title: string;
  subtitle?: string;
};

export type CompanyBadgeSeloVariant = 'card' | 'detail';

type CompanyBadgeSeloProps = {
  company?: Partial<Company> | null;
  variant?: CompanyBadgeSeloVariant;
  className?: string;
};

const parseTopBadge = (value: unknown): BadgeSource | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { title: value.trim() };
  }

  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const title =
      typeof candidate.title === 'string'
        ? candidate.title
        : typeof candidate.label === 'string'
          ? candidate.label
          : typeof candidate.name === 'string'
            ? candidate.name
            : '';

    const subtitle =
      typeof candidate.subtitle === 'string'
        ? candidate.subtitle
        : typeof candidate.description === 'string'
          ? candidate.description
          : undefined;

    if (title.trim().length > 0) {
      return { title: title.trim(), subtitle: subtitle?.trim() || undefined };
    }
  }

  return null;
};

const parseAwards = (value: unknown): BadgeSource | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  const firstAward = value
    .split(/[\n|;,]+/)
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  return firstAward ? { title: firstAward } : null;
};

const parseCompanyBadge = (company?: Partial<Company> | null): BadgeSource | null => {
  const topBadge = parseTopBadge((company as any)?.topBadge ?? (company as any)?.top_badge);
  if (topBadge) return topBadge;

  const awards = parseAwards(company?.awards);
  if (awards) return awards;

  if ((company as any)?.isTopRated === true) {
    return {
      title: '1º Colocado',
      subtitle: 'Melhor empresa avaliada',
    };
  }

  const badges = Array.isArray(company?.badges) ? company!.badges : [];
  const firstBadge = badges.find((badge) => typeof badge?.name === 'string' && badge.name.trim().length > 0);
  if (!firstBadge) return null;

  const editionSuffix =
    firstBadge.edition || firstBadge.year
      ? `Edição ${[firstBadge.edition, firstBadge.year].filter(Boolean).join('/')}`
      : undefined;

  return {
    title: firstBadge.name!.trim(),
    subtitle: firstBadge.category || editionSuffix,
  };
};

export const hasCompanyBadgeSelo = (company?: Partial<Company> | null): boolean => Boolean(parseCompanyBadge(company));

export default function CompanyBadgeSelo({
  company,
  variant = 'card',
  className,
}: CompanyBadgeSeloProps) {
  const badge = parseCompanyBadge(company);
  if (!badge) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-teal-300/70 bg-gradient-to-r from-teal-700 to-teal-500 px-2 py-1 text-white shadow-sm',
        variant === 'detail' ? 'w-28 sm:w-32 md:w-36' : 'w-28 sm:w-32',
        className
      )}
      title={badge.title}
      aria-label={`Selo da empresa: ${badge.title}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
        <Trophy className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-semibold leading-tight sm:text-[11px]">{badge.title}</span>
        {badge.subtitle && (
          <span className="block truncate text-[9px] leading-tight text-teal-50/95 sm:text-[10px]">{badge.subtitle}</span>
        )}
      </span>
    </div>
  );
}
