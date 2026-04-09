import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

// Use fake timers so we can control setTimeout precisely
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update debounced value before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });

    // Value should still be the original — timer hasn't fired
    expect(result.current).toBe('first');
  });

  it('updates debounced value after delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('second');
  });

  it('resets timer when value changes rapidly (debounce behaviour)', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } }
    );

    rerender({ value: 'ab', delay: 400 });
    act(() => jest.advanceTimersByTime(200)); // 200ms in — hasn't fired yet

    rerender({ value: 'abc', delay: 400 });
    act(() => jest.advanceTimersByTime(200)); // another 200ms — still hasn't fired

    // Only 200ms since last change — debounced value is still 'a'
    expect(result.current).toBe('a');

    // Advance another 200ms to reach 400ms since last change
    act(() => jest.advanceTimersByTime(200));

    expect(result.current).toBe('abc');
  });

  it('works with number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 100 });
    expect(result.current).toBe(0);

    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe(100);
  });

  it('works with array values', () => {
    const initial: [number, number] = [0, 50000];
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initial } }
    );

    const updated: [number, number] = [1000, 40000];
    rerender({ value: updated });
    expect(result.current).toEqual([0, 50000]);

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toEqual([1000, 40000]);
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' }); // Start a timer
    unmount(); // Should clear it

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
