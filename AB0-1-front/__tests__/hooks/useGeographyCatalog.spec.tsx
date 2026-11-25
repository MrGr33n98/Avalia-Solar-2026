import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { companiesApiSafe } from '@/lib/api-client';
import {
  persistCityCatalog,
  type CityCatalog,
} from '@/lib/geography/catalog';
import { useGeographyCatalog } from '@/hooks/useGeographyCatalog';

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getGeographicCities: jest.fn(),
  },
}));

const getGeographicCities = jest.mocked(companiesApiSafe.getGeographicCities);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, Wrapper };
}

const catalog = (uf: string, cities: string[], revision = 'catalog-r1'): CityCatalog => ({
  uf,
  cities,
  revision,
  updatedAt: Date.now(),
});

describe('useGeographyCatalog', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getGeographicCities.mockReset();
  });

  it('lê o cache persistido antes de buscar a mesma UF na rede', async () => {
    persistCityCatalog(catalog('SC', ['Florianópolis']));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGeographyCatalog(['SC']), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.citiesByState.SC).toEqual(['Florianópolis']);
    });

    expect(getGeographicCities).not.toHaveBeenCalled();
  });

  it('busca a UF selecionada sem aguardar timer artificial', async () => {
    getGeographicCities.mockResolvedValue(catalog('SP', ['São Paulo']));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGeographyCatalog([]), { wrapper: Wrapper });

    await act(async () => {
      await result.current.requestCities(' sp ');
    });

    expect(getGeographicCities).toHaveBeenCalledTimes(1);
    expect(getGeographicCities).toHaveBeenCalledWith('SP', expect.any(AbortSignal));
  });

  it('mantém cada resposta associada à UF e ignora a resposta antiga na seleção atual', async () => {
    const sc = deferred<CityCatalog>();
    const sp = deferred<CityCatalog>();
    getGeographicCities.mockImplementation((uf) => (uf === 'SC' ? sc.promise : sp.promise));
    const { Wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ states }: { states: string[] }) => useGeographyCatalog(states),
      { initialProps: { states: ['SC'] }, wrapper: Wrapper }
    );

    await waitFor(() => expect(getGeographicCities).toHaveBeenCalledWith('SC', expect.any(AbortSignal)));
    rerender({ states: ['SP'] });
    await waitFor(() => expect(getGeographicCities).toHaveBeenCalledWith('SP', expect.any(AbortSignal)));

    await act(async () => {
      sp.resolve(catalog('SP', ['São Paulo']));
      await sp.promise;
    });
    await act(async () => {
      sc.resolve(catalog('SC', ['Florianópolis']));
      await sc.promise;
    });

    expect(result.current.citiesByState).toEqual({ SP: ['São Paulo'] });
    expect(result.current.cities).toEqual([{ city: 'São Paulo', state: 'SP', count: 0 }]);
  });

  it('deduplica a mesma UF entre consumidores no QueryClient compartilhado', async () => {
    const response = deferred<CityCatalog>();
    getGeographicCities.mockReturnValue(response.promise);
    const { Wrapper } = createWrapper();
    const first = renderHook(() => useGeographyCatalog(['MG']), { wrapper: Wrapper });
    const second = renderHook(() => useGeographyCatalog(['MG']), { wrapper: Wrapper });

    await waitFor(() => expect(getGeographicCities).toHaveBeenCalledTimes(1));
    await act(async () => {
      response.resolve(catalog('MG', ['Belo Horizonte']));
      await response.promise;
    });

    await waitFor(() => {
      expect(first.result.current.citiesByState.MG).toEqual(['Belo Horizonte']);
      expect(second.result.current.citiesByState.MG).toEqual(['Belo Horizonte']);
    });
  });

  it('preserva dados válidos em memória quando o storage bloqueia gravações', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage bloqueado', 'QuotaExceededError');
    });
    getGeographicCities.mockResolvedValue(catalog('MT', ['Cuiabá']));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGeographyCatalog(['MT']), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.citiesByState.MT).toEqual(['Cuiabá']));
    expect(result.current.errorByState.MT).toBeNull();
    setItem.mockRestore();
  });
});
