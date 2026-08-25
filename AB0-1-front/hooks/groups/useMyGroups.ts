import { useQuery } from '@tanstack/react-query';
import { getGroups } from '@/lib/api/groups';
import type { Group } from '@/types/groups';

export function useMyGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups', 'mine'],
    queryFn: () => getGroups({ view: 'mine' }),
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
  });
}
