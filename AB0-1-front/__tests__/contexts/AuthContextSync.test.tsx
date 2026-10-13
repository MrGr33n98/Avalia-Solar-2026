import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authApi, clearAuthSessionHint, setAuthSessionHint, companyAccessApi, reviewerProfileApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  authApi: {
    me: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    resendConfirmation: jest.fn(),
  },
  clearAuthSessionHint: jest.fn(),
  hasPossibleAuthSession: jest.fn(() => true),
  invalidateAuthRefresh: jest.fn(),
  setAuthSessionHint: jest.fn(),
  companyAccessApi: {
    context: jest.fn(),
    selectActiveCompany: jest.fn(),
  },
  reviewerProfileApi: {
    get: jest.fn(),
  },
  getErrorStatus: jest.fn((error: any) => error?.status || error?.context?.status || 500),
  getApiErrorMessage: jest.fn((_error: any, fallback: string) => fallback),
}));

jest.mock('@/lib/authClient', () => ({
  authClient: {
    signIn: {
      social: jest.fn(),
    },
  },
}));

jest.mock('@/lib/analytics/lazy', () => ({
  identify: jest.fn(),
  track: jest.fn(),
  reset: jest.fn(),
}));

jest.mock('@/lib/analytics/identity-stitch', () => ({
  handleUserIdentified: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@sentry/nextjs', () => ({
  setUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext sync & concurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reviewerProfileApi.get as jest.Mock).mockResolvedValue({ profile: null });
    (companyAccessApi.context as jest.Mock).mockResolvedValue({ active_memberships: [] });
  });

  it('keeps the latest auth check result when requests resolve out of order', async () => {
    const initial = createDeferred<any>();
    const first = createDeferred<any>();
    const second = createDeferred<any>();

    (authApi.me as jest.Mock)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let promise1: Promise<boolean>;
    let promise2: Promise<boolean>;

    act(() => {
      promise1 = result.current.refreshAuth({ force: true });
      promise2 = result.current.refreshAuth({ force: true });
    });

    await act(async () => {
      second.resolve({ id: 2, email: 'latest@example.com', name: 'Latest', role: 'company' });
    });

    await act(async () => {
      first.resolve(null);
    });

    await act(async () => {
      initial.resolve(null);
    });

    const [res1, res2] = await Promise.all([promise1!, promise2!]);
    expect(res1).toBe(true);
    expect(res2).toBe(true);
    expect(result.current.user?.id).toBe(2);
  });

  it('deduplicates concurrent checkAuth calls via single-flight so authApi.me is called only once', async () => {
    const deferred = createDeferred<any>();
    (authApi.me as jest.Mock).mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let p1: Promise<boolean>;
    let p2: Promise<boolean>;

    act(() => {
      p1 = result.current.refreshAuth();
      p2 = result.current.refreshAuth();
    });

    // Both should share the single in-flight promise from bootstrap/refresh
    expect(authApi.me).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ id: 10, email: 'singleflight@example.com', name: 'Reviewer', role: 'review' });
    });

    const [ok1, ok2] = await Promise.all([p1!, p2!]);
    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
    expect(result.current.user?.id).toBe(10);
    expect(result.current.user?.role).toBe('review');
  });

  it('never returns false-negative null on superseded check when user was authenticated', async () => {
    const initial = createDeferred<any>();
    const check1 = createDeferred<any>();
    const check2 = createDeferred<any>();

    (authApi.me as jest.Mock)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(check1.promise)
      .mockReturnValueOnce(check2.promise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let check1Promise: Promise<boolean>;
    let check2Promise: Promise<boolean>;

    act(() => {
      check1Promise = result.current.refreshAuth({ force: true });
      check2Promise = result.current.refreshAuth({ force: true });
    });

    // check2 finishes first with valid review user
    await act(async () => {
      check2.resolve({ id: 42, email: 'rev@example.com', name: 'Reviewer 42', role: 'review' });
    });

    // check1 resolves after with null (simulating stale or canceled response)
    await act(async () => {
      check1.resolve(null);
    });

    await act(async () => {
      initial.resolve(null);
    });

    const [ok1, ok2] = await Promise.all([check1Promise!, check2Promise!]);
    // Superseded request must NOT return false when session is valid!
    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
    expect(result.current.user?.id).toBe(42);
  });

  it('invalidates pending check on logout so delayed response never re-authenticates', async () => {
    const pending = createDeferred<any>();
    (authApi.me as jest.Mock).mockReturnValue(pending.promise);
    (authApi.logout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // User triggers logout while request is still pending
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();

    // Now delayed response arrives from before logout
    await act(async () => {
      pending.resolve({ id: 99, email: 'zombie@example.com', name: 'Zombie', role: 'review' });
    });

    // User must remain null!
    expect(result.current.user).toBeNull();
  });

  it('handles transient 5xx error without clearing session hint', async () => {
    const initial = createDeferred<any>();
    const errorDeferred = createDeferred<any>();

    (authApi.me as jest.Mock)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(errorDeferred.promise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshPromise: Promise<boolean>;
    act(() => {
      refreshPromise = result.current.refreshAuth({ force: true });
    });

    await act(async () => {
      const err: any = new Error('Gateway Timeout');
      err.status = 504;
      errorDeferred.reject(err);
    });

    const ok = await refreshPromise!;
    expect(ok).toBe(false);
    expect(result.current.error).toContain('Não foi possível conectar');
    // Transient error must NOT clear session hint!
    expect(clearAuthSessionHint).not.toHaveBeenCalled();
  });

  it('handles definitive 401 failure by clearing session hint and user', async () => {
    const initial = createDeferred<any>();
    const authErrorDeferred = createDeferred<any>();

    (authApi.me as jest.Mock)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(authErrorDeferred.promise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshPromise: Promise<boolean>;
    act(() => {
      refreshPromise = result.current.refreshAuth({ force: true });
    });

    await act(async () => {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      authErrorDeferred.reject(err);
    });

    const ok = await refreshPromise!;
    expect(ok).toBe(false);
    expect(result.current.user).toBeNull();
    expect(clearAuthSessionHint).toHaveBeenCalled();
  });

  it('routes review user without membership or creator to /review-dashboard', async () => {
    const initial = createDeferred<any>();
    (authApi.me as jest.Mock).mockReturnValue(initial.promise);
    (companyAccessApi.context as jest.Mock).mockResolvedValue({ active_memberships: [] });
    (reviewerProfileApi.get as jest.Mock).mockResolvedValue({
      profile: { creator_enabled: false, public_slug: null },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const reviewUser = {
      id: 55,
      email: 'reviewer@gmail.com',
      name: 'Reviewer Test',
      role: 'review' as const,
    };

    const destination = await result.current.getPostLoginDestination(reviewUser as any);
    expect(destination).toContain('/review-dashboard');
  });

  it('routes review user with creator enabled to /feed', async () => {
    const initial = createDeferred<any>();
    (authApi.me as jest.Mock).mockReturnValue(initial.promise);
    (companyAccessApi.context as jest.Mock).mockResolvedValue({ active_memberships: [] });
    (reviewerProfileApi.get as jest.Mock).mockResolvedValue({
      profile: { creator_enabled: true, public_slug: 'solar-expert' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const creatorUser = {
      id: 56,
      email: 'creator@gmail.com',
      name: 'Creator Test',
      role: 'review' as const,
    };

    const destination = await result.current.getPostLoginDestination(creatorUser as any);
    expect(destination).toContain('/feed');
  });

  it('routes review user with active company membership to company dashboard', async () => {
    const initial = createDeferred<any>();
    (authApi.me as jest.Mock).mockReturnValue(initial.promise);
    (companyAccessApi.context as jest.Mock).mockResolvedValue({
      active_memberships: [{ company_id: 101 }],
    });
    (companyAccessApi.selectActiveCompany as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const memberUser = {
      id: 57,
      email: 'member@company.com',
      name: 'Company Member',
      role: 'review' as const,
      company_id: 101,
    };

    const destination = await result.current.getPostLoginDestination(memberUser as any);
    expect(destination).toContain('/dashboard');
    expect(destination).toContain('company_id=101');
  });
});
