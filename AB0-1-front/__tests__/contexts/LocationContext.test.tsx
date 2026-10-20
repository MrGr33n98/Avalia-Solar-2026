import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';

describe('LocationContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'user_state=; max-age=0';
    document.cookie = 'user_city=; max-age=0';
  });

  it('provides default state "SC" and label "Santa Catarina"', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocationProvider defaultState="SC">{children}</LocationProvider>
    );

    const { result } = renderHook(() => useLocation(), { wrapper });

    expect(result.current.selectedState).toBe('SC');
    expect(result.current.stateLabel).toBe('Santa Catarina');
    expect(result.current.selectedCity).toBeNull();
    expect(result.current.location.source).toBe('default');
  });

  it('updates state and persists to localStorage and document.cookie', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocationProvider defaultState="SC">{children}</LocationProvider>
    );

    const { result } = renderHook(() => useLocation(), { wrapper });

    act(() => {
      result.current.setState('SP');
    });

    expect(result.current.selectedState).toBe('SP');
    expect(result.current.stateLabel).toBe('São Paulo');
    expect(result.current.location.source).toBe('explicit');
    expect(result.current.location.status).toBe('confirmed');
    expect(localStorage.getItem('user_state')).toBe('SP');
    expect(document.cookie).toContain('user_state=SP');
  });

  it('updates city and resets city when state changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocationProvider defaultState="SC">{children}</LocationProvider>
    );

    const { result } = renderHook(() => useLocation(), { wrapper });

    act(() => {
      result.current.setCity('Florianópolis');
    });

    expect(result.current.selectedCity).toBe('Florianópolis');
    expect(localStorage.getItem('user_city')).toBe('Florianópolis');

    // Switching state should reset city to prevent mismatched location
    act(() => {
      result.current.setState('PR');
    });

    expect(result.current.selectedState).toBe('PR');
    expect(result.current.stateLabel).toBe('Paraná');
    expect(result.current.selectedCity).toBeNull();
    expect(localStorage.getItem('user_city')).toBeNull();
  });

  it('resets location to default state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocationProvider defaultState="SC">{children}</LocationProvider>
    );

    const { result } = renderHook(() => useLocation(), { wrapper });

    act(() => {
      result.current.setState('RJ');
      result.current.setCity('Niterói');
    });

    expect(result.current.selectedState).toBe('RJ');

    act(() => {
      result.current.resetLocation();
    });

    expect(result.current.selectedState).toBe('SC');
    expect(result.current.selectedCity).toBeNull();
    expect(localStorage.getItem('user_state')).toBeNull();
  });
});
