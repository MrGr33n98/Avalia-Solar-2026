'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { joinGroup, leaveGroup } from '@/lib/api/groups';
import type { Group } from '@/types/groups';
import { Button } from '@/components/ui/button';

type GroupMembershipButtonProps = {
  group: Group;
  compact?: boolean;
};

export function GroupMembershipButton({ group, compact = false }: GroupMembershipButtonProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const membership = group.membership;
  const isPending = membership?.status === 'pending';
  const isMember = membership?.status === 'active';
  const canJoin = group.permissions.can_join;
  const canLeave = group.permissions.can_leave;

  const mutation = useMutation({
    mutationFn: () => (isMember ? leaveGroup(group.slug) : joinGroup(group.slug)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['group', group.slug] }),
        queryClient.invalidateQueries({ queryKey: ['group-membership', group.slug] }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ]);
    },
  });

  if (authLoading) {
    return <Button disabled className="min-h-11 flex-1" aria-label="Carregando sessão" />;
  }

  if (!isAuthenticated && !isMember && !isPending) {
    return (
      <Button asChild className="min-h-11 flex-1" size={compact ? 'sm' : 'default'}>
        <Link href={`/login?returnTo=/groups/${encodeURIComponent(group.slug)}`}>
          <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
          Entrar no grupo
        </Link>
      </Button>
    );
  }

  if (isPending) {
    return (
      <Button disabled variant="secondary" className="min-h-11 flex-1" size={compact ? 'sm' : 'default'}>
        Solicitação enviada
      </Button>
    );
  }

  if (isMember) {
    return (
      <Button
        type="button"
        variant="outline"
        className="min-h-11 flex-1"
        size={compact ? 'sm' : 'default'}
        disabled={mutation.isPending || !canLeave}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />}
        {mutation.isPending ? 'Saindo...' : canLeave ? 'Sair do grupo' : 'Membro'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className="min-h-11 flex-1"
      size={compact ? 'sm' : 'default'}
      disabled={mutation.isPending || !canJoin}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {mutation.isPending ? 'Entrando...' : canJoin ? 'Entrar no grupo' : group.membership_mode === 'invite_only' ? 'Somente por convite' : 'Indisponível'}
    </Button>
  );
}