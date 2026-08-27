import Image from 'next/image';
import { CheckCircle2, Instagram, Linkedin, ArrowUpRight } from 'lucide-react';
import { CreatorShareButton } from './CreatorShareButton';
import { track } from '@/lib/analytics/lazy';

type Creator = {
  name: string;
  public_headline?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  public_banner_url?: string;
  website_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  tree_enabled?: boolean;
  tree_url?: string | null;
  gamification_level?: {
    name: string;
  } | null;
};

type Props = {
  creator: Creator;
  creatorSlug: string;
  publicationCount: number;
  reviewCount: number;
};

export function CreatorHero({ creator, creatorSlug, publicationCount, reviewCount }: Props) {
  const location = [creator.city, creator.state].filter(Boolean).join(', ') || 'Brasil';
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="relative h-[140px] overflow-hidden sm:h-[170px] lg:h-[205px]">
        <Image
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
          src={creator.public_banner_url || '/images/banner-placeholder.svg'}
          alt=""
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-900/25" />
      </div>
      <div className="px-4 pb-0 sm:px-6 lg:px-8">
        <div className="-mt-12 lg:-mt-14">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#f4b63f] ring-4 ring-white shadow-lg lg:h-28 lg:w-28">
            {creator.avatar_url ? (
              <Image
                fill
                sizes="112px"
                src={creator.avatar_url}
                alt={creator.name}
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-4xl font-bold text-[#0b1730]">
                {creator.name.slice(0, 1)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 pb-5">
          <h1 className="flex flex-wrap items-center gap-2 break-words text-2xl font-bold leading-tight text-[#0b1730] lg:text-3xl">
            {creator.name}{' '}
            <CheckCircle2
              aria-label="Creator verificado"
              role="img"
              className="h-5 w-5 shrink-0 fill-[#1e5eff] text-white lg:h-6 lg:w-6"
            />
            {creator.gamification_level?.name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-100">
                Nível {creator.gamification_level.name}
              </span>
            )}
          </h1>
          <p className="mt-1 text-base text-[#53627a] lg:text-lg">
            {creator.public_headline || 'Especialista em Energia Solar'}
          </p>
          <p className="mt-1 text-sm text-[#718096]">⌖ {location}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#contato"
              className="inline-flex min-h-10 items-center rounded-lg bg-[#1e5eff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#174dcc]"
            >
              Entrar em contato
            </a>
            {creator.whatsapp_url && (
              <a
                href={creator.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('whatsapp_click', {
                  company_id: 'creator',
                  company_name: creatorSlug,
                  cta_location: 'creator_profile_hero',
                })}
                className="inline-flex min-h-10 items-center rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                WhatsApp
              </a>
            )}
            {creator.tree_enabled && creator.tree_url && (
              <a
                href={creator.tree_url}
                className="group relative inline-flex min-h-[44px] items-center justify-center overflow-hidden rounded-lg p-[1.5px] transition-transform hover:scale-[1.02] sm:min-h-10"
              >
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#3b82f6_50%,#e2e8f0_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#a855f7_50%,#3b82f6_100%)]" />
                <span className="relative z-10 inline-flex h-full w-full items-center justify-center gap-1.5 rounded-[6.5px] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors group-hover:bg-slate-50 group-hover:text-blue-700">
                  Meu Tree
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            )}
            <CreatorShareButton creatorSlug={creatorSlug} />
          </div>
        </div>
        <nav
          aria-label="Seções do perfil"
          className="-mx-4 flex min-w-0 gap-6 overflow-x-auto border-t border-slate-200/70 px-4 pt-4 text-sm font-semibold sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <a
            className="whitespace-nowrap border-b-2 border-[#1e5eff] pb-3 text-[#1e5eff]"
            href="#sobre"
          >
            Visão geral
          </a>
          <a className="whitespace-nowrap pb-3" href="#publicacoes">
            Publicações <span className="text-slate-400">{publicationCount}</span>
          </a>
          <a className="whitespace-nowrap pb-3" href="#avaliacoes">
            Avaliações <span className="text-slate-400">{reviewCount}</span>
          </a>
          <a className="whitespace-nowrap pb-3" href="#solucoes">
            Soluções
          </a>
          <a className="whitespace-nowrap pb-3" href="#conquistas">
            Conquistas
          </a>
          <a className="whitespace-nowrap pb-3" href="#seguidores">
            Seguidores
          </a>
          <a className="whitespace-nowrap pb-3" href="#seguindo">
            Seguindo
          </a>
        </nav>
      </div>
    </section>
  );
}
