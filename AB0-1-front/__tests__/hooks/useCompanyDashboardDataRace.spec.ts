import { renderHook, waitFor } from '@testing-library/react';
import { useCompanyDashboardData } from '@/app/dashboard/hooks/useCompanyDashboardData';
import { companiesApi, fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  companiesApi: {
    getById: jest.fn(),
    getFeatureAccess: jest.fn(),
  },
  fetchApi: jest.fn(),
}));

jest.mock('@/lib/cable', () => ({
  subscribeCompanyDashboard: jest.fn(() => () => {}),
}));

describe('useCompanyDashboardData — Concorrência e AbortController (Spec 022 B0 / H03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aborta requisições em voo da empresa anterior ao trocar para uma nova empresa', async () => {
    let company10Signal: AbortSignal | undefined;
    let company20Signal: AbortSignal | undefined;

    (companiesApi.getById as jest.Mock).mockImplementation((id: number, options?: { signal?: AbortSignal }) => {
      if (id === 10) {
        company10Signal = options?.signal;
        // Simula request lento da empresa 10 (200ms)
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ id: 10, name: 'Empresa 10 (Lenta)' });
          }, 200);
        });
      }
      if (id === 20) {
        company20Signal = options?.signal;
        // Simula request rápido da empresa 20 (20ms)
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ id: 20, name: 'Empresa 20 (Rápida)' });
          }, 20);
        });
      }
      return Promise.resolve(null);
    });

    (companiesApi.getFeatureAccess as jest.Mock).mockResolvedValue({ features: {} });
    (fetchApi as jest.Mock).mockResolvedValue({});

    const { result, rerender } = renderHook(
      ({ id }) => useCompanyDashboardData(id),
      { initialProps: { id: '10' } }
    );

    // Troca rapidamente para a empresa 20 antes de 10 responder
    rerender({ id: '20' });

    // Aguarda empresa 20 carregar
    await waitFor(() => {
      expect(result.current.company?.name).toBe('Empresa 20 (Rápida)');
      expect(result.current.company?.id).toBe(20);
    });

    // O sinal da empresa 10 deve ter sido abortado
    expect(company10Signal?.aborted).toBe(true);

    // Espera tempo suficiente para que a promessa lenta de 10 teria resolvido
    await new Promise((r) => setTimeout(r, 220));

    // A empresa no estado DEVE continuar sendo a 20, NUNCA a 10 sobrescrevendo!
    expect(result.current.company?.name).toBe('Empresa 20 (Rápida)');
    expect(result.current.company?.id).toBe(20);
  });

  it('aborta requisições pendentes ao desmontar o componente', async () => {
    let activeSignal: AbortSignal | undefined;

    (companiesApi.getById as jest.Mock).mockImplementation((_id: number, options?: { signal?: AbortSignal }) => {
      activeSignal = options?.signal;
      return new Promise(() => {}); // nunca resolve
    });
    (companiesApi.getFeatureAccess as jest.Mock).mockImplementation((_id: any, _noCache: any, options?: any) => {
      return new Promise(() => {});
    });
    (fetchApi as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useCompanyDashboardData('10'));

    expect(activeSignal).toBeDefined();
    expect(activeSignal?.aborted).toBe(false);

    unmount();

    expect(activeSignal?.aborted).toBe(true);
  });
});
