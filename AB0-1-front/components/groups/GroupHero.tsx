import { BadgeCheck, Lock, Users } from 'lucide-react';

import type { Group } from '@/types/groups';
import { GroupMembershipButton } from './GroupMembershipButton';

export function GroupHero({ group }: { group: Group }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="group-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700 sm:h-20 sm:w-20 sm:text-3xl">
            {group.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {group.official || group.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {group.official ? 'Comunidade oficial' : 'Comunidade verificada'}
                </span>
              ) : null}
              {group.visibility !== 'public' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Privada
                </span>
              )}
            </div>
            <h1 id="group-title" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {group.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {group.description || group.short_description || 'Comunidade Avalia Solar.'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Users className="h-4 w-4" aria-hidden="true" />
              {group.stats.members.toLocaleString('pt-BR')} membros
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 sm:w-48">
          <GroupMembershipButton group={group} />
        </div>
      </div>
    </section>
  );
}

export function GroupHeroSkeleton() {
  return <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />;
}