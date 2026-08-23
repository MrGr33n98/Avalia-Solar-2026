import type { SharePlatform, ShareResource } from './shareTypes';

const platformSource: Record<SharePlatform, string> = {
  instagram: 'instagram',
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
  x: 'x',
  facebook: 'facebook',
  copy: 'copy',
  native_share: 'native_share',
};

export function buildAttributedUrl(
  resource: ShareResource,
  platform: SharePlatform,
  format = 'link'
): string {
  const url = new URL(resource.canonicalUrl, typeof window !== 'undefined' ? window.location.origin : 'https://www.avaliasolar.com.br');
  if (platformSource[platform]) {
    url.searchParams.set('utm_source', platformSource[platform]);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'creator_share');
    url.searchParams.set('utm_content', format);
  }
  return url.toString();
}

export function buildPlatformShareUrl(platform: SharePlatform, url: string, title: string): string | null {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'x':
      return `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    default:
      return null;
  }
}
