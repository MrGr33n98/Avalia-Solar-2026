'use client';
import { useEffect } from 'react';
import { UserCheck, UserPlus } from 'lucide-react';
import type { FeedFollowable } from '@/types/feed';
import { followKey, useSocialGraphStore } from '@/store/socialGraphStore';
export function FollowButton({ target, initialFollowing = false }: { target?: FeedFollowable | null; initialFollowing?: boolean }) {
  const hydrate = useSocialGraphStore((state) => state.hydrate); const toggle = useSocialGraphStore((state) => state.toggle); const key = target ? followKey(target) : '';
  const following = useSocialGraphStore((state) => target ? (state.following[key] ?? initialFollowing) : false); const pending = useSocialGraphStore((state) => target ? !!state.pending[key] : false);
  useEffect(() => { if (target) hydrate(target, initialFollowing); }, [hydrate, initialFollowing, target]); if (!target) return null;
  return <button type="button" disabled={pending} aria-pressed={following} onClick={() => void toggle(target, initialFollowing)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${following ? 'border-border bg-muted text-muted-foreground' : 'border-primary/30 bg-primary/10 text-primary'}`}>{following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}<span>{following ? 'Seguindo' : 'Seguir'}</span></button>;
}
