import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import type { GroupMember } from '@/types/groups';

export function GroupMembersPreview({ members }: { members: GroupMember[] }) {
  return (
    <section id="members" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="members-title">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="members-title" className="text-xl font-bold text-slate-950">Membros</h2>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500"><Users className="h-4 w-4" aria-hidden="true" />{members.length}</span>
      </div>
      {members.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Nenhum membro para exibir.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.slice(0, 6).map((member) => {
            const name = member.user.name || 'Membro da comunidade';
            return (
              <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={member.user.avatar_url || undefined} alt="" />
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs capitalize text-slate-500">{member.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function GroupMembersSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />;
}