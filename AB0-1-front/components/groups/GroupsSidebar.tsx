'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen,
  ListChecks,
  MessageSquareText,
  Users,
} from 'lucide-react';

import type { Group } from '@/types/groups';
import { fetchApi } from '@/lib/api';

import { GroupAdsRail } from './GroupAdsRail';

interface CategoryItem {
  id: number;
  name: string;
}

interface GroupsSidebarProps {
  group?: Group;
  selectedCategory?: number;
  onCategorySelect?: (id: number | undefined) => void;
}

export function GroupsSidebar({
  group,
  selectedCategory,
  onCategorySelect,
}: GroupsSidebarProps) {
  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const resp = await fetchApi<unknown>('/categories', {
        params: {
          view: 'cards',
          limit: 200,
        },
      });

      if (Array.isArray(resp)) {
        return resp as CategoryItem[];
      }

      if (resp && typeof resp === 'object') {
        const responseObject = resp as Record<string, unknown>;

        if (Array.isArray(responseObject.data)) {
          return responseObject.data as CategoryItem[];
        }

        if (Array.isArray(responseObject.categories)) {
          return responseObject.categories as CategoryItem[];
        }
      }

      return [];
    },
    enabled: !group,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <aside
      className="
        sticky top-[96px]
        hidden h-fit w-full
        space-y-5
        lg:block
      "
      aria-label="Navegação da comunidade"
    >
      {group ? (
        <GroupDetailSidebar group={group} />
      ) : (
        <>
          <DiscoveryCard />

          {onCategorySelect && categories.length > 0 && (
            <CategoryFilterCard
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
            />
          )}
        </>
      )}

      <GroupAdsRail categoryId={group?.category_id} />
    </aside>
  );
}

function GroupDetailSidebar({ group }: { group: Group }) {
  return (
    <div
      className="
        rounded-2xl
        border border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <p
        className="
          text-xs font-bold uppercase
          tracking-[0.16em]
          text-slate-500
        "
      >
        Sobre este grupo
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {group.short_description ||
          group.description ||
          'Comunidade Avalia Solar.'}
      </p>

      <nav
        className="
          mt-5 space-y-1
          border-t border-slate-100
          pt-4
        "
      >
        <SidebarAnchor
          href="#topics"
          icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />}
        >
          Tópicos
        </SidebarAnchor>

        <SidebarAnchor
          href="#members"
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        >
          Membros
        </SidebarAnchor>

        <SidebarAnchor
          href="#rules"
          icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
        >
          Regras
        </SidebarAnchor>
      </nav>
    </div>
  );
}

function DiscoveryCard() {
  return (
    <div
      className="
        rounded-2xl
        border border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <p
        className="
          text-xs font-bold uppercase
          tracking-[0.16em]
          text-slate-500
        "
      >
        Descobrir
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Encontre comunidades para aprender e compartilhar experiências reais.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="#groups-list"
          className="
            inline-flex min-h-10 items-center
            text-sm font-bold
            text-blue-700
            transition-colors
            hover:text-blue-800
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-600
            focus-visible:ring-offset-2
          "
        >
          Ver comunidades
        </Link>

        <hr className="border-slate-100" />

        <Link
          href="/groups/new"
          className="
            inline-flex min-h-10 w-full
            items-center justify-center
            rounded-xl
            bg-blue-600
            px-4
            text-sm font-bold
            text-white
            shadow-sm
            transition
            hover:bg-blue-700
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-600
            focus-visible:ring-offset-2
          "
        >
          Criar comunidade
        </Link>
      </div>
    </div>
  );
}

interface CategoryFilterCardProps {
  categories: CategoryItem[];
  selectedCategory?: number;
  onCategorySelect: (id: number | undefined) => void;
}

function CategoryFilterCard({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCardProps) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
      "
      aria-labelledby="groups-categories-title"
    >
      <div className="p-5 pb-3">
        <p
          id="groups-categories-title"
          className="
            flex items-center gap-2
            text-xs font-bold uppercase
            tracking-[0.16em]
            text-slate-500
          "
        >
          <FolderOpen
            className="h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />

          Categorias
        </p>
      </div>

      <div className="relative">
        <div
          className="
            flex max-h-[320px]
            flex-col gap-1
            overflow-y-auto
            overscroll-contain
            px-4 pb-4
            pr-3
            scrollbar-thin
            scrollbar-track-transparent
            scrollbar-thumb-slate-200
            hover:scrollbar-thumb-slate-300
          "
          role="list"
          aria-label="Categorias de comunidades"
        >
          <CategoryButton
            active={selectedCategory === undefined}
            onClick={() => onCategorySelect(undefined)}
            label="Todas"
          />

          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              active={selectedCategory === Number(category.id)}
              onClick={() => onCategorySelect(Number(category.id))}
              label={category.name}
            />
          ))}
        </div>

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-x-0 bottom-0
            h-8
            bg-gradient-to-t
            from-white
            via-white/85
            to-transparent
          "
        />
      </div>

      {categories.length > 8 && (
        <div
          className="
            border-t border-slate-100
            bg-white
            px-5 py-3
          "
        >
          <p className="text-xs font-medium text-slate-400">
            Role para ver todas as categorias
          </p>
        </div>
      )}
    </section>
  );
}

interface CategoryButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function CategoryButton({
  active,
  label,
  onClick,
}: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      role="listitem"
      className={`
        flex min-h-9 w-full
        min-w-0
        items-center
        rounded-xl
        px-3 py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-600
        focus-visible:ring-offset-1
        ${
          active
            ? 'bg-blue-50 font-semibold text-blue-700'
            : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }
      `}
      aria-pressed={active}
    >
      <span className="block min-w-0 truncate whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

interface SidebarAnchorProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarAnchor({
  href,
  icon,
  children,
}: SidebarAnchorProps) {
  return (
    <Link
      href={href}
      className="
        flex min-h-11
        items-center gap-3
        rounded-xl
        px-3
        text-sm font-semibold
        text-slate-700
        transition-colors
        hover:bg-slate-50
        hover:text-blue-700
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-600
      "
    >
      {icon}
      {children}
    </Link>
  );
}