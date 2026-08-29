'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeedLeftRail } from './FeedLeftRail';
import { FeedRightRail } from './FeedRightRail';
import { FeedComposer } from './FeedComposer';
import { FeedTabs } from './FeedTabs';
import { InfiniteFeedQuery as InfiniteFeed } from './InfiniteFeedQuery';
import { FeedComposerDialog } from './FeedComposerDialog';
import { useFeedStore } from '@/store/feedStore';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';

export function FeedShell({ initialFeed, initialView, initialType }: { initialFeed?: import('@/types/feed').FeedResponse | null; initialView?: string; initialType?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') || initialView || 'for_you';
  const activeType = searchParams.get('type') || initialType || '';
  useEffect(() => {
    track('feed_view', { view: activeView, type: activeType || undefined });
  }, [activeView, activeType]);
  const isComposerOpen = useFeedStore((state) => state.isComposerOpen);
  const closeComposer = useFeedStore((state) => state.closeComposer);
  const [published, setPublished] = useState<{
    id: number;
    slug: string;
    title: string;
    url: string;
  } | null>(null);

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`?${params.toString()}`, { scroll: false });
  };
  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) params.set('type', type);
    else params.delete('type');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)_300px] gap-6 min-h-[calc(100vh-88px)]">
      {/* Left Rail (Tablet and Desktop) */}
      <div className="hidden md:block">
        <FeedLeftRail activeView={activeView} />
      </div>

      {/* Center Feed Column */}
      <main className="space-y-4">
        <FeedComposer />
        <FeedTabs activeView={activeView} onViewChange={handleViewChange} activeType={activeType} onTypeChange={handleTypeChange} />
        <InfiniteFeed view={activeView} type={activeType || undefined} initialFeed={initialFeed} />
      </main>

      {/* Right Rail (Desktop only) */}
      <div className="hidden lg:block sticky top-[80px] h-fit">
        <FeedRightRail />
      </div>

      {/* Composer Dialog overlay */}
      <FeedComposerDialog
        isOpen={isComposerOpen}
        onClose={closeComposer}
        onPublished={setPublished}
      />
      {published && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl">
          <div className="min-w-0">
            <p className="font-semibold text-emerald-700">Publicação criada</p>
            <p className="truncate text-sm text-slate-600">{published.title}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={published.url}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Ver publicação
            </Link>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}${published.url}`;
                if (navigator.share) {
                  void navigator.share({ title: published.title, url });
                } else {
                  void navigator.clipboard.writeText(url);
                }
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Compartilhar
            </button>
            <button
              type="button"
              onClick={() => setPublished(null)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
