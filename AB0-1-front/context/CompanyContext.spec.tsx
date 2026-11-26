import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyProvider, useCompanyContext } from './CompanyContext';

const mockSelectActive = jest.fn();
const COMPANY_A = { id: 9001, name: 'FIXTURE Solar A' };
const COMPANY_B = { id: 9002, name: 'FIXTURE Solar B' };

jest.mock('@/lib/api', () => ({
  hasPossibleAuthSession: () => true,
  companiesApi: { mine: () => Promise.resolve([COMPANY_A, COMPANY_B]) },
  companyAccessApi: {
    selectActiveCompany: (...args: unknown[]) => mockSelectActive(...args),
  },
}));

jest.mock('@/lib/api-analytics', () => ({
  invalidateAnalyticsAvailability: jest.fn(),
}));

type Deferred = { promise: Promise<void>; resolve: () => void; reject: (e: Error) => void };
const deferred = (): Deferred => {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <CompanyProvider>{children}</CompanyProvider>
    </QueryClientProvider>
  );
}

async function renderContext() {
  const hook = renderHook(() => useCompanyContext(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  await waitFor(() => expect(hook.result.current.activeCompany?.id).toBe(COMPANY_A.id));
  return hook;
}

describe('CompanyContext.selectCompany (D0 H04)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSelectActive.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('seleções repetidas da mesma empresa fazem uma única chamada ao backend', async () => {
    const { result } = await renderContext();
    const request = deferred();
    mockSelectActive.mockReturnValue(request.promise);

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.selectCompany(COMPANY_B as never);
      second = result.current.selectCompany(COMPANY_B as never);
    });

    expect(mockSelectActive).toHaveBeenCalledTimes(1);
    await act(async () => {
      request.resolve();
      await Promise.all([first, second]);
    });
    expect(result.current.activeCompany?.id).toBe(COMPANY_B.id);
  });

  it('a última seleção vence mesmo se a anterior responder depois', async () => {
    const { result } = await renderContext();
    const toB = deferred();
    const toA = deferred();
    mockSelectActive.mockImplementation((id: number) => (id === COMPANY_B.id ? toB.promise : toA.promise));

    let pB!: Promise<void>;
    let pA!: Promise<void>;
    act(() => {
      pB = result.current.selectCompany(COMPANY_B as never);
      pA = result.current.selectCompany(COMPANY_A as never);
    });

    await act(async () => {
      toA.resolve();
      await pA;
    });
    await act(async () => {
      toB.resolve();
      await pB;
    });

    expect(result.current.activeCompany?.id).toBe(COMPANY_A.id);
  });

  it('falha no backend rejeita e mantém a empresa anterior', async () => {
    const { result } = await renderContext();
    mockSelectActive.mockRejectedValue(new Error('403'));

    await act(async () => {
      await expect(result.current.selectCompany(COMPANY_B as never)).rejects.toThrow('403');
    });
    expect(result.current.activeCompany?.id).toBe(COMPANY_A.id);

    mockSelectActive.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.selectCompany(COMPANY_B as never);
    });
    expect(result.current.activeCompany?.id).toBe(COMPANY_B.id);
  });
});
