import { BadgeCheck, Lock, Users, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { Group, GroupMember } from '@/types/groups';
import { GroupMembershipButton } from './GroupMembershipButton';
import { GroupHeroMedia } from './GroupHeroMedia';
import { Button } from '@/components/ui/button';

export function GroupHero({ group, members = [] }: { group: Group; members?: GroupMember[] }) {
  const hasAvatar = !!group.avatar_url;

  return (
    <div className="flex flex-col gap-0 w-full" aria-labelledby="group-title">
      {/* 1. Header Media (Cover/Carousel/Fallback) */}
      <GroupHeroMedia heroImages={group.hero_images} groupName={group.name} />

      {/* 2. Overlapping Identity Card */}
      <div className="relative px-4 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-14 z-20 relative">
          {/* Avatar Container */}
          <div className="relative h-20 w-20 sm:h-28 sm:w-28 shrink-0 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
            {hasAvatar ? (
              <Image
                src={group.avatar_url!}
                alt={`Logo da comunidade ${group.name}`}
                fill
                sizes="(max-width: 640px) 80px, 112px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white select-none">
                {group.name.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons on desktop */}
          <div className="hidden sm:flex sm:items-center gap-2 mb-2 shrink-0">
            {group.permissions?.can_moderate && (
              <Link href={`/groups/${group.slug}/manage`}>
                <Button variant="outline" className="min-h-11 border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 font-bold text-xs rounded-xl">
                  <Settings className="h-4 w-4" />
                  Gerenciar
                </Button>
              </Link>
            )}
            <div className="w-44">
              <GroupMembershipButton group={group} />
            </div>
          </div>
        </div>

        {/* Title, Badges, Short Description */}
        <div className="mt-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {group.official || group.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100/50">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {group.official ? 'Comunidade oficial' : 'Comunidade verificada'}
              </span>
            ) : null}
            {group.visibility !== 'public' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/50">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Privada
              </span>
            )}
          </div>

          <h1 id="group-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {group.name}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            {members && members.length > 0 && (
              <div className="flex -space-x-1.5">
                {members.slice(0, 10).map((member) => {
                  const name = member.user?.name || 'User';
                  const initials = name.charAt(0).toUpperCase();
                  return (
                    <div key={member.id} title={name} className="relative inline-block h-6 w-6 shrink-0 rounded-full ring-2 ring-white bg-slate-200 overflow-hidden">
                      {member.user?.avatar_url ? (
                        <Image src={member.user.avatar_url} alt={name} fill sizes="24px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-[10px] font-bold text-blue-700">
                          {initials}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
              {(!members || members.length === 0) && <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />}
              <span>{group.stats.members.toLocaleString('pt-BR')} membros</span>
            </p>
          </div>

          <p className="mt-4 text-base leading-relaxed text-slate-700 max-w-3xl">
            {group.short_description || group.description || 'Bem-vindo à comunidade oficial do Avalia Solar.'}
          </p>
        </div>

        {/* Mobile Action Button */}
        <div className="mt-5 w-full flex flex-col gap-2 sm:hidden">
          {group.permissions?.can_moderate && (
            <Link href={`/groups/${group.slug}/manage`} className="w-full">
              <Button variant="outline" className="min-h-11 w-full border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 font-bold text-xs rounded-xl">
                <Settings className="h-4 w-4" />
                Gerenciar Comunidade
              </Button>
            </Link>
          )}
          <GroupMembershipButton group={group} />
        </div>
      </div>
    </div>
  );
}

export function GroupHeroSkeleton() {
  return (
    <div className="animate-pulse flex flex-col w-full">
      <div className="h-48 md:h-64 rounded-xl bg-slate-100" />
      <div className="px-4 sm:px-8">
        <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl bg-slate-200 border-4 border-white -mt-10 sm:-mt-14" />
        <div className="h-6 w-1/3 bg-slate-200 rounded mt-6" />
        <div className="h-4 w-1/4 bg-slate-200 rounded mt-2" />
        <div className="h-16 w-3/4 bg-slate-200 rounded mt-4" />
      </div>
    </div>
  );
}