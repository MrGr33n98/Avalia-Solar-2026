import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getApiBaseUrl } from '@/lib/api-config';
import { ExternalLink } from 'lucide-react';

type Props = { params: { slug: string } };

type TreeBlock = { id: number; type: string; title: string; subtitle?: string; url?: string };

async function getTree(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/creator_tree/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  return response.ok ? response.json() : null;
}

export async function generateMetadata({ params }: Props) {
  const data = await getTree(params.slug);
  if (!data) return { title: 'Creator não encontrado | Avalia Solar' };

  const title = `${data.creator.name} | Avalia Solar`;
  const description = data.creator.headline || data.creator.bio || 'Conheça os principais links deste creator.';
  return { title, description, alternates: { canonical: `/creators/${params.slug}/tree` }, openGraph: { title, description, type: 'profile' } };
}

export default async function PublicCreatorTreePage({ params }: Props) {
  const data = await getTree(params.slug);
  if (!data) notFound();

  const blockStyles: Record<string, string> = {
    whatsapp: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    social: 'border-violet-200 bg-violet-50 text-violet-900',
    company: 'border-amber-200 bg-amber-50 text-amber-950',
    publication: 'border-blue-200 bg-blue-50 text-blue-950',
    download: 'border-violet-200 bg-violet-50 text-violet-950',
    lead_form: 'border-indigo-200 bg-indigo-50 text-indigo-950',
    separator: 'border-transparent bg-transparent px-0 py-2 text-slate-500 shadow-none',
  };

  const socialLinks = [
    ['linkedin_url', 'LinkedIn'],
    ['instagram_url', 'Instagram'],
    ['youtube_url', 'YouTube'],
    ['website_url', 'Site'],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-[#0b1730] sm:py-12">
      <div className="mx-auto w-full max-w-[600px] text-center">
        <div className="rounded-[2rem] bg-gradient-to-br from-blue-700 to-blue-500 px-6 pb-7 pt-8 text-white shadow-lg">
        <Image src={data.creator.avatar_url || '/icons/avalia-solar-192x192.png'} alt={data.creator.name} width={96} height={96} className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
        <h1 className="mt-4 text-2xl font-black">{data.creator.name}</h1>
        <p className="mt-2 text-sm text-blue-100">{data.creator.headline || data.creator.bio}</p>
        {(data.creator.city || data.creator.state) && <p className="mt-2 text-xs text-blue-200">{[data.creator.city, data.creator.state].filter(Boolean).join(' · ')}</p>}
        <div className="mt-4 flex justify-center gap-2">
          {socialLinks.map(([key, label]) => data.creator[key] ? <a key={key} href={String(data.creator[key])} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><ExternalLink className="h-4 w-4" /></a> : null)}
        </div>
        </div>
        <div className="mt-6 space-y-3">
          {data.blocks.map((block: TreeBlock) => block.type === 'separator' ? (
            <div key={block.id} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">{block.title}</div>
          ) : (
            <a key={block.id} href={block.url || '#'} onClick={() => { void fetch(`${getApiBaseUrl()}/creator_tree/${encodeURIComponent(params.slug)}/blocks/${block.id}/click`, { method: 'POST', keepalive: true }); }} className={`block min-h-14 rounded-2xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${blockStyles[block.type] || 'border-slate-200 bg-white'}`} rel="noreferrer">
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