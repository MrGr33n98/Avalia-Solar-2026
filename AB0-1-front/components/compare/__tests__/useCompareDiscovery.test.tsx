import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRecommendedCompanyCandidates } from '../useCompareDiscovery';

jest.mock('@/lib/api', () => ({ api: { request: jest.fn() } }));

const requestMock = api.request as jest.Mock;
const company = (id: number) => ({ id, name: `Empresa Solar ${id}`, status: 'active', city: 'Florianópolis', state: 'SC' });

function wrapper({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('Compare discovery — candidate pool integration contract', () => {
  beforeEach(() => requestMock.mockReset());

  it('combines contextual and general results to fill eight without duplicates', async () => {
    const local = Array.from({ length: 4 }, (_, index) => company(index + 1));
    const general = Array.from({ length: 10 }, (_, index) => company(index + 4));
    requestMock.mockImplementation(async ({ url }: { url: string }) => ({
      data: url.includes('city=') ? local : general,
    }));

    const { result } = renderHook(() => useRecommendedCompanyCandidates([], 'Florianópolis'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const ids = result.current.data?.map((entry) => entry.id) || [];
    expect(ids).toHaveLength(13);
    expect(new Set(ids).size).toBe(13);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0][0].url).toContain('limit=24');
    expect(requestMock.mock.calls[1][0].url).not.toContain('city=');
  });

  it('keeps partial contextual results if the fallback request fails', async () => {
    requestMock.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes('city=')) return { data: [company(1), company(2)] };
      throw new Error('Regional fallback unavailable');
    });
    const { result } = renderHook(() => useRecommendedCompanyCandidates([], 'Florianópolis'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((item) => item.id)).toEqual([1, 2]);
  });

  it('makes only one global request when there is no location/category context', async () => {
    requestMock.mockResolvedValue({ data: [company(1), company(2)] });
    const { result } = renderHook(() => useRecommendedCompanyCandidates([], null), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
