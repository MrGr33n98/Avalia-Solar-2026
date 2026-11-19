import {
  reviewerNavItems,
  mobileBottomNavItems,
  mobileDrawerItems,
  isNavItemActive,
} from './reviewerNavigation';

// Regression: production defaults to the reviews-only MVP, which must not hide
// Achievements from the reviewer's navigation.
jest.mock('@/lib/mvp-reviews', () => ({
  REVIEWS_ONLY_MVP: true,
}));

describe('Reviewer Achievements navigation (G2-style)', () => {
  it('keeps Conquistas as an independent sidebar entry in reviews-only mode', () => {
    expect(reviewerNavItems.map((item) => item.id)).toEqual([
      'dashboard',
      'reviews',
      'solutions',
      'achievements',
      'profile',
    ]);

    expect(reviewerNavItems.find((item) => item.id === 'achievements')).toEqual(
      expect.objectContaining({
        label: 'Conquistas',
        href: '/review-dashboard/achievements',
        section: 'main',
        analyticsKey: 'reviewer_nav_achievements',
      })
    );
  });

  it('places Conquistas in mobile Mais without expanding the bottom bar', () => {
    expect(mobileBottomNavItems.some((item) => item.id === 'achievements')).toBe(false);
    expect(mobileDrawerItems.find((item) => item.id === 'achievements')).toEqual(
      expect.objectContaining({ href: '/review-dashboard/achievements' })
    );
  });

  it('highlights only the achievements route when it is active', () => {
    const achievements = reviewerNavItems.find((item) => item.id === 'achievements');
    expect(achievements).toBeDefined();

    expect(isNavItemActive('/review-dashboard/achievements', achievements!)).toBe(true);
    expect(isNavItemActive('/review-dashboard/achievements/unlocked', achievements!)).toBe(true);
    expect(isNavItemActive('/review-dashboard/profile', achievements!)).toBe(false);
  });
});
