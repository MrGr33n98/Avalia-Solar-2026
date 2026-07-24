import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadLimits {
  tier: string;
  limits: {
    images: number | null;
    videos: number | null;
    projects: number | null;
    galleries_per_project: number | null;
  };
  usage: {
    images: number;
    videos: number;
    projects: number;
  };
  percentages: {
    images: number;
    videos: number;
    projects: number;
  };
  near_limits: {
    images: boolean;
    videos: boolean;
    projects: boolean;
  };
  can_upgrade: boolean;
  next_tier: string | null;
  next_tier_pricing: {
    monthly: number;
    yearly: number;
  } | null;
}

interface CheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
  upgrade?: {
    available: boolean;
    tier: string;
    pricing: {
      monthly: number;
      yearly: number;
    };
  };
}

interface UseUploadLimitsReturn {
  limits: UploadLimits | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  checkUpload: (type: 'images' | 'videos' | 'projects', count?: number) => Promise<CheckResult>;
  incrementUsage: (type: 'images' | 'videos' | 'projects', count?: number) => Promise<void>;
  canUploadImage: (count?: number) => boolean;
  canUploadVideo: (count?: number) => boolean;
  canCreateProject: (count?: number) => boolean;
  usagePercentage: (type: 'images' | 'videos' | 'projects') => number;
  isNearLimit: (type: 'images' | 'videos' | 'projects', threshold?: number) => boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  upgradeTier: string | null;
}

export function useUploadLimits(companyId: string): UseUploadLimitsReturn {
  const queryClient = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<string | null>(null);

  // Query para buscar limites
  const {
    data: limits,
    isLoading,
    error,
    refetch
  } = useQuery<UploadLimits>({
    queryKey: ['upload-limits', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/companies/${companyId}/upload_limits`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upload limits');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para verificar se pode fazer upload
  const checkUploadMutation = useMutation<CheckResult, Error, { type: 'images' | 'videos' | 'projects'; count?: number }>({
    mutationFn: async ({ type, count = 1 }) => {
      const response = await fetch(`/api/v1/companies/${companyId}/upload_limits/check?type=${type}&count=${count}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok && response.status !== 402) {
        throw new Error(data.error || 'Failed to check upload limits');
      }

      return data;
    },
  });

  // Mutation para incrementar uso
  const incrementUsageMutation = useMutation<void, Error, { type: 'images' | 'videos' | 'projects'; count?: number }>({
    mutationFn: async ({ type, count = 1 }) => {
      const response = await fetch(`/api/v1/companies/${companyId}/upload_limits/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type, count }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to increment usage');
      }
    },
    onSuccess: () => {
      // Invalida o cache para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['upload-limits', companyId] });
    },
  });

  // Funções auxiliares
  const checkUpload = useCallback(
    async (type: 'images' | 'videos' | 'projects', count = 1): Promise<CheckResult> => {
      return checkUploadMutation.mutateAsync({ type, count });
    },
    [checkUploadMutation]
  );

  const incrementUsage = useCallback(
    async (type: 'images' | 'videos' | 'projects', count = 1): Promise<void> => {
      return incrementUsageMutation.mutateAsync({ type, count });
    },
    [incrementUsageMutation]
  );

  const canUploadImage = useCallback(
    (count = 1): boolean => {
      if (!limits) return false;
      const limit = limits.limits.images;
      if (limit === null) return true; // Ilimitado
      return limits.usage.images + count <= limit;
    },
    [limits]
  );

  const canUploadVideo = useCallback(
    (count = 1): boolean => {
      if (!limits) return false;
      const limit = limits.limits.videos;
      if (limit === null) return true; // Ilimitado
      return limits.usage.videos + count <= limit;
    },
    [limits]
  );

  const canCreateProject = useCallback(
    (count = 1): boolean => {
      if (!limits) return false;
      const limit = limits.limits.projects;
      if (limit === null) return true; // Ilimitado
      return limits.usage.projects + count <= limit;
    },
    [limits]
  );

  const usagePercentage = useCallback(
    (type: 'images' | 'videos' | 'projects'): number => {
      if (!limits) return 0;
      return limits.percentages[type] || 0;
    },
    [limits]
  );

  const isNearLimit = useCallback(
    (type: 'images' | 'videos' | 'projects', threshold = 0.8): boolean => {
      if (!limits) return false;
      return limits.near_limits[type] || usagePercentage(type) >= threshold * 100;
    },
    [limits, usagePercentage]
  );

  return {
    limits,
    isLoading,
    error,
    refetch,
    checkUpload,
    incrementUsage,
    canUploadImage,
    canUploadVideo,
    canCreateProject,
    usagePercentage,
    isNearLimit,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradeTier,
  };
}