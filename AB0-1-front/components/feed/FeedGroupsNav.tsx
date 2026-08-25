'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Compass, Users, Sparkles, PlusCircle } from 'lucide-react';
import { useMyGroups } from '@/hooks/groups/useMyGroups';
import { FeedGroupItem } from './FeedGroupItem';
import { track } from '@/lib/analytics/lazy';

export function FeedGroupsNav() {
  const { data: groups, isLoading, isError } = useMyGroups();

  const hasFiredImpression = useRef(false);

  useEffect(() => {
    if (!hasFiredImpression.current) {
      hasFiredImpression.current = true;
      track('feed_groups_nav_viewed', { source: 'feed_left_rail' });
    }
  }, []);

  const handleTrackClick = (eventName: string, metadata?: Record<string, unknown>) => {
    track(eventName, { source: 'feed_left_rail', ...metadata });
  };

  // Rendering loading state: 3 skeleton rows
  const renderLoading = () => (
    <div className="space-y-3 px-3 py-2 animate-pulse" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-3/4 bg-slate-200 rounded" />
            <div className="h-2 w-1/2 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Communities Header & Navigation */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Comunidades
        </p>
        <nav className="space-y-0.5 text-sm font-medium">
          <Link
            href="/groups"
            onClick={() => handleTrackClick('feed_groups_explore_clicked')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group active:bg-blue-50/50"
          >
            <Compass className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
            <span className="text-slate-700 font-medium">Explorar comunidades</span>
          </Link>
          
          <Link
            href="/groups?view=mine"
            onClick={() => handleTrackClick('feed_my_groups_clicked')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group active:bg-blue-50/50"
          >
            <Users className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
            <span className="text-slate-700 font-medium">Meus grupos</span>
          </Link>

          <Link
            href="/groups?view=featured"
            onClick={() => handleTrackClick('feed_groups_explore_clicked', { filter: 'featured' })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group active:bg-blue-50/50"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
            <span className="text-slate-700 font-medium">Em destaque</span>
          </Link>
        </nav>
      </div>

      {/* Divider */}
      <div className="border-t border-border/60 mx-1" />

      {/* User Groups List Section */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Seus Grupos
        </p>

        {isLoading && renderLoading()}

        {/* Fail silently on query errors without crashing the Left Rail */}
        {isError && (
          <p className="px-3 py-2 text-xs text-slate-500 font-medium">
            Erro ao carregar seus grupos.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            {groups && groups.length > 0 ? (
              <div className="space-y-0.5 text-sm font-medium">
                {groups.slice(0, 4).map((group) => (
                  <FeedGroupItem
                    key={group.id}
                    group={group}
                    onClick={() =>
                      handleTrackClick('feed_group_shortcut_clicked', {
                        group_id: group.id,
                        group_slug: group.slug,
                      })
                    }
                  />
                ))}

                {groups.length > 4 && (
                  <Link
                    href="/groups?view=mine"
                    onClick={() => handleTrackClick('feed_my_groups_clicked')}
                    className="block px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors mt-1"
                  >
                    Ver todos ({groups.length}) →
                  </Link>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 space-y-2 text-center sm:text-left">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Você ainda não participa de nenhuma comunidade.
                </p>
                <Link
                  href="/groups"
                  onClick={() => handleTrackClick('feed_groups_explore_clicked')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Encontrar comunidades
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
