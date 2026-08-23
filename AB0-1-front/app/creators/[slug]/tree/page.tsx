import { notFound } from 'next/navigation';
import Image from 'next/image';
import { publicCreatorTreeApi, type PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { Globe, Instagram, Linkedin, Youtube, Link2, MessageCircle, Download, FileText, Building2, type LucideIcon } from 'lucide-react';
import { normalizeSocialUrl, type SocialUrlKind } from '@/lib/socialUrl';
import { CreatorTreeLink } from '@/components/creator/tree/CreatorTreeLink';
import { CreatorTreeViewTracker } from '@/components/creator/tree/CreatorTreeViewTracker';
import { CreatorShareButton } from '@/components/creator/CreatorShareButton';

type Props = { params: { slug: string } };

type TreeBlock = PublicCreatorTreeResponse['blocks'][number];

async function getTree(slug: string): Promise<PublicCreatorTreeResponse | null> {
  try {
    return await publicCreatorTreeApi.get(slug);
  } catch {
    return null;
  }
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

  const blockColors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-950',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    violet: 'border-violet-200 bg-violet-50 text-violet-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    dark: 'border-slate-700 bg-slate-800 text-white',
  };

  const blockIcons: Record<string, typeof Link2> = {
    external_link: Link2,
    whatsapp: MessageCircle,
    social: Globe,
    company: Building2,
    publication: FileText,
    download: Download,
    lead_form: FileText,
  };

  const socialLinks: ReadonlyArray<readonly [
    'linkedin_url' | 'instagram_url' | 'youtube_url' | 'website_url',
    string,
    SocialUrlKind,
    LucideIcon,
  ]> = [
    ['linkedin_url', 'LinkedIn', 'linkedin', Linkedin],
    ['instagram_url', 'Instagram', 'instagram', Instagram],
    ['youtube_url', 'YouTube', 'youtube', Youtube],
    ['website_url', 'Site', 'website', Globe],
  ];

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-[#0b1730] sm:py-12">
      <CreatorTreeViewTracker slug={params.slug} />
      <div className="mx-auto w-full max-w-[600px] text-center">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 to-blue-500 px-6 pb-7 pt-8 text-white shadow-lg">
        {data.creator.banner_url ? <Image src={data.creator.banner_url} alt="" fill sizes="600px" className="object-cover opacity-30" /> : <div className="absolute inset-0 bg-[url('/images/avalia-solar-banner-placeholder-v1.webp')] bg-cover bg-center opacity-20" />}
        <div className="relative z-10">
        <Image src={data.creator.avatar_url || '/icons/avalia-solar-192x192.png'} alt={data.creator.name} width={96} height={96} className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
        <h1 className="mt-4 text-2xl font-black">{data.creator.name}</h1>
        <p className="mt-2 text-sm text-blue-100">{data.creator.headline || data.creator.bio}</p>
        {(data.creator.city || data.creator.state) && <p className="mt-2 text-xs text-blue-200">{[data.creator.city, data.creator.state].filter(Boolean).join(' · ')}</p>}
        <div className="mt-4 flex justify-center gap-2">
          {socialLinks.map(([key, label, kind, Icon]) => data.creator[key] ? <a key={key} href={normalizeSocialUrl(String(data.creator[key]), kind)} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><Icon className="h-4 w-4" /></a> : null)}
        </div>
        <div className="mt-4 flex justify-center">
          <CreatorShareButton creatorSlug={params.slug} title={`${data.creator.name} | Avalia Solar`} context={{ placement: 'tree', format: 'link' }} />
        </div>
        </div>
        </div>
        <div className="mt-6 space-y-3">
          {data.blocks.map((block: TreeBlock) => block.type === 'separator' ? (
            <div key={block.id} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">{block.title}</div>
          ) : (
            <CreatorTreeLink key={block.id} slug={params.slug} blockId={block.id} href={block.url || '#'} className={`block min-h-14 rounded-2xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${blockColors[String(block.metadata?.color)] || blockStyles[block.type] || 'border-slate-200 bg-white'}`}>
              {(() => { const Icon = blockIcons[String(block.metadata?.icon)] || blockIcons[block.type] || Link2; return <span className="flex items-center gap-3 font-bold"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70"><Icon className="h-5 w-5" /></span>{block.title}</span>; })()}
              {block.subtitle && <span className="mt-1 block text-xs opacity-75">{block.subtitle}</span>}
            </CreatorTreeLink>
          ))}
        </div>
        <p className="mt-10 text-xs font-semibold text-slate-400">Powered by Avalia Solar</p>
      </div>
    </main>
  );
}