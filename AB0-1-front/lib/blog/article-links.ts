'use client';

import { getCurrentUTMs } from '@/lib/analytics/utm';

export type ArticleLinkMeta = {
  slugOrId: string;
  placement: string;
  category?: string | null;
  term?: string | null;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  absolute?: boolean;
};

type UTMParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
};

const normalizeTerm = (value?: string | null) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
};

export const buildArticleLink = (meta: ArticleLinkMeta): { url: string; utm: UTMParams } => {
  const current = getCurrentUTMs();
  const utm: UTMParams = {
    utm_source: meta.source || current.utm_source || 'blog',
    utm_medium: meta.medium || current.utm_medium || 'internal',
    utm_campaign: meta.campaign || current.utm_campaign || 'blog_article',
    utm_content: meta.content || meta.placement,
    utm_term: normalizeTerm(meta.term || meta.category || meta.slugOrId || current.utm_term || ''),
  };
  const basePath = `/blog/${encodeURIComponent(meta.slugOrId)}`;
  const params = new URLSearchParams();
  Object.entries(utm).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const query = params.toString();
  const relativeUrl = query ? `${basePath}?${query}` : basePath;

  if (!meta.absolute) {
    return { url: relativeUrl, utm };
  }

  const origin =
    (typeof window !== 'undefined' && window.location?.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.avaliasolar.com.br';

  return {
    url: new URL(relativeUrl, origin).toString(),
    utm,
  };
};
