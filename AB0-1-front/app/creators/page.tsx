import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

type CreatorCard = {
  public_slug: string;
  name?: string;
  public_headline?: string | null;
  public_bio?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  stats?: { review_count?: number; publication_count?: number };
};

async function getCreators(): Promise<CreatorCard[]> {
  try {
    const response = await fetch(buildApiUrl('creators'), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      console.error(`[Creators] API returned ${response.status}; rendering empty state`);
      return [];
    }
    const payload = (await response.json()) as CreatorCard[] | { data?: CreatorCard[] };
    return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    console.error('[Creators] Failed to fetch creators', error);
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Creators | Avalia Solar',
  description: 'Conheça especialistas e creators do ecossistema de energia solar.',
  alternates: { canonical: '/creators' },
};

export default async function CreatorsPage() {
  const creators = await getCreators();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Rede Avalia Solar</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Especialistas que constroem o futuro da energia.</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">Conheça profissionais, especialistas e creators do ecossistema solar e mobilidade elétrica.</p>
        </header>

        {creators.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            Nenhum creator público disponível no momento.
          </div>
        ) : (
          <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Creators em destaque">
            {creators.map((creator) => {
              const name = creator.name || creator.public_slug;
              const location = [creator.city, creator.state].filter(Boolean).join(', ');
              return (
                <article key={creator.public_slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-4 p-5">
                    {creator.avatar_url ? (
                      <Image src={creator.avatar_url} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 text-xl font-bold">{name.slice(0, 1)}</div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{name}</h2>
                      <p className="truncate text-sm text-slate-600">{creator.public_headline || 'Especialista em Energia Solar'}</p>
                      {location && <p className="mt-1 text-xs text-slate-500">{location}</p>}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="line-clamp-2 min-h-10 text-sm text-slate-600">{creator.public_bio || 'Conheça este perfil público no Avalia Solar.'}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">{creator.stats?.review_count || 0} avaliações</span>
                      <Link href={`/creators/${encodeURIComponent(creator.public_slug)}`} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Ver perfil</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}