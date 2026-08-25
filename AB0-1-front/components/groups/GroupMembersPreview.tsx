import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import type { GroupMember } from '@/types/groups';

const ROLE_TRANSLATIONS: Record<string, string> = {
  owner: 'Administrador',
  admin: 'Administrador',
  moderator: 'Moderador',
  member: 'Membro',
};

export function GroupMembersPreview({ members }: { members: GroupMember[] }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section id="members" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="members-title">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id="members-title" className="text-lg font-bold text-slate-900">Membros</h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {members.length}
          </span>
        </div>
        {members.length > 6 && (
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Ver todos
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500 text-center">Nenhum membro para exibir.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.slice(0, 6).map((member) => {
            const name = member.user.name || 'Membro';
            const role = ROLE_TRANSLATIONS[member.role?.toLowerCase()] || 'Membro';
            const initials = getInitials(name);

            return (
              <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                <Avatar className="h-11 w-11 shrink-0 border border-slate-200/50">
                  <AvatarImage src={member.user.avatar_url || undefined} alt="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-700 text-xs font-bold">
                    {initials || 'AS'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500 font-medium">{role}</p>
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