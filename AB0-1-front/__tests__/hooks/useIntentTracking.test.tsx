import { act, renderHook } from '@testing-library/react';

import {
  useCopyIntent,
  useFormHesitation,
  useHoverIntent,
  useScrollPause,
} from '@/lib/analytics/hooks/useIntentTracking';

const trackMock = jest.fn();
const getSessionIdMock = jest.fn(() => 'session-123');

jest.mock('@/lib/analytics/index', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

jest.mock('@/lib/analytics/session', () => ({
  getSessionId: () => getSessionIdMock(),
}));

describe('useIntentTracking hooks', () => {
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      ok: true,
    })
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    global.fetch = fetchMock as typeof fetch;
    window.localStorage.setItem('as_anonymous_id', 'anon-123');
    window.history.pushState({}, '', '/companies/empresa-teste');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('sends a hover intent after the threshold', () => {
    const { result } = renderHook(() => useHoverIntent('42', 'phone'));

    act(() => {
      result.current.onMouseEnter();
      jest.advanceTimersByTime(801);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/intent_signals',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(trackMock).toHaveBeenCalledWith(
      'intent_hover_intent',
      expect.objectContaining({
        company_id: '42',
        element_type: 'phone',
        intent_signal: true,
      }),
      expect.objectContaining({ critical: true })
    );
  });

  it('tracks copy intent without leaking copied text', () => {
    const { result } = renderHook(() => useCopyIntent('42', 'phone'));
    const selection = {
      toString: () => '11999998888',
    } as Selection;
    jest.spyOn(window, 'getSelection').mockReturnValue(selection);

    act(() => {
      result.current.onCopy({
        stopPropagation: jest.fn(),
      });
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));

    expect(body.metadata.text_type).toBe('phone');
    expect(body.metadata.text_length).toBe(11);
    expect(JSON.stringify(body)).not.toContain('11999998888');
  });

  it('tracks scroll pauses after 3 seconds', () => {
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 500,
      writable: true,
    });

    renderHook(() => useScrollPause('42', 3000));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(3001);
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(trackMock).toHaveBeenCalledWith(
      'intent_scroll_pause',
      expect.objectContaining({
        company_id: '42',
        signal_type: 'scroll_pause',
      }),
      expect.any(Object)
    );
  });

  it('tracks form hesitation after repeated clears', () => {
    const { result } = renderHook(() => useFormHesitation('42'));

    act(() => {
      result.current.trackFieldChange('email', 'a');
      result.current.trackFieldChange('email', 'ab');
      result.current.trackFieldChange('email', 'abc');
      result.current.trackFieldChange('email', '');
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(trackMock).toHaveBeenCalledWith(
      'intent_form_hesitation',
      expect.objectContaining({
        company_id: '42',
        signal_type: 'form_hesitation',
      }),
      expect.any(Object)
    );
  });
});
