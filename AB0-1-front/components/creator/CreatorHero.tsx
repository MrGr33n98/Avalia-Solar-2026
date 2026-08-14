import Image from 'next/image';

type Creator = { name: string; public_headline?: string; city?: string; state?: string; avatar_url?: string; public_banner_url?: string };

type Props = { creator: Creator; publicationCount: number; reviewCount: number };

export function CreatorHero({ creator, publicationCount, reviewCount }: Props) {
  const location = [creator.city, creator.state].filter(Boolean).join(', ') || 'Brasil';
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[140px] overflow-hidden sm:h-[170px] lg:h-[205px]">
        <Image fill priority sizes="(max-width: 768px) 100vw, 1280px" src={creator.public_banner_url || '/images/banner-placeholder.svg'} alt="" className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-900/25" />
      </div>
      <div className="px-4 pb-0 sm:px-6 lg:px-8">
        <div className="-mt-12 lg:-mt-14">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-amber-400 ring-4 ring-white shadow-lg lg:h-28 lg:w-28">
            {creator.avatar_url ? <Image fill sizes="112px" src={creator.avatar_url} alt={creator.name} className="object-cover" unoptimized /> : <span className="flex h-full items-center justify-center text-4xl font-bold text-slate-900">{creator.name.slice(0, 1)}</span>}
          </div>
        </div>
        <div className="mt-4 pb-5">
          <h1 className="break-words text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">{creator.name}</h1>
          <p className="mt-1 text-base text-slate-600 lg:text-lg">{creator.public_headline || 'Especialista em Energia Solar'}</p>
          <p className="mt-1 text-sm text-slate-500">⌖ {location} <span aria-hidden="true">·</span> <span className="font-medium text-emerald-700">Creator verificado</span></p>
        </div>
        <nav aria-label="Seções do perfil" className="-mx-4 flex min-w-0 gap-6 overflow-x-auto border-t border-slate-100 px-4 pt-4 text-sm font-semibold sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <a className="whitespace-nowrap border-b-2 border-blue-600 pb-3 text-blue-600" href="#sobre">Visão geral</a>
          <a className="whitespace-nowrap pb-3" href="#publicacoes">Publicações <span className="text-slate-400">{publicationCount}</span></a>
          <a className="whitespace-nowrap pb-3" href="#avaliacoes">Avaliações <span className="text-slate-400">{reviewCount}</span></a>
          <a className="whitespace-nowrap pb-3" href="#solucoes">Soluções</a>
          <a className="whitespace-nowrap pb-3" href="#conquistas">Conquistas</a>
        </nav>
      </div>
    </section>
  );
}
