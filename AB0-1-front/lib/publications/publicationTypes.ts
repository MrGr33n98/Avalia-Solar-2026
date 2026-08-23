import type { PublicationType } from '@/types/reviewer-publication';

export const PUBLICATION_TYPES = {
  tip: {
    label: 'Insight',
    shortLabel: 'Insight',
  },
  case_study: {
    label: 'Estudo de caso',
    shortLabel: 'Estudo de caso',
  },
  article: {
    label: 'Artigo',
    shortLabel: 'Artigo',
  },
  project: {
    label: 'Projeto',
    shortLabel: 'Projeto',
  },
} as const satisfies Record<PublicationType, { label: string; shortLabel: string }>;

export function getPublicationTypeLabel(
  type: string | null | undefined,
  variant: 'label' | 'shortLabel' = 'label'
): string {
  if (type && type in PUBLICATION_TYPES) {
    return PUBLICATION_TYPES[type as PublicationType][variant];
  }

  return PUBLICATION_TYPES.article[variant];
}
