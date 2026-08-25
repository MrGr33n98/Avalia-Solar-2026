'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createGroupPost } from '@/lib/api/groups';
import type { Group, GroupTopic } from '@/types/groups';
import { Button } from '@/components/ui/button';

export function GroupPostComposer({ group, topics }: { group: Group; topics: GroupTopic[] }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topicId, setTopicId] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createGroupPost(group.slug, { title: title.trim() || undefined, body: body.trim(), group_topic_id: topicId ? Number(topicId) : undefined }),
    onSuccess: () => {
      setTitle(''); setBody(''); setTopicId('');
      void queryClient.invalidateQueries({ queryKey: ['group-posts', group.slug] });
      void queryClient.invalidateQueries({ queryKey: ['group', group.slug] });
    },
  });

  if (!group.permissions.can_post) return null;

  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); if (body.trim()) mutation.mutate(); }}>
      <h2 className="text-lg font-bold text-slate-950">Escreva uma publicação</h2>
      <div className="mt-4 space-y-3">
        <label className="block"><span className="sr-only">Título opcional</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="Título opcional" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></label>
        {topics.length > 0 && <label className="block"><span className="sr-only">Tópico</span><select value={topicId} onChange={(event) => setTopicId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="">Sem tópico</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>}
        <label className="block"><span className="sr-only">Texto da publicação</span><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={50000} required rows={4} placeholder="Compartilhe uma ideia com a comunidade" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{body.length.toLocaleString('pt-BR')} / 50.000</span><Button type="submit" disabled={mutation.isPending || !body.trim()}>{mutation.isPending ? 'Publicando...' : 'Publicar'}</Button></div>
      {mutation.isError && <p className="mt-3 text-sm text-red-700" role="alert">Não foi possível publicar esta discussão.</p>}
    </form>
  );
}