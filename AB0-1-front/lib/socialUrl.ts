export type SocialUrlKind = 'instagram' | 'linkedin' | 'youtube' | 'website';

const SOCIAL_HOSTS: Record<SocialUrlKind, string> = {
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/in/',
  youtube: 'https://www.youtube.com/@',
  website: 'https://',
};

export function normalizeSocialUrl(value: string | null | undefined, kind: SocialUrlKind): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const username = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
  if (!username) return '';
  return `${SOCIAL_HOSTS[kind]}${username}`;
}
