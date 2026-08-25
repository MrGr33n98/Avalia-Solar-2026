import { Hash } from 'lucide-react';
import type { GroupTopic } from '@/types/groups';

export function GroupTopics({ topics }: { topics: GroupTopic[] }) {
  return (
    <section id="topics" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="topics-title">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Conversa organizada</p>
          <h2 id="topics-title" className="mt-1 text-xl font-bold text-slate-950">Assuntos do grupo</h2>
        </div>
        <Hash className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      {topics.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Nenhum tópico publicado.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {topics.map((topic) => (
            <article key={topic.id} className="py-4 first:pt-0 last:pb-0">
              <h3 className="font-semibold text-slate-900">{topic.name}</h3>
              {topic.description && <p className="mt-1 text-sm leading-6 text-slate-600">{topic.description}</p>}
              <p className="mt-2 text-xs font-medium text-slate-500">{topic.posts_count.toLocaleString('pt-BR')} discussões</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}