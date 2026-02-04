import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  authApi: {
    me: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    resendConfirmation: jest.fn(),
  },
  companyAccessApi: {
    context: jest.fn(),
  }
}));

jest.mock('@/lib/authClient', () => ({
  authClient: {
    signIn: {
      social: jest.fn()
    }
  }
}));

jest.mock('@/lib/analytics', () => ({
  identify: jest.fn(),
  track: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
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

describe('AuthContext sync', () => {
  it('keeps the latest auth check result when requests resolve out of order', async () => {
    const initial = createDeferred<any>();
    const first = createDeferred<any>();
    const second = createDeferred<any>();

    (authApi.me as jest.Mock)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.refreshAuth();
      result.current.refreshAuth();
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

    expect(result.current.user?.id).toBe(2);
  });
});
