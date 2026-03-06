import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TourProvider, useTour } from '../providers/TourProvider';
import { isTourCompleted, resetTour } from '../lib/tour';

vi.mock('../lib/tour', () => ({
  startDashboardTour: vi.fn((callback) => callback?.()),
  isTourCompleted: vi.fn(() => false),
  resetTour: vi.fn(),
}));

describe('TourProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with completed status from localStorage', () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: TourProvider,
    });

    expect(result.current.isCompleted).toBe(false);
  });

  it('provides startTour function', () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: TourProvider,
    });

    expect(typeof result.current.startTour).toBe('function');
  });

  it('provides resetTour function', () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: TourProvider,
    });

    expect(typeof result.current.resetTour).toBe('function');
  });

  it('calls resetTour from lib when resetTour is invoked', () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: TourProvider,
    });

    act(() => {
      result.current.resetTour();
    });

    expect(resetTour).toHaveBeenCalled();
  });

  it('throws error when useTour is used outside provider', () => {
    expect(() => {
      renderHook(() => useTour());
    }).toThrow('useTour must be used within TourProvider');
  });
});
