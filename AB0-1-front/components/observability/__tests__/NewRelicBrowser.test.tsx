import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { TextEncoder as NodeTextEncoder } from 'node:util';

import NewRelicBrowser from '../NewRelicBrowser';
import {
  hasAnalyticsConsent,
  onConsentChange,
} from '@/lib/analytics/consent';

const mockUseAuth = jest.fn();
let consentListener: ((consent: { analytics: boolean }) => void) | undefined;

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/analytics/consent', () => ({
  hasAnalyticsConsent: jest.fn(),
  onConsentChange: jest.fn((callback) => {
    consentListener = callback;
    return jest.fn();
  }),
}));

jest.mock('next/script', () => {
  return function MockScript({ id, src, strategy, onLoad }: ComponentProps<'script'>) {
    return (
      <button
        data-testid={id}
        data-src={src}
        data-strategy={strategy}
        onClick={() => onLoad?.({} as never)}
      />
    );
  };
});

const REQUIRED_ENV = {
  NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED: 'true',
  NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID: 'account-id',
  NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID: 'application-id',
  NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY: 'browser-license-key',
  NEXT_PUBLIC_NEW_RELIC_TRUST_KEY: 'trust-key',
  NEXT_PUBLIC_NEW_RELIC_AGENT_ID: 'agent-id',
  NEXT_PUBLIC_NEW_RELIC_ENVIRONMENT: 'test',
  NEXT_PUBLIC_NEW_RELIC_RELEASE: 'test-release',
};

describe('NewRelicBrowser', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    consentListener = undefined;
    mockUseAuth.mockReturnValue({ user: null });
    Object.assign(process.env, REQUIRED_ENV);
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value: 'production',
    });
    delete (window as Window & { __avaliaSolarNewRelicState?: string })
      .__avaliaSolarNewRelicState;
    delete (window as Window & { NREUM?: unknown }).NREUM;
    delete (window as Window & { newrelic?: unknown }).newrelic;
    (hasAnalyticsConsent as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value: originalNodeEnv,
    });
  });

  it('não carrega fora de produção', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value: 'development',
    });

    render(<NewRelicBrowser />);

    expect(screen.queryByTestId('new-relic-browser-agent')).not.toBeInTheDocument();
  });

  it('não carrega quando a feature flag está desativada', () => {
    process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED = 'false';

    render(<NewRelicBrowser />);

    expect(screen.queryByTestId('new-relic-browser-agent')).not.toBeInTheDocument();
  });

  it('não carrega sem consentimento de analytics', () => {
    (hasAnalyticsConsent as jest.Mock).mockReturnValue(false);

    render(<NewRelicBrowser />);

    expect(screen.queryByTestId('new-relic-browser-agent')).not.toBeInTheDocument();
  });

  it('carrega uma única vez com estratégia não bloqueante', () => {
    const first = render(<NewRelicBrowser />);
    const second = render(<NewRelicBrowser />);

    expect(screen.getAllByTestId('new-relic-browser-agent')).toHaveLength(1);
    expect(screen.getByTestId('new-relic-browser-agent')).toHaveAttribute(
      'data-strategy',
      'afterInteractive',
    );

    first.unmount();
    second.unmount();
  });

  it('interrompe a coleta e não reinicia após revogação', () => {
    const consent = jest.fn();
    const setUserId = jest.fn();
    (window as Window & { newrelic?: unknown }).newrelic = {
      consent,
      setUserId,
    };

    render(<NewRelicBrowser />);
    fireEvent.click(screen.getByTestId('new-relic-browser-agent'));

    act(() => consentListener?.({ analytics: false }));
    expect(consent).toHaveBeenLastCalledWith(false);
    expect(setUserId).toHaveBeenCalledWith(null, true);
    expect(screen.queryByTestId('new-relic-browser-agent')).not.toBeInTheDocument();

    act(() => consentListener?.({ analytics: true }));
    expect(screen.queryByTestId('new-relic-browser-agent')).not.toBeInTheDocument();
  });

  it('envia somente ID pseudonimizado e metadados controlados', async () => {
    const setUserId = jest.fn();
    const setCustomAttribute = jest.fn();
    const setApplicationVersion = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: 27,
        email: 'nao-enviar@example.com',
        phone: '000000000',
        name: 'Não enviar',
      },
    });
    Object.defineProperty(globalThis.crypto, 'subtle', {
      configurable: true,
      value: {
        digest: jest.fn().mockResolvedValue(new Uint8Array(32).fill(1).buffer),
      },
    });
    Object.defineProperty(globalThis, 'TextEncoder', {
      configurable: true,
      value: NodeTextEncoder,
    });
    (window as Window & { newrelic?: unknown }).newrelic = {
      consent: jest.fn(),
      setUserId,
      setCustomAttribute,
      setApplicationVersion,
    };

    render(<NewRelicBrowser />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('new-relic-browser-agent'));
    });

    expect(setUserId).toHaveBeenCalledTimes(1);
    expect(setUserId.mock.calls[0][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(setUserId.mock.calls[0][0]).not.toContain('27');
    expect(setCustomAttribute).toHaveBeenCalledWith('environment', 'test');
    expect(setApplicationVersion).toHaveBeenCalledWith('test-release');
    expect(JSON.stringify(setUserId.mock.calls)).not.toContain('nao-enviar');
  });

  it('registra e remove o listener de consentimento', () => {
    const cleanup = jest.fn();
    (onConsentChange as jest.Mock).mockReturnValue(cleanup);

    const { unmount } = render(<NewRelicBrowser />);
    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
