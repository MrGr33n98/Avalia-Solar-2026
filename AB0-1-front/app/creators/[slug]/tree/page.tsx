import { notFound } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-config';

type Props = { params: { slug: string } };

async function getTree(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/creator_tree/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60, tags: [`creator-tree-${slug}`] },
  });
  return response.ok ? response.json() : null;
}

export default async function PublicCreatorTreePage({ params }: Props) {
  const data = await getTree(params.slug);
  if (!data) notFound();

  const socialLinks = [
    ['linkedin_url', 'LinkedIn'],
    ['instagram_url', 'Instagram'],
    ['youtube_url', 'YouTube'],
    ['website_url', 'Site'],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-[#0b1730] sm:py-12">
      <div className="mx-auto w-full max-w-[600px] text-center">
        <img src={data.creator.avatar_url || '/icons/avalia-solar-192x192.png'} alt={data.creator.name} className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
        <h1 className="mt-4 text-2xl font-black">{data.creator.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{data.creator.headline || data.creator.bio}</p>
        {(data.creator.city || data.creator.state) && <p className="mt-2 text-xs text-slate-400">{[data.creator.city, data.creator.state].filter(Boolean).join(' · ')}</p>}
        <div className="mt-4 flex justify-center gap-2">
          {socialLinks.map(([key, label]) => data.creator[key] ? <a key={key} href={String(data.creator[key])} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700">{label}</a> : null)}
        </div>
        <div className="mt-6 space-y-3">
          {data.blocks.map((block: { id: number; title: string; subtitle?: string; url?: string }) => (
            <a key={block.id} href={block.url || '#'} onClick={() => { void fetch(`${getApiBaseUrl()}/creator_tree/${encodeURIComponent(params.slug)}/blocks/${block.id}/click`, { method: 'POST' }); }} className="block min-h-14 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300" rel="noreferrer">
              <span className="block font-bold">{block.title}</span>
              {block.subtitle && <span className="mt-1 block text-xs text-slate-500">{block.subtitle}</span>}
            </a>
          ))}
        </div>
        <p className="mt-10 text-xs font-semibold text-slate-400">Powered by Avalia Solar</p>
      </div>
    </main>
  );
}