'use client';

import Image from 'next/image';
import type { ShareResource } from '@/lib/share/shareTypes';
import { getPublicationTypeLabel } from '@/lib/publications/publicationTypes';

export interface SocialTemplateProps {
  resource: ShareResource;
  width: number;
  height: number;
  formatLabel: string;
}

export function SocialCardBase({ resource, width, height, formatLabel }: SocialTemplateProps) {
  const typeLabel = resource.resourceType === 'publication' ? getPublicationTypeLabel(resource.title.includes('Insight') ? 'tip' : undefined, 'shortLabel') : 'Avalia Solar';
  return (
    <article
      data-social-format={formatLabel}
      className="relative flex overflow-hidden bg-[#071a3b] text-white"
      style={{ width, height, flexDirection: 'column' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,94,255,0.45),transparent_42%)]" />
      <div className="relative flex flex-1 flex-col justify-between p-[7%]">
        <header className="flex items-center justify-between gap-4">
          <strong className="text-[3.3%] font-bold uppercase tracking-[0.2em] text-blue-200">Avalia Solar</strong>
          <span className="text-[2.6%] font-semibold uppercase tracking-[0.16em] text-yellow-300">{formatLabel}</span>
        </header>
        {resource.imageUrl ? (
          <div className="relative my-[5%] aspect-[1.91/1] overflow-hidden rounded-[2%] bg-slate-800">
            <Image src={resource.imageUrl} alt="" fill sizes="600px" className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="relative">
          <p className="text-[3%] font-bold uppercase tracking-[0.16em] text-blue-300">{typeLabel}</p>
          <h2 className="mt-[2%] line-clamp-3 text-[8%] font-black leading-[1.05]">{resource.title}</h2>
          {resource.description ? <p className="mt-[3%] line-clamp-3 text-[3.8%] leading-[1.25] text-slate-300">{resource.description}</p> : null}
        </div>
        <footer className="relative mt-[6%] flex items-center justify-between gap-4 border-t border-white/15 pt-[4%]">
          <span className="truncate text-[3%] font-semibold text-slate-200">{resource.author?.name || 'Comunidade Avalia Solar'}</span>
          <span className="text-[3%] font-bold text-yellow-300">avaliasolar.com.br</span>
        </footer>
      </div>
    </article>
  );
}
