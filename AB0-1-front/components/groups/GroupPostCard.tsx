import Image from 'next/image';
import { Pin, UserRound } from 'lucide-react';
import type { GroupPost } from '@/types/groups';

export function GroupPostCard({ post }: { post: GroupPost }) {
  const authorName = post.author.name || 'Membro da comunidade';
  const date = new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby={post.title ? `post-${post.id}-title` : undefined}>
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
          {post.author.avatar_url ? <Image src={post.author.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-900">{authorName}{post.pinned && <><Pin className="h-3.5 w-3.5 text-blue-700" aria-label="Publicação fixada" /></>}</p>
          <p className="text-xs text-slate-500">{date}{post.topic && <> · <span className="font-medium text-blue-700">{post.topic.name}</span></>}</p>
        </div>
      </header>
      {post.title && <h3 id={`post-${post.id}-title`} className="mt-4 text-lg font-bold text-slate-950">{post.title}</h3>}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>
    </article>
  );
}

export function GroupPostSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-10 w-10 rounded-full bg-slate-200" /><div className="mt-5 h-4 w-1/3 rounded bg-slate-200" /><div className="mt-4 space-y-2"><div className="h-3 rounded bg-slate-100" /><div className="h-3 w-5/6 rounded bg-slate-100" /></div></div>;
}

export function GroupPostEmptyState() {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-lg font-bold text-slate-950">Nenhuma discussão publicada</h3><p className="mt-2 text-sm text-slate-600">Seja o primeiro a compartilhar uma ideia com a comunidade.</p></div>;
}