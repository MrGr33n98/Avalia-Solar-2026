'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { buildApiUrl } from '@/lib/api-config';

export function PublicationLikeButton({ creatorSlug, publicationSlug, initialCount }: { creatorSlug: string; publicationSlug: string; initialCount: number }) {
  const [liked, setLiked] = React.useState(false);
  const [count, setCount] = React.useState(initialCount);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => { const controller = new AbortController(); fetch(buildApiUrl(`creators/${encodeURIComponent(creatorSlug)}/publications/${encodeURIComponent(publicationSlug)}/like`), { credentials: 'include', signal: controller.signal, cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((data) => data && (setLiked(data.liked), setCount(data.likes_count))).catch((error) => { if (error.name !== 'AbortError') return; }); return () => controller.abort(); }, [creatorSlug, publicationSlug]);
  const toggle = async () => { if (pending) return; const previous = { liked, count }; const next = !liked; setLiked(next); setCount(Math.max(0, count + (next ? 1 : -1))); setPending(true); try { const r = await fetch(buildApiUrl(`creators/${encodeURIComponent(creatorSlug)}/publications/${encodeURIComponent(publicationSlug)}/like`), { method: next ? 'POST' : 'DELETE', credentials: 'include', headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('like_failed'); const data = await r.json(); setLiked(data.liked); setCount(data.likes_count); } catch { setLiked(previous.liked); setCount(previous.count); } finally { setPending(false); } };
  return <button type="button" aria-pressed={liked} aria-label={liked ? 'Remover curtida' : 'Curtir publicação'} onClick={toggle} disabled={pending} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm transition ${liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'}`}><Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />{count}</button>;
}
