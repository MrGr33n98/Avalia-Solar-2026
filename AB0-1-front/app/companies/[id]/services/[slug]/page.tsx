import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2,
  ExternalLink, MapPin, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { publicCompaniesApi, fetchApiPublic } from '@/lib/api-public';
import { ApiError } from '@/lib/api-error';
import type { Company } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import { buildCompanyPath } from '@/lib/slug';
import ServiceGallery from './ServiceGallery';

type Service = {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  category?: { id: number; name: string; slug: string } | null;
  description?: string | null;
  price_from?: number | null;
  coverage?: string[];
  status: 'active' | 'inactive';
  image_url?: string | null;
  cover_image_url?: string | null;
  images?: Array<{ id: number; url: string }>;
};

type Props = { params: { id: string; slug: string } };
type PageData = { company: Company; service: Service };

async function getPageData({ id, slug }: Props['params']): Promise<PageData | null> {
  const company = await publicCompaniesApi.getById(id, {
    revalidate: 120,
    tags: ['company-profile', `company-${id}`],
  });
  if (!company) return null;

  let response: { data: Service };
  try {
    response = await fetchApiPublic<{ data: Service }>(
      `companies/${company.id}/services/${encodeURIComponent(slug)}`,
      {
        revalidate: 120,
        tags: [`company-${company.id}`, `service-${company.id}-${slug}`],
        silent: true,
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error; // Erros de infraestrutura não podem se transformar em 404 indexável.
  }

  const service = response?.data;
  if (!service || service.status !== 'active' || service.company_id !== company.id) return null;
  return { company, service };
}

function getWhatsAppUrl(company: Company, serviceName: string): string | null {
  if (company.whatsapp_enabled === false || company.cta_whatsapp_enabled === false) return null;
  const raw = String(company.whatsapp || '').replace(/\D/g, '');
  if (!raw) return null;
  const digits = raw.startsWith('55') ? raw : `55${raw}`;
  if (!/^55\d{10,11}$/.test(digits)) return null;
  const message = `Olá! Vi o serviço "${serviceName}" da ${company.name} no Avalia Solar e gostaria de saber mais.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}&utm_source=avaliasolar&utm_medium=service_page`;
}

function getMedia(service: Service): string[] {
  return Array.from(new Set([
    service.cover_image_url,
    ...(service.images || []).map((image) => image.url),
    service.image_url,
  ].filter((value): value is string => Boolean(value))));
}

function shortDescription(service: Service, company: Company): string {
  const copy = (service.description || '').trim();
  return (copy || `Conheça o serviço de ${service.name} oferecido pela ${company.name} no Avalia Solar.`).slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pageData = await getPageData(params);
  if (!pageData) {
    return { title: 'Serviço não encontrado | Avalia Solar', robots: { index: false, follow: false } };
  }

  const { company, service } = pageData;
  const companyPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonical = absoluteUrl(`${companyPath}/services/${service.slug}`);
  const title = `${service.name} | ${company.name} | Avalia Solar`;
  const description = shortDescription(service, company);
  const images = getMedia(service);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, type: 'website', images: images[0] ? [{ url: images[0] }] : [] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export const revalidate = 120;

export default async function ServiceDetailPage({ params }: Props) {
  const data = await getPageData(params);
  if (!data) notFound();

  const { company, service } = data;
  const companyPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonical = `${companyPath}/services/${service.slug}`;

  // Canonicaliza aliases da empresa; não redireciona IDs inválidos para outros tenants.
  if (params.id !== companyPath.split('/').pop()) {
    permanentRedirect(canonical);
  }

  const images = getMedia(service);
  const whatsappUrl = getWhatsAppUrl(company, service.name);
  const description = service.description?.trim();
  const coverage = Array.isArray(service.coverage) ? service.coverage.filter(Boolean) : [];
  const price = typeof service.price_from === 'number' && service.price_from > 0
    ? service.price_from.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': absoluteUrl(canonical),
    name: service.name,
    description: shortDescription(service, company),
    url: absoluteUrl(canonical),
    ...(images.length ? { image: images } : {}),
    provider: {
      '@type': 'Organization',
      name: company.name,
      url: absoluteUrl(companyPath),
      ...(company.logo_url ? { logo: company.logo_url } : {}),
    },
    ...(coverage.length ? { areaServed: coverage.map((name) => ({ '@type': 'Place', name })) } : {}),
    ...(price ? {
      offers: {
        '@type': 'Offer',
        price: service.price_from,
        priceCurrency: 'BRL',
        url: absoluteUrl(canonical),
      },
    } : {}),
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <section className="relative isolate overflow-hidden bg-[#07162d] pb-24 pt-8 text-white sm:pt-11 lg:pb-28">
        <div className="pointer-events-none absolute -right-40 -top-48 h-[540px] w-[540px] rounded-full bg-blue-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-52 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação estrutural" className="flex flex-wrap items-center gap-2 text-xs text-slate-300 sm:text-sm">
            <Link href="/" className="transition hover:text-white">Início</Link>
            <span aria-hidden="true">/</span>
            <Link href="/companies" className="transition hover:text-white">Empresas</Link>
            <span aria-hidden="true">/</span>
            <Link href={companyPath} className="max-w-[160px] truncate transition hover:text-white sm:max-w-none">{company.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">Serviços</span>
          </nav>

          <div className="mt-10 max-w-4xl sm:mt-14">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
                {service.category?.name || 'Serviço especializado'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Serviço publicado
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-[1.12] tracking-[-0.045em] sm:text-5xl lg:text-[60px]">
              {service.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {shortDescription(service, company)}
            </p>

            <Link
              href={companyPath}
              className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {company.logo_url ? (
                <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
                  <Image src={company.logo_url} alt="" fill sizes="40px" className="object-contain p-1" />
                </span>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Building2 className="h-5 w-5" /></span>
              )}
              <span>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {company.name}
                  {company.verified && <BadgeCheck aria-label="Empresa verificada" className="h-4 w-4 text-blue-300" />}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300">
                  <MapPin className="h-3.5 w-3.5" />
                  {[company.city, company.state].filter(Boolean).join(' · ') || 'Perfil empresarial'}
                </span>
              </span>
              <ArrowRight className="ml-3 h-4 w-4 text-slate-300" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 grid max-w-7xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_344px] lg:gap-10 lg:px-8">
        <div className="min-w-0 space-y-8">
          <ServiceGallery serviceName={service.name} images={images} />

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="about-service">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Detalhes do serviço</span>
            <h2 id="about-service" className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Sobre este serviço</h2>
            {description ? (
              <div className="mt-5 whitespace-pre-line break-words text-base leading-8 text-slate-600">{description}</div>
            ) : (
              <p className="mt-5 text-base leading-7 text-slate-500">A empresa ainda não adicionou uma descrição detalhada. Consulte o perfil para conhecer seu atendimento.</p>
            )}
          </section>

          {coverage.length > 0 && (
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="service-area">
              <h2 id="service-area" className="flex items-center gap-2 text-xl font-bold text-slate-950"><MapPin className="h-5 w-5 text-blue-600" /> Área de atendimento</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {coverage.map((area) => (
                  <span key={area} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">{area}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">Confirme disponibilidade e condições diretamente com a empresa.</p>
            </section>
          )}

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Transparência para contratar melhor</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Informações fornecidas pela empresa. Confira escopo, prazo, garantias e orçamento diretamente antes de contratar. Avalia Solar não executa o serviço nem garante sua prestação.
                </p>
                <Link href={companyPath} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline">
                  Conhecer a empresa e suas avaliações <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <Link href={companyPath} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Voltar ao perfil da {company.name}
          </Link>
        </div>

        <aside aria-label="Contato e informações comerciais" className="min-w-0">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(7,22,45,0.1)]">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Valor de referência</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#07162d]">
                {price || 'Sob consulta'}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {price ? 'Preço inicial informado pela empresa; o orçamento final pode variar.' : 'Solicite condições comerciais diretamente à empresa.'}
              </p>
              <div className="my-6 h-px bg-slate-100" />

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#1769f4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0b50c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <MessageCircle className="h-5 w-5" /> Consultar pelo WhatsApp <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  href={companyPath}
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#1769f4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0b50c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Consultar a empresa <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link href={companyPath} className="mt-3 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Ver perfil e avaliações <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-center text-xs leading-5 text-slate-400">Contato direto, sem contratação intermediada pelo Avalia Solar.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/90 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#113b87]"><CheckCircle2 className="h-4 w-4" /> Serviço da vitrine empresarial</div>
              <p className="mt-2 text-xs leading-5 text-slate-600">Compare informações e consulte avaliações publicadas para tomar sua decisão.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
