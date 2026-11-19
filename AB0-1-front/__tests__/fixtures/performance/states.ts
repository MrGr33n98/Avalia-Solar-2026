/** Deterministic unit fixtures, NEVER injected into production result lists. */
export const performanceStates = {
  success: { state: 'success' as const, data: [{ id: 1, name: 'Mock for tests only' }], total: 1 },
  empty: { state: 'empty' as const, data: [], total: 0 },
  error: { state: 'error' as const, error: new Error('Simulated upstream outage') },
  pending: { state: 'pending' as const, previousData: [{ id: 1, name: 'Previous test card' }] },
};
