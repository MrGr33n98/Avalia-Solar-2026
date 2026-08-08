'use client';

import React, { useId } from 'react';
import { normalizeCategoryKey } from '@/lib/categoryIcons';

export type MonochromeIconKey =
  | 'sun'
  | 'bus'
  | 'scooter'
  | 'charge'
  | 'chart'
  | 'grid'
  | null;

const SVG_CATEGORY_MAP: Record<string, MonochromeIconKey> = {
  'energia-solar': 'sun',
  'frotas-eletricas': 'bus',
  'frota-eletrica': 'bus',
  'mobilidade-eletrica': 'scooter',
  'hubs-de-eletromobilidade-e-recarga': 'charge',
  'mercado-livre-de-energia': 'chart',
};

export function getMonochromeIconKey(name?: string | null, slug?: string | null): MonochromeIconKey {
  const candidates = [
    normalizeCategoryKey(slug),
    normalizeCategoryKey(name),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (SVG_CATEGORY_MAP[candidate]) return SVG_CATEGORY_MAP[candidate];

    // Match parcial
    if (candidate.includes('energia-solar') || candidate.includes('solar')) return 'sun';
    if (candidate.includes('frota')) return 'bus';
    if (candidate.includes('mobilidade') || candidate.includes('scooter') || candidate.includes('moto')) return 'scooter';
    if (candidate.includes('eletromobilidade') || candidate.includes('recarga') || candidate.includes('hubs')) return 'charge';
    if (candidate.includes('mercado-livre') || candidate.includes('mercado')) return 'chart';
  }

  return null;
}

interface CategoryMonochromeIconProps {
  name?: string | null;
  slug?: string | null;
  icon?: MonochromeIconKey;
  className?: string;
}

export const CategoryMonochromeIcon: React.FC<CategoryMonochromeIconProps> = ({
  name,
  slug,
  icon,
  className = 'h-full w-full',
}) => {
  const key = icon ?? getMonochromeIconKey(name, slug);
  const uid = useId().replace(/:/g, '');

  if (!key) return null;

  const renderIcon = () => {
    switch (key) {
      case 'sun': {
        const gradId = `sunMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#333" />
                <stop offset="100%" stopColor="#111" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="4" fill={`url(#${gradId})`} />
            <path
              d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"
              stroke={`url(#${gradId})`}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      }

      case 'bus': {
        const gradId = `busMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#333" />
                <stop offset="100%" stopColor="#111" />
              </linearGradient>
            </defs>
            <rect x="3" y="6" width="18" height="11" rx="2.5" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="3" y="6" width="18" height="11" rx="2.5" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M6 17v2M18 17v2" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="6" cy="20" r="1.5" fill={`url(#${gradId})`} />
            <circle cx="18" cy="20" r="1.5" fill={`url(#${gradId})`} />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M12 10v2" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      }

      case 'scooter': {
        const gradId = `scootMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#333" />
                <stop offset="100%" stopColor="#111" />
              </linearGradient>
            </defs>
            <circle cx="6" cy="17" r="2.5" fill={`url(#${gradId})`} opacity="0.12" />
            <circle cx="18" cy="17" r="2.5" fill={`url(#${gradId})`} opacity="0.12" />
            <circle cx="6" cy="17" r="2.5" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <circle cx="18" cy="17" r="2.5" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M6 17l3-7h6l3 7" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <path d="M9 10l-1.5-2.5M15 10l1.5-2.5" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9 10h6" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 7v3" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      }

      case 'charge': {
        const gradId = `chargeMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#333" />
                <stop offset="100%" stopColor="#111" />
              </linearGradient>
            </defs>
            <rect x="10" y="2" width="4" height="6" rx="1" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="10" y="2" width="4" height="6" rx="1" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M12 8v8" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" />
            <rect x="6" y="16" width="12" height="6" rx="1.5" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="6" y="16" width="12" height="6" rx="1.5" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M8 16v-2a4 4 0 018 0v2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <path d="M12 12l-1.5 2h3l-1.5 2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
          </svg>
        );
      }

      case 'chart': {
        const gradId = `chartMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#333" />
                <stop offset="100%" stopColor="#111" />
              </linearGradient>
            </defs>
            <path d="M3 3v18h18" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-5 4 3 4-6" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <circle cx="7" cy="16" r="2" fill={`url(#${gradId})`} />
            <circle cx="11" cy="11" r="2" fill={`url(#${gradId})`} />
            <circle cx="15" cy="14" r="2" fill={`url(#${gradId})`} />
            <circle cx="19" cy="8" r="2" fill={`url(#${gradId})`} />
          </svg>
        );
      }

      case 'grid': {
        const gradId = `gridMono-${uid}`;
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#555" />
                <stop offset="100%" stopColor="#222" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="7" height="7" rx="2" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="14" y="3" width="7" height="7" rx="2" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="3" y="14" width="7" height="7" rx="2" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="14" y="14" width="7" height="7" rx="2" fill={`url(#${gradId})`} opacity="0.12" />
            <rect x="3" y="3" width="7" height="7" rx="2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <rect x="14" y="3" width="7" height="7" rx="2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <rect x="3" y="14" width="7" height="7" rx="2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
            <rect x="14" y="14" width="7" height="7" rx="2" stroke={`url(#${gradId})`} strokeWidth="1.8" fill="none" />
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return renderIcon();
};

CategoryMonochromeIcon.displayName = 'CategoryMonochromeIcon';
