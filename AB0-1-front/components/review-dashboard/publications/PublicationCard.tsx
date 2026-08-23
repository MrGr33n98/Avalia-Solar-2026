'use client';
import Link from 'next/link';
import {
  Archive,
  Calendar,
  Copy,
  ExternalLink,
  FileText,
  MoreVertical,
  PenLine,
  Share2,
} from 'lucide-react';
import type { ReviewerPublication } from '@/types/reviewer-publication';
import { getPublicationTypeLabel } from '@/lib/publications/publicationTypes';
export function PublicationCard({
  publication,
  onArchive,
  onShare,
  publicUrl,
}: {
  publication: ReviewerPublication;
  onArchive?: (id: number) => void;
  onShare?: (publication: ReviewerPublication) => void;
  publicUrl?: string;
}) {
  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
  };

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
            {publication.status === 'draft'
              ? 'Rascunho'
              : publication.status === 'published'
                ? 'Publicada'
                : 'Arquivada'}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {getPublicationTypeLabel(publication.publication_type, 'shortLabel')}
          </span>
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
          {publication.metrics && <span>{publication.metrics.comments} comentários</span>}
          {publication.metrics && <span>{publication.metrics.leads} leads</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {publication.status === 'published' && publicUrl && onShare && (
          <button
            type="button"
            onClick={() => onShare(publication)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
        )}
        <Link
          href={`/creator-studio/publications/${publication.id}/edit`}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          <PenLine className="h-4 w-4" />
          Editar
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
        <details className="relative">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Mais ações</span>
          </summary>
          <div className="absolute right-0 top-10 z-10 grid min-w-44 gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg">
            {publication.status === 'published' && publicUrl && (
              <Link
                href={publicUrl}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ver publicação
              </Link>
            )}
            {onShare && publication.status === 'published' && (
              <button
                type="button"
                onClick={() => onShare(publication)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
              >
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </button>
            )}
            {publicUrl && (
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar link
              </button>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}
