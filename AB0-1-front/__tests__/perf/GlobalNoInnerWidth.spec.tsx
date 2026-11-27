import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { useComparison } from '@/hooks/useComparison';
import { PostHogProvider } from '@/components/PostHogProvider';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import { useReportWebVitals } from 'next/web-vitals';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('next/web-vitals', () => ({
  useReportWebVitals: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  companiesApi: {
    getComparisonSnapshots: jest.fn().mockResolvedValue({ schema_version: 1, companies: [], missing_ids: [] }),
    getById: jest.fn(),
  },
}));

type Listener = () => void;

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const add = jest.fn((_: string, cb: Listener) => listeners.add(cb));
  const remove = jest.fn((_: string, cb: Listener) => listeners.delete(cb));
  (window.matchMedia as jest.Mock) = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: add,
    removeEventListener: remove,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  return { listeners, add, remove };
}

describe('Spec 022 Fase D1 — Componentes globais sem leitura de window.innerWidth', () => {
  let innerWidthDescriptor: PropertyDescriptor | undefined;
  let innerWidthGetter: jest.Mock;

  beforeEach(() => {
    innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    innerWidthGetter = jest.fn(() => 1024);
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      get: innerWidthGetter,
    });
    mockMatchMedia(false);
  });

  afterEach(() => {
    if (innerWidthDescriptor) {
      Object.defineProperty(window, 'innerWidth', innerWidthDescriptor);
    }
    jest.clearAllMocks();
  });

  it('useComparison não lê window.innerWidth na montagem nem na resolução de limite', () => {
    const { result } = renderHook(() => useComparison());
    expect(innerWidthGetter).not.toHaveBeenCalled();
    expect(result.current.experience).toBe('desktop');
    expect(result.current.maxComparison).toBe(3);
  });

  it('PostHogProvider não lê window.innerWidth na montagem ou inicialização', () => {
    render(<PostHogProvider><div>test</div></PostHogProvider>);
    expect(innerWidthGetter).not.toHaveBeenCalled();
  });

  it('WebVitalsReporter não lê window.innerWidth ao reportar métricas', () => {
    let reportCallback: ((metric: Record<string, unknown>) => void) | undefined;
    (useReportWebVitals as jest.Mock).mockImplementation((cb) => {
      reportCallback = cb;
    });

    render(<WebVitalsReporter />);
    expect(reportCallback).toBeDefined();

    reportCallback!({
      id: 'test-metric-1',
      name: 'LCP',
      value: 1200,
      rating: 'good',
      navigationType: 'navigate',
    });

    expect(innerWidthGetter).not.toHaveBeenCalled();
  });
});
