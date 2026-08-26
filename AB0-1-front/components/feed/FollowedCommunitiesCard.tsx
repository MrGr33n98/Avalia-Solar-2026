/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useMyGroups } from '@/hooks/groups/useMyGroups';
import { getGroupVisual } from '@/lib/groups/groupVisualResolver';
import { track } from '@/lib/analytics/lazy';

export function formatMembersCount(count: number): string {
  if (!count || count < 0) return '0 membros';
  if (count < 1000) {
    return `${count} ${count === 1 ? 'membro' : 'membros'}`;
  }
  const thousands = count / 1000;
  const formatted = thousands.toFixed(1).replace('.0', '').replace('.', ',');
  return `${formatted} mil membros`;
}

export function FollowedCommunitiesCard() {
  const { data: groups, isLoading: groupsLoading, isError: groupsError } = useMyGroups();

  const hasFiredImpression = useRef(false);

  useEffect(() => {
    if (
      !groupsLoading &&
      !groupsError &&
      groups &&
      groups.length > 0 &&
      !hasFiredImpression.current
    ) {
      hasFiredImpression.current = true;
      track('feed_followed_communities_viewed', {
        source: 'feed_right_rail',
        visible_count: groups.slice(0, 6).length,
      });
    }
  }, [groups, groupsLoading, groupsError]);

  const handleTrackClick = (eventName: string, metadata?: Record<string, unknown>) => {
    track(eventName, { source: 'feed_right_rail', ...metadata });
  };

  // Skeleton de carregamento
  if (groupsLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>Comunidades que você segue</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 animate-pulse" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-xl border border-border/60 bg-muted/10 p-2.5"
            >
              <div className="h-16 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden" />
              <div className="mt-2.5 h-3 w-3/4 bg-muted rounded" />
              <div className="mt-1.5 h-2 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de erro
  if (groupsError) {
    return (
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span>Comunidades que você segue</span>
        </div>
        <div className="py-2 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Não foi possível carregar suas comunidades.
          </p>
          <Link
            href="/groups"
            onClick={() => handleTrackClick('feed_followed_communities_explore_clicked')}
            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Explorar comunidades
          </Link>
        </div>
      </div>
    );
  }

  // Estado vazio
  if (!groups || groups.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span>Comunidades que você segue</span>
        </div>
        <div className="py-2 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">Descubra comunidades do setor</p>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Acompanhe discussões e especialistas dos segmentos que mais importam para você.
          </p>
          <Link
            href="/groups"
            onClick={() => handleTrackClick('feed_followed_communities_explore_clicked')}
            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Explorar comunidades
          </Link>
        </div>
      </div>
    );
  }

  const visibleGroups = groups.slice(0, 6);

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span>Comunidades que você segue</span>
        </div>
        <Link
          href="/groups?view=mine"
          onClick={() => handleTrackClick('feed_followed_communities_view_all_clicked')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          Ver todas
        </Link>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-3 gap-2">
        {visibleGroups.map((group, index) => {
          const imageUrl = getGroupVisual(group);
          return (
            <Link
              key={group.id}
              href={`/groups/${group.slug}`}
              onClick={() =>
                handleTrackClick('feed_followed_community_clicked', {
                  group_id: group.id,
                  group_slug: group.slug,
                  position: index + 1,
                })
              }
              aria-label={`Abrir comunidade ${group.name}`}
              className="group flex flex-col items-center rounded-xl border border-border/60 bg-muted/20 p-2.5 transition-all hover:bg-muted/45 hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="h-16 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="h-14 w-14 object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 text-[11px] leading-tight font-semibold text-center text-foreground line-clamp-2">
                {group.name}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground text-center">
                {formatMembersCount(group.stats.members)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
