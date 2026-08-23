'use client';

import Image from 'next/image';
import type { ShareResource } from '@/lib/share/shareTypes';

export function SharePreview({ resource }: { resource: ShareResource }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {resource.imageUrl ? (
        <div className="relative aspect-[1.91/1] w-full bg-slate-200">
          <Image src={resource.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 560px" className="object-cover" unoptimized />
        </div>
      ) : null}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Avalia Solar</p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900">{resource.title}</h3>
        {resource.description ? <p className="mt-1 line-clamp-3 text-sm text-slate-600">{resource.description}</p> : null}
        <p className="mt-3 truncate text-xs text-slate-400">{resource.canonicalUrl}</p>
      </div>
    </article>
  );
}
