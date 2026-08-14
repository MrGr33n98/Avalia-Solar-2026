'use client';
import Link from 'next/link';
import { Archive, Calendar, FileText, MoreVertical, PenLine } from 'lucide-react';
import type { ReviewerPublication } from '@/types/reviewer-publication';
const labels = { draft: 'Rascunho', published: 'Publicada', archived: 'Arquivada' };
export function PublicationCard({
  publication,
  onArchive,
}: {
  publication: ReviewerPublication;
  onArchive?: (id: number) => void;
}) {
  return (
    <article className="flex min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        {publication.cover_image ? (
          <img src={publication.cover_image.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
            {labels[publication.status]}
          </span>
          <span className="text-xs text-slate-400">{publication.publication_type}</span>
        </div>
        <h3 className="mt-1 truncate text-base font-bold text-slate-900">{publication.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {publication.excerpt || publication.body}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {publication.updated_at
              ? new Date(publication.updated_at).toLocaleDateString('pt-BR')
              : 'Agora'}
          </span>
          {publication.category && <span>{publication.category}</span>}
          {publication.metrics && <span>{publication.metrics.views} visualizações</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <Link
          href={`/review-dashboard/publications/${publication.id}/edit`}
          aria-label="Editar publicação"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <PenLine className="h-4 w-4" />
        </Link>
        {publication.status === 'published' && onArchive && (
          <button
            type="button"
            onClick={() => onArchive(publication.id)}
            aria-label="Arquivar publicação"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
        <MoreVertical className="mt-2 h-4 w-4 text-slate-300" />
      </div>
    </article>
  );
}
