import { useState, useEffect, useCallback } from 'react';
import { icpProfileService } from '@/services/icp-profile-service';
import type { IcpProfile } from '@/types/icp';

export function useIcpProfile(companyId?: string | number) {
  const [profile, setProfile] = useState<IcpProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await icpProfileService.getProfile(companyId);
      setProfile(data);
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido ao obter perfil ICP');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updatedData: Partial<IcpProfile>) => {
    try {
      setError(null);
      const data = await icpProfileService.updateProfile(updatedData, companyId);
      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar perfil ICP');
      throw err;
    }
  }, [companyId]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
