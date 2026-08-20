'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/api-config';
import { Loader2, UserPlus, UserMinus, Users } from 'lucide-react';

type FollowEntity = {
  id: number;
  followable_id?: number | null;
  name: string;
  avatar_url?: string | null;
  headline?: string;
  public_slug?: string | null;
  following: boolean;
  type?: 'ReviewerProfile' | 'Company';
};

type Props = {
  creatorSlug: string;
  type: 'followers' | 'following';
};

export function CreatorFollowList({ creatorSlug, type }: Props) {
  const { user: currentUser } = useAuth();
  const [items, setItems] = React.useState<FollowEntity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [actionPending, setActionPending] = React.useState<Record<number, boolean>>({});

  const fetchItems = React.useCallback(
    async (currentCursor: string | null = null, append = false) => {
      try {
        if (currentCursor) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const url = new URL(buildApiUrl(`creators/${encodeURIComponent(creatorSlug)}/${type}`));
        if (currentCursor) {
          url.searchParams.set('cursor', currentCursor);
        }

        const res = await fetch(url.toString(), {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) throw new Error('Failed to fetch follows');

        const result = await res.json();
        const newItems = result.data || [];
        const nextCursor = result.meta?.next_cursor || null;
        const more = result.meta?.has_more || false;

        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setCursor(nextCursor);
        setHasMore(more);
      } catch (err) {
        console.error(`[CreatorFollowList] Error fetching ${type}:`, err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [creatorSlug, type]
  );

  React.useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(false);
    fetchItems(null, false);
  }, [fetchItems]);

  const handleFollowToggle = async (entity: FollowEntity) => {
    if (!currentUser) {
      window.location.href = `/login?redirect=/creators/${creatorSlug}`;
      return;
    }

    if (actionPending[entity.id]) return;

    setActionPending((prev) => ({ ...prev, [entity.id]: true }));

    const isFollowing = entity.following;
    const followableType = entity.type || 'ReviewerProfile';
    const followableId = entity.followable_id ?? entity.id;

    try {
      const url = new URL(buildApiUrl('follows'));
      url.searchParams.set('followable_type', followableType);
      url.searchParams.set('followable_id', followableId.toString());

      const res = await fetch(url.toString(), {
        method: isFollowing ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Operation failed');

      // Update local state
      setItems((prev) =>
        prev.map((item) => (item.id === entity.id ? { ...item, following: !isFollowing } : item))
      );
    } catch (err) {
      console.error('[CreatorFollowList] Toggle follow error:', err);
    } finally {
      setActionPending((prev) => ({ ...prev, [entity.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e5eff]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <div className="rounded-full bg-slate-50 p-4 text-[#718096]">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[#0b1730]">Ninguém por aqui ainda</h3>
        <p className="mt-1 max-w-sm text-sm text-[#53627a]">
          {type === 'followers'
            ? 'Este criador de conteúdo ainda não possui seguidores. Seja o primeiro a seguir!'
            : 'Este criador de conteúdo não está seguindo ninguém ainda.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-xl font-bold text-[#0b1730]">
        {type === 'followers' ? 'Seguidores' : 'Seguindo'}
      </h3>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const profileLink =
            item.type === 'Company'
              ? `/companies/${item.public_slug}`
              : `/creators/${item.public_slug}`;

          const isSelf = currentUser && currentUser.id === item.id && item.type !== 'Company';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Link
                  href={profileLink}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f4b63f]"
                >
                  {item.avatar_url ? (
                    <Image
                      fill
                      sizes="48px"
                      src={item.avatar_url}
                      alt={item.name}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xl font-bold text-[#0b1730]">
                      {item.name.slice(0, 1)}
                    </span>
                  )}
                </Link>
                <div>
                  <Link
                    href={profileLink}
                    className="font-semibold text-[#0b1730] hover:text-[#1e5eff] transition"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-[#53627a] line-clamp-1">
                    {item.headline ||
                      (item.type === 'Company' ? 'Empresa Solar' : 'Avaliador Solar')}
                  </p>
                </div>
              </div>

              {!isSelf && (
                <button
                  type="button"
                  onClick={() => handleFollowToggle(item)}
                  disabled={actionPending[item.id]}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    item.following
                      ? 'border border-slate-200 bg-slate-50 text-[#53627a] hover:bg-slate-100 hover:text-slate-700'
                      : 'bg-[#1e5eff] text-white hover:bg-[#174dcc]'
                  }`}
                >
                  {actionPending[item.id] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : item.following ? (
                    <>
                      <UserMinus className="h-3.5 w-3.5" />
                      <span>Seguindo</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Seguir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => fetchItems(cursor, true)}
            disabled={loadingMore}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                <span>Carregando...</span>
              </>
            ) : (
              <span>Carregar mais</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
