import { clearDedupeCache, shouldTrackEvent } from '@/lib/analytics/dedupe';

describe('deduplicação semântica', () => {
  beforeEach(() => {
    clearDedupeCache();
  });

  it('deduplica remounts pela ocorrência lógica, mesmo com novo event_id', () => {
    expect(
      shouldTrackEvent('blog_post_view', 'transport-1', true, 'session-1:post-7', 60_000)
    ).toBe(true);
    expect(
      shouldTrackEvent('blog_post_view', 'transport-2', true, 'session-1:post-7', 60_000)
    ).toBe(false);
    expect(
      shouldTrackEvent('blog_post_view', 'transport-3', true, 'session-1:post-8', 60_000)
    ).toBe(true);
  });
});
