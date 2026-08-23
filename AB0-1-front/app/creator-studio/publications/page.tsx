'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, PenLine, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
import type { PublicationStatus, ReviewerPublication } from '@/types/reviewer-publication';
import { PublicationCard } from '@/components/review-dashboard/publications/PublicationCard';
import { PublicationEmptyState } from '@/components/review-dashboard/publications/PublicationEmptyState';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicacoesPage() {
  const { reviewerProfile } = useAuth();
  const [items, setItems] = useState<ReviewerPublication[]>([]);
  const [tab, setTab] = useState<PublicationStatus>('published');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const load = async () => {
    setBusy(true);
    try {
      const response = await reviewerPublicationsApi.list({
        status: tab,
        query: query || undefined,
      });
      setItems(response.items || []);
      setSummary(response.summary || {});
      setError('');
    } catch {
      setError('Não foi possível carregar publicações.');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  const filtered = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );
  const archive = async (id: number) => {
    await reviewerPublicationsApi.archive(id);
    await load();
  };

  const share = async (publication: ReviewerPublication) => {
    if (!reviewerProfile?.public_slug) return;
    const url = `${window.location.origin}/creators/${reviewerProfile.public_slug}/posts/${publication.slug}`;
    if (navigator.share) {
      await navigator.share({ title: publication.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link da publicação copiado.');
  };
  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Publicações"
        description="Compartilhe sua experiência com energia solar e ajude a comunidade."
        breadcrumbs={[{ label: 'Creator Studio', href: '/creator-studio' }, { label: 'Publicações' }]}
        action={
          <Link
            href="/creator-studio/publications/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nova publicação
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard
          label="Publicadas"
          value={summary.published || 0}
          caption="Total do perfil"
          icon={PenLine}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Rascunhos"
          value={summary.draft || 0}
          caption="Prontas para editar"
          icon={FileText}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Interações"
          value={items.reduce((total, item) => total + (item.metrics?.comments || 0), 0)}
          caption="Comentários nas publicações"
          icon={Search}
          iconColor="text-slate-500"
          iconBgColor="bg-slate-50"
        />
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('published')}
            className={
              tab === 'published'
                ? 'border-b-2 border-blue-600 px-3 py-3 text-sm font-semibold text-blue-600'
                : 'px-3 py-3 text-sm text-slate-500'
            }
          >
            Publicadas
          </button>
          <button
            onClick={() => setTab('draft')}
            className={
              tab === 'draft'
                ? 'border-b-2 border-blue-600 px-3 py-3 text-sm font-semibold text-blue-600'
                : 'px-3 py-3 text-sm text-slate-500'
            }
          >
            Rascunhos
          </button>
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar publicações..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </label>
        {busy ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Carregando publicações...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
            <button onClick={() => void load()} className="ml-3 font-semibold underline">
              Tentar novamente
            </button>
          </div>
        ) : filtered.length ? (
          <div className="space-y-3">
            {filtered.map((item) => (
              <PublicationCard
                key={item.id}
                publication={item}
                onArchive={item.status === 'published' ? archive : undefined}
                onShare={item.status === 'published' ? share : undefined}
                publicUrl={
                  item.status === 'published' && reviewerProfile?.public_slug
                    ? `/creators/${reviewerProfile.public_slug}/posts/${item.slug}`
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <PublicationEmptyState status={tab} />
        )}
      </div>
    </div>
  );
}
