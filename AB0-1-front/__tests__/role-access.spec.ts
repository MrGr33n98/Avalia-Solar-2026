import { canAccessReviewDashboard } from '@/lib/auth/role-access';

describe('canAccessReviewDashboard', () => {
  it.each(['review', 'admin'] as const)('allows the %s role', (role) => {
    expect(canAccessReviewDashboard(role)).toBe(true);
  });

  it.each(['company', null, undefined] as const)('rejects unsupported role %s', (role) => {
    expect(canAccessReviewDashboard(role)).toBe(false);
  });
});
