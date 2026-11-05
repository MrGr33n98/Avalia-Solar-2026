import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Company } from '@/lib/api';
import { ApiError } from '@/lib/api-error';
import { publicCompaniesApi, fetchApiPublic } from '@/lib/api-public';
import { absoluteUrl } from '@/lib/site';
import { buildCompanyPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

type ServiceReview = {
  id: number;
  rating: number;
  headline?: string | null;
  comment?: string | null;
  author: string;
  created_at: string;
};

type ServiceDetail = {
  id: number;
  name: string;
  slug: string;
  category?: { id: number; name: string; slug: string } | null;
  description?: string | null;
  price_from?: number | null;
  coverage?: string[];
  status: 'active' | 'inactive';
  image_url?: string | null;
  image_urls?: string[];
  video_links?: string[];
  review_summary?: { count: number; average: number | null; distribution: Record<string, number> };
  reviews?: ServiceReview[];
  updated_at?: string;
};

type Props = { params: { id: string; slug: string } };

export const revalidate = 300;

async function getCompanyAndService(params: Props['params']) {
  const company = await publicCompaniesApi.getById(params.id, {
    revalidate,
    tags: ['company-profile', `company-${params.id}`],
  });
  if (!company) return null;

  try {
    const payload = await fetchApiPublic<{ data: ServiceDetail }>(
      `companies/${company.id}/services/${encodeURIComponent(params.slug)}`,
      {
        revalidate,
        tags: [`company-${company.id}`, `company-service-${company.id}-${params.slug}`],
      }
    );
    if (!payload?.data) return null;
    return { company, service: payload.data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function safeVideo(url: string): { url: string; thumbnail: string | null; label: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    let videoId: string | null = null;
    if (host === 'youtu.be') videoId = parsed.pathname.split('/')[1] || null;
    if (host === 'youtube.com' || host === 'www.youtube.com') {
      videoId = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || null;
    }
    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return { url: parsed.toString(), thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, label: 'YouTube' };
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host) &&
        /^\/(?:video\/)?\d+\/?$/.test(parsed.pathname)) {
      return { url: parsed.toString(), thumbnail: null, label: 'Vimeo' };
    }
  } catch { /* Links inválidos jamais aparecem na página. */ }
  return null;
}

function whatsappLink(company: Company, service: ServiceDetail): string | null {
  if (company.whatsapp_enabled !== true) return null;
  const digits = String(company.whatsapp || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return null;
  const phone = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const message = `Olá! Vi o serviço "${service.name}" de ${company.name} no Avalia Solar e gostaria de mais informações.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}&utm_source=avaliasolar&utm_medium=service_page`;
}

function structuredData(company: Company, service: ServiceDetail, url: string) {
  const count = service.review_summary?.count || 0;
  const average = service.review_summary?.average;
  const images = (service.image_urls || []).filter(Boolean).map(getFullImageUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.name,
    url,
    description: service.description || undefined,
    serviceType: service.category?.name || undefined,
    image: images.length ? images : undefined,
    provider: {
      '@type': 'Organization',
      '@id': `${absoluteUrl(buildCompanyPath(company.slug, company.name, company.id))}#organization`,
      name: company.name,
      url: absoluteUrl(buildCompanyPath(company.slug, company.name, company.id)),
    },
    areaServed: company.city && company.state ? {
      '@type': 'Place',
      name: `${company.city}, ${company.state}`,
    } : undefined,
    offers: service.price_from && service.price_from > 0 ? {
      '@type': 'Offer', price: service.price_from, priceCurrency: 'BRL',
    } : undefined,
    aggregateRating: count > 0 && average != null ? {
      '@type': 'AggregateRating', ratingValue: average, ratingCount: count,
      bestRating: 5, worstRating: 1,
    } : undefined,
    review: (service.reviews || []).filter(r => r.comment?.trim()).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.created_at,
      reviewBody: r.comment,
      name: r.headline || undefined,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getCompanyAndService(params);
  if (!result) return {
    title: 'Serviço não encontrado | Avalia Solar',
    robots: { index: false, follow: false },
  };
  const { company, service } = result;
  const path = `${buildCompanyPath(company.slug, company.name, company.id)}/services/${service.slug}`;
  const title = `${service.name} | ${company.name} — Avalia Solar`;
  const description = (service.description?.trim() ||
    `Conheça ${service.name}, serviço oferecido por ${company.name} no Avalia Solar.`).slice(0, 160);
  const image = service.image_urls?.[0] || service.image_url || company.banner_url;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website', title, description, url: absoluteUrl(path),
      images: image ? [{ url: getFullImageUrl(image) }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const result = await getCompanyAndService(params);
  if (!result) notFound();
  const { company, service } = result;
  const companyPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonicalPath = `${companyPath}/services/${service.slug}`;
  if (params.id !== companyPath.split('/').pop() || params.slug !== service.slug) {
    permanentRedirect(canonicalPath);
  }

  const images = [...new Set((service.image_urls?.length ? service.image_urls : [service.image_url])
    .filter((url): url is string => typeof url === 'string' && !!url.trim())
    .map(getFullImageUrl))];
  const videos = (service.video_links || []).map(safeVideo).filter((v): v is NonNullable<typeof v> => !!v);
  const bannerUrl = company.banner_url?.trim() ? getFullImageUrl(company.banner_url) : null;
  const rating = service.review_summary;
  const reviews = service.reviews || [];
  const whatsapp = whatsappLink(company, service);
  const pageUrl = absoluteUrl(canonicalPath);
  const jsonLd = structuredData(company, service, pageUrl);

  return (
    <main className="min-h-screen bg-white pb-16 text-[#101f3e]">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-10">
        <nav aria-label="Navegação estrutural" className="mb-5 flex flex-wrap gap-2 text-xs text-slate-600 sm:text-sm">
          <Link href="/companies" className="hover:text-blue-700 hover:underline">Empresas</Link>
          <span aria-hidden="true">/</span>
          <Link href={companyPath} className="hover:text-blue-700 hover:underline">{company.name}</Link>
          <span aria-hidden="true">/</span>
          <span>Serviços</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-900">{service.name}</span>
        </nav>

        <BreadcrumbSchema items={[
          { name: 'Início', item: '/' },
          { name: 'Empresas', item: '/companies' },
          { name: company.name, item: companyPath },
          { name: service.name, item: canonicalPath },
        ]} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

        {bannerUrl ? (
          <div className="relative h-[170px] w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-[220px] lg:h-[260px]">
            <Image src={bannerUrl} alt={`Banner da empresa ${company.name}`} fill priority unoptimized
              sizes="(max-width: 768px) 100vw, 1480px" className="object-cover" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 sm:py-16">
            <p className="text-sm font-semibold text-blue-700">{company.name}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 pb-6">
          {company.logo_url && (
            <Image src={getFullImageUrl(company.logo_url)} alt={`Logo ${company.name}`}
              width={48} height={48} unoptimized className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1" />
          )}
          <Link href={companyPath} className="text-base font-bold text-[#101f3e] hover:text-blue-700">{company.name}</Link>
          {company.verified === true && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Empresa verificada
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-b border-slate-200 pb-4 text-sm font-semibold">
          <a href="#sobre" className="border-b-2 border-blue-600 pb-3 text-blue-700">Visão geral</a>
          {images.length > 0 && <a href="#galeria" className="pb-3 text-slate-700 hover:text-blue-700">Galeria do projeto</a>}
          {videos.length > 0 && <a href="#videos" className="pb-3 text-slate-700 hover:text-blue-700">Vídeos do serviço</a>}
          <a href="#avaliacoes" className="pb-3 text-slate-700 hover:text-blue-700">
            Avaliações{rating?.count ? ` (${rating.count})` : ''}
          </a>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-10">
            <section id="sobre" aria-labelledby="service-title" className="border-b border-slate-200 pb-8">
              {service.category?.name && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">{service.category.name}</p>}
              <h1 id="service-title" className="max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{service.name}</h1>
              {service.description?.trim() ? (
                <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-slate-700">{service.description}</p>
              ) : (
                <p className="mt-5 text-sm text-slate-500">A empresa ainda não adicionou uma descrição detalhada deste serviço.</p>
              )}
              {service.price_from != null && Number(service.price_from) > 0 && (
                <p className="mt-5 text-sm font-semibold">A partir de {Number(service.price_from).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              )}
            </section>

            {images.length > 0 && (
              <section id="galeria" aria-labelledby="galeria-title" className="border-b border-slate-200 pb-9">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                  <h2 id="galeria-title" className="text-xl font-bold">Galeria do projeto <span className="text-sm font-normal text-slate-500">({images.length} {images.length === 1 ? 'foto' : 'fotos'})</span></h2>
                  <span className="text-xs text-slate-500">Registros cadastrados pela empresa</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {images.map((image, index) => (
                    <a key={image} href={image} target="_blank" rel="noopener noreferrer"
                      aria-label={`Abrir foto ${index + 1} do serviço ${service.name}`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">
                      <Image src={image} alt={`${service.name} — foto ${index + 1} enviada por ${company.name}`}
                        fill unoptimized sizes="(max-width: 640px) 50vw, 220px"
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section id="videos" aria-labelledby="videos-title" className="border-b border-slate-200 pb-9">
                <h2 id="videos-title" className="mb-4 text-xl font-bold">Vídeos do serviço <span className="text-sm font-normal text-slate-500">({videos.length})</span></h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map((video, index) => (
                    <a key={video.url} href={video.url} target="_blank" rel="noopener noreferrer"
                      className="group overflow-hidden rounded-xl border border-slate-200 hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-blue-600">
                      {video.thumbnail && (
                        <div className="relative aspect-video bg-slate-100">
                          <Image src={video.thumbnail} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                        </div>
                      )}
                      <div className="px-4 py-3 text-sm font-semibold">Assistir vídeo {index + 1} — {video.label}</div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section id="avaliacoes" aria-labelledby="avaliacoes-title" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="avaliacoes-title" className="text-xl font-bold">Avaliações deste serviço</h2>
                <Link href={`${companyPath}/review?service_id=${service.id}`}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  Avaliar este serviço
                </Link>
              </div>
              {rating && rating.count > 0 && rating.average != null ? (
                <>
                  <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 p-5">
                    <strong className="text-4xl">{Number(rating.average).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span className="text-lg text-slate-500">/5</span></strong>
                    <p className="pb-1 text-sm text-slate-600">{rating.count} {rating.count === 1 ? 'avaliação publicada' : 'avaliações publicadas'} sobre este serviço</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map((review) => (
                      <article key={review.id} className="rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{review.author}</span>
                          <time dateTime={review.created_at} className="text-xs text-slate-500">
                            {new Date(review.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </time>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-amber-600">{review.rating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}/5</p>
                        {review.headline && <h3 className="mt-3 text-sm font-bold">{review.headline}</h3>}
                        {review.comment && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>}
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 text-sm text-slate-600">
                  Este serviço ainda não possui avaliações publicadas. Avaliações gerais da empresa não são contabilizadas aqui.
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-28" aria-label="Contato com a empresa">
            <h2 className="text-xl font-bold">Fale com {company.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Consulte a disponibilidade e as condições deste serviço diretamente com a empresa.</p>
            <div className="mt-6 space-y-3">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700">
                  Falar pelo WhatsApp
                </a>
              )}
              <Link href={companyPath}
                className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Ver perfil da empresa
              </Link>
            </div>
            {(company.city || company.state) && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Localização da empresa</p>
                <p className="mt-2 text-sm">{[company.city, company.state].filter(Boolean).join(' — ')}</p>
              </div>
            )}
            <p className="mt-5 text-xs leading-5 text-slate-500">Informações comerciais e imagens fornecidas pela empresa. Avaliações publicadas após moderação.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
