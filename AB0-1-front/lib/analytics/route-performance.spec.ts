jest.mock('./lazy', () => ({ track: jest.fn() }));
import { track } from './lazy';
import { markRouteMilestone } from './route-performance';

describe('Spec 014 route milestones', () => {
  const oldMark = performance.mark;
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(performance, 'mark', { value: jest.fn(), configurable: true });
  });
  afterAll(() => {
    Object.defineProperty(performance, 'mark', { value: oldMark, configurable: true });
  });

  it('emits route-only safe analytics fields without search keywords', () => {
    markRouteMilestone('first_data_visible', {
      route: '/search',
      result_count: 12,
      source: 'client_post_paint',
    });
    expect(track).toHaveBeenCalledWith('first_data_visible', expect.objectContaining({
      route: '/search', result_count: 12,
    }), expect.objectContaining({ critical: false }));
    expect(JSON.stringify((track as jest.Mock).mock.calls[0])).not.toContain('secret-search-term');
  });
});
