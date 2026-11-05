import { CREATOR_EXPERIENCE_ENABLED, REVIEWS_ONLY_MVP, SOCIAL_FEED_ENABLED, suspendedSocialDestination } from './mvp-reviews';

describe('Reviews-only launch routing', () => {
  it('disables both social experiences by default', () => {
    expect(REVIEWS_ONLY_MVP).toBe(true);
    expect(CREATOR_EXPERIENCE_ENABLED).toBe(false);
    expect(SOCIAL_FEED_ENABLED).toBe(false);
  });

  it.each([
    ['/feed', '/companies'],
    ['/feed/', '/companies'],
    ['/creators', '/companies'],
    ['/creators/example/posts/publication', '/companies'],
    ['/creator-studio/publications/new', '/review-dashboard/reviews'],
    ['/review-dashboard/tree', '/review-dashboard/reviews'],
    ['/review-dashboard/publications/42/edit', '/review-dashboard/reviews'],
  ])('redirects suspended path %s to %s', (from, to) => {
    expect(suspendedSocialDestination(from)).toBe(to);
  });

  it.each(['/companies', '/companies/123/review', '/review-dashboard/reviews', '/f/token', '/groups'])(
    'keeps the independent reviews and company journeys: %s',
    (path) => { expect(suspendedSocialDestination(path)).toBeNull(); }
  );
});
