import { act, renderHook, waitFor } from '@testing-library/react';
import { REALTIME_REFRESH_DEBOUNCE_MS, useCompanyDashboardData } from './useCompanyDashboardData';

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const mockGetById = jest.fn();
const mockGetFeatureAccess = jest.fn();
const mockFetchApi = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('@/lib/api', () => ({
  companiesApi: {
    getById: (...args: unknown[]) => mockGetById(...args),
    getFeatureAccess: (...args: unknown[]) => mockGetFeatureAccess(...args),
  },
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

jest.mock('@/lib/cable', () => ({
  subscribeCompanyDashboard: (...args: unknown[]) => mockSubscribe(...args),
}));

const statsFor = (views: number) => ({ stats: { profile_views: views } });

describe('useCompanyDashboardData', () => {
  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    mockGetById.mockReset();
    mockGetFeatureAccess.mockReset().mockResolvedValue({ features: {} });
    mockFetchApi.mockReset().mockImplementation((path: string) =>
      Promise.resolve(path.endsWith('/stats') ? statsFor(1) : { notifications: [] })
    );
    mockSubscribe.mockReset().mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('descarta resposta atrasada da empresa A depois de trocar para B (D0 H03)', async () => {
    const companyA = deferred<unknown>();
    const statsA = deferred<unknown>();
    mockGetById.mockImplementation((id: number) =>
      id === 9001 ? companyA.promise : Promise.resolve({ id: 9002, name: 'FIXTURE Solar B' })
    );
    mockFetchApi.mockImplementation((path: string, opts: { params: { company_id: string } }) => {
      if (path.endsWith('/stats')) {
        return opts.params.company_id === '9001' ? statsA.promise : Promise.resolve(statsFor(222));
      }
      return Promise.resolve({ notifications: [] });
    });

    const { result, rerender } = renderHook(({ id }) => useCompanyDashboardData(id), {
      initialProps: { id: '9001' },
    });

    rerender({ id: '9002' });
    await waitFor(() => expect(result.current.company?.id).toBe(9002));
    await waitFor(() => expect(result.current.stats?.profileViews).toBe(222));

    await act(async () => {
      companyA.resolve({ id: 9001, name: 'FIXTURE Solar A' });
      statsA.resolve(statsFor(111));
      await Promise.resolve();
    });

    expect(result.current.company?.id).toBe(9002);
    expect(result.current.stats?.profileViews).toBe(222);
  });

  it('agrupa rajada de eventos realtime num único refresh (D0 H02)', async () => {
    mockGetById.mockResolvedValue({ id: 9001 });
    let onEvent: () => void = () => {};
    mockSubscribe.mockImplementation((_id: string, cb: () => void) => {
      onEvent = cb;
      return () => {};
    });

    const { result } = renderHook(() => useCompanyDashboardData('9001'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.stats).not.toBeNull());

    jest.useFakeTimers();
    const statsCallsBefore = mockFetchApi.mock.calls.filter(([p]) => p.endsWith('/stats')).length;

    act(() => {
      onEvent();
      onEvent();
      onEvent();
    });
    await act(async () => {
      jest.advanceTimersByTime(REALTIME_REFRESH_DEBOUNCE_MS);
    });

    const statsCallsAfter = mockFetchApi.mock.calls.filter(([p]) => p.endsWith('/stats')).length;
    expect(statsCallsAfter - statsCallsBefore).toBe(1);
  });

  it('cancela refresh pendente ao desmontar', async () => {
    mockGetById.mockResolvedValue({ id: 9001 });
    let onEvent: () => void = () => {};
    mockSubscribe.mockImplementation((_id: string, cb: () => void) => {
      onEvent = cb;
      return () => {};
    });

    const { result, unmount } = renderHook(() => useCompanyDashboardData('9001'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    jest.useFakeTimers();
    const callsBefore = mockFetchApi.mock.calls.length;
    act(() => onEvent());
    unmount();
    jest.advanceTimersByTime(REALTIME_REFRESH_DEBOUNCE_MS * 2);
    expect(mockFetchApi.mock.calls.length).toBe(callsBefore);
  });
});
