'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ListChecks, MessageSquareText, Users, FolderOpen } from 'lucide-react';
import type { Group } from '@/types/groups';
import { GroupAdsRail } from './GroupAdsRail';
import { fetchApi } from '@/lib/api';

interface GroupsSidebarProps {
  group?: Group;
  selectedCategory?: number;
  onCategorySelect?: (id: number | undefined) => void;
}

export function GroupsSidebar({ group, selectedCategory, onCategorySelect }: GroupsSidebarProps) {
  // Load categories list for sidebar filtering (only when no group detail is active)
  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const resp = await fetchApi<unknown>('/categories', {
        params: { view: 'cards', limit: 200 },
      });
      if (Array.isArray(resp)) return resp;
      if (resp && typeof resp === 'object') {
        const data = (resp as Record<string, unknown>).data;
        if (Array.isArray(data)) return data;
        const categories = (resp as Record<string, unknown>).categories;
        if (Array.isArray(categories)) return categories;
      }
      return [];
    },
    enabled: !group,
  });

  return (
    <aside className="hidden space-y-5 lg:block sticky top-[96px] h-fit w-full" aria-label="Navegação da comunidade">
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
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Descobrir</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Encontre comunidades para aprender e compartilhar experiências reais.</p>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="#groups-list" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Ver comunidades
              </Link>
              <hr className="border-slate-100" />
              <Link href="/groups/new" className="w-full inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-sm transition-all">
                Criar Comunidade
              </Link>
            </div>
          </div>

          {/* Category Filter Widget */}
          {onCategorySelect && categories && categories.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-slate-400" /> Categorias
              </p>
              <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto pr-1 no-scrollbar scrollbar-none">
                <button
                  onClick={() => onCategorySelect(undefined)}
                  className={`text-left text-xs px-2.5 py-2 rounded-lg font-bold transition-all ${
                    selectedCategory === undefined
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat: { id: number; name: string }) => (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(Number(cat.id))}
                    className={`text-left text-xs px-2.5 py-2 rounded-lg font-semibold transition-all truncate ${
                      selectedCategory === Number(cat.id)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Ads Integration */}
      <GroupAdsRail categoryId={group?.category_id} />
    </aside>
  );
}