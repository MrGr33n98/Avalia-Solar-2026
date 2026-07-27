import { isRealtimeEnabled } from '@/lib/cable';

describe('isRealtimeEnabled', () => {
  const originalRealtimeFlag = process.env.NEXT_PUBLIC_ENABLE_REALTIME;
  const originalLegacyFlag = process.env.NEXT_PUBLIC_ENABLE_REALTIME_DASHBOARD;

  afterEach(() => {
    if (originalRealtimeFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_REALTIME;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_REALTIME = originalRealtimeFlag;
    }

    if (originalLegacyFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_REALTIME_DASHBOARD;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_REALTIME_DASHBOARD = originalLegacyFlag;
    }
  });

  it('keeps ActionCable disabled when production build explicitly opts out', () => {
    process.env.NEXT_PUBLIC_ENABLE_REALTIME = 'false';
    process.env.NEXT_PUBLIC_ENABLE_REALTIME_DASHBOARD = 'true';

    expect(isRealtimeEnabled()).toBe(false);
  });

  it('allows ActionCable only when production build explicitly opts in', () => {
    process.env.NEXT_PUBLIC_ENABLE_REALTIME = 'true';

    expect(isRealtimeEnabled()).toBe(true);
  });
});
