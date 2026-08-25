import Link from 'next/link';
import { ListChecks, MessageSquareText, Users } from 'lucide-react';
import type { Group } from '@/types/groups';
import { GroupAdsRail } from './GroupAdsRail';

export function GroupsSidebar({ group }: { group?: Group }) {
  return (
    <aside className="hidden space-y-6 lg:block sticky top-[96px] h-fit" aria-label="Navegação da comunidade">
      {group ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sobre este grupo</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{group.short_description || group.description || 'Comunidade Avalia Solar.'}</p>
          <nav className="mt-5 space-y-1 border-t border-slate-100 pt-4">
            <Link className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#topics"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Tópicos</Link>
            <Link className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#members"><Users className="h-4 w-4" aria-hidden="true" />Membros</Link>
            <Link className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#rules"><ListChecks className="h-4 w-4" aria-hidden="true" />Regras</Link>
          </nav>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Descobrir</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Encontre comunidades para aprender e compartilhar experiências reais.</p>
          <Link href="#groups-list" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Ver comunidades</Link>
        </div>
      )}

      {/* Ads Integration */}
      <GroupAdsRail categoryId={group?.category_id} />
    </aside>
  );
}