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

export type InternalPromotionMeta = {
  internal_promotion_id: string;
  surface: 'public';
  placement: string;
  article_id: string;
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

export const buildArticleLink = (meta: ArticleLinkMeta): {
  url: string;
  utm: UTMParams;
  internalPromotion: InternalPromotionMeta;
} => {
  const current = getCurrentUTMs();
  const utm: UTMParams = {
    // UTMs pertencem à aquisição externa. Links internos não podem sobrescrevê-las.
    utm_source: current.utm_source || '',
    utm_medium: current.utm_medium || '',
    utm_campaign: current.utm_campaign || '',
    utm_content: current.utm_content || '',
    utm_term: current.utm_term || '',
  };
  const internalPromotion: InternalPromotionMeta = {
    internal_promotion_id: `blog:${normalizeTerm(meta.slugOrId) || 'article'}`,
    surface: 'public',
    placement: meta.placement,
    article_id: String(meta.slugOrId),
  };
  const basePath = `/blog/${encodeURIComponent(meta.slugOrId)}`;
  const relativeUrl = basePath;

  if (!meta.absolute) {
    return { url: relativeUrl, utm, internalPromotion };
  }

  const origin =
    (typeof window !== 'undefined' && window.location?.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.avaliasolar.com.br';

  return {
    url: new URL(relativeUrl, origin).toString(),
    utm,
    internalPromotion,
  };
};
