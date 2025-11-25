// Deprecated local hook kept for backward compatibility. Prefer using AuthContext.
'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  return useAuthContext() as any;
}