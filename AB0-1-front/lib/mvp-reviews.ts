/** Reversible MVP scope; no data is deleted when these flags are off. */
export const REVIEWS_ONLY_MVP = process.env.NEXT_PUBLIC_REVIEWS_ONLY_MVP !== 'false';
export const CREATOR_EXPERIENCE_ENABLED =
  !REVIEWS_ONLY_MVP && process.env.NEXT_PUBLIC_CREATOR_EXPERIENCE_ENABLED === 'true';
export const SOCIAL_FEED_ENABLED =
  !REVIEWS_ONLY_MVP && process.env.NEXT_PUBLIC_SOCIAL_FEED_ENABLED === 'true';

const inRoute = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function suspendedSocialDestination(pathname: string): string | null {
  if (!CREATOR_EXPERIENCE_ENABLED) {
    if (inRoute(pathname, '/creator-studio') ||
        inRoute(pathname, '/review-dashboard/publications') ||
        inRoute(pathname, '/review-dashboard/tree')) return '/review-dashboard/reviews';
    if (inRoute(pathname, '/creators')) return '/companies';
  }
  if (!SOCIAL_FEED_ENABLED && inRoute(pathname, '/feed')) return '/companies';
  return null;
}
