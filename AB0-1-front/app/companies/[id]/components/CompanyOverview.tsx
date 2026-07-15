import Image from 'next/image';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AnswerBlock from '@/components/seo/AnswerBlock';
import WhatsappButton from '@/components/WhatsappButton';
import { Company, Review } from '@/lib/api';
import {
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  MessageSquare,
  Info,
  Users,
  Globe2,
  Phone,
  MapPin,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import SponsoredBanner from './SponsoredBanner';
import { RatingStars } from '@/components/RatingStars';
import { projectTypeVisualFor } from '@/lib/company-project-visuals';
import { getFullImageUrl } from '@/utils/image';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface CompanyOverviewProps {
  company: Company;
  reviews?: Review[];
  reviewsLoading?: boolean;
  showCompetitorBanners?: boolean;
}

type CompanyOverviewSource = Company & {
  average_rating?: number | string | null;
  total_reviews?: number | string | null;
  reviews_count?: number | string | null;
};

type ReviewOverviewSource = Review & {
  comment?: string | null;
  body?: string | null;
  user?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function CompanyOverview({
  company,
  reviews = [],
  reviewsLoading = false,
  showCompetitorBanners = true,
}: CompanyOverviewProps) {
  const overviewCompany = company as CompanyOverviewSource;
  const averageRating = Number(
    overviewCompany.average_rating ?? overviewCompany.rating_avg ?? overviewCompany.rating ?? 0
  );
  const ratingCount = Number(
    overviewCompany.rating_count ??
      overviewCompany.total_reviews ??
      overviewCompany.reviews_count ??
      0
  );
  const recentReviews = reviews
    .filter((review) => {
      const reviewSource = review as ReviewOverviewSource;
      const content = String(reviewSource.comment ?? reviewSource.body ?? '').trim();
      return content.length > 0;
    })
    .slice(0, 2);

  const totalReads = reviews.reduce((acc, r) => acc + (Number(r.metadata?.read_count) || 0), 0);
  const totalClicks = reviews.reduce((acc, r) => acc + (Number(r.metadata?.cta_clicks) || 0), 0);

  return (
    <>
      <MobileCompanyOverview company={company} />
      <div className="hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 md:block">
        {/* Impacto das Avaliações (Proof of Value) */}
        {ratingCount > 0 && (totalReads > 0 || totalClicks > 0) && (
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg border border-blue-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageSquare className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100 mb-4">
                Impacto das suas Avaliações
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-3xl font-black mb-1">{totalReads}</p>
                  <p className="text-xs font-semibold text-blue-100">
                    Pessoas leram seus mini cases
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-3xl font-black mb-1">{totalClicks}</p>
                  <p className="text-xs font-semibold text-blue-100">
                    Cliques em seus CTAs de contato
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sobre a Empresa */}
        <section>
          <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-4 flex items-center gap-2">
            Sobre a Empresa
            <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4 rounded-full" />
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
            {company.description ? (
              <p>{company.description}</p>
            ) : (
              <p className="italic text-slate-500">Nenhuma descrição disponível.</p>
            )}
          </div>
        </section>

        <AnswerBlock
          tone="slate"
          question={`O que avaliar antes de contratar ${company.name}?`}
          answer={`Antes de contratar ${company.name}, confira se a empresa atende sua cidade, quais tipos de projeto declara executar, como estao as avaliacoes publicadas e se existem informacoes de contato, garantias e documentacao suficientes. O perfil no Avalia Solar ajuda a reunir esses sinais em uma unica pagina de comparacao.`}
          facts={[
            company.verified ? 'Perfil verificado' : 'Verifique a documentacao',
            company.city && company.state ? `${company.city}/${company.state}` : 'Localizacao informada',
            ratingCount > 0 ? `${ratingCount} avaliacoes` : 'Sem avaliacoes publicadas',
          ]}
          href="/help"
          linkLabel="Veja como avaliar uma empresa"
        />

        {/* Sponsored Inline Banner */}
        {showCompetitorBanners && (
          <SponsoredBanner
            slotKey="company_overview_inline"
            companyId={company.id}
            variant="inline"
          />
        )}

        {/* Tipos de Projetos */}
        {company.project_types && company.project_types.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Tipos de Projetos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {company.project_types.map((type) => {
                const { iconSrc } = projectTypeVisualFor(type);

                return (
                  <div
                    key={type}
                    className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="bg-blue-50/50 p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center relative w-10 h-10">
                      {iconSrc ? (
                        <Image src={iconSrc} alt={type} fill className="object-contain p-1.5" />
                      ) : (
                        <Zap className="h-4 w-4 text-blue-600 fill-current" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{type}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Avaliações
          </h3>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            {ratingCount > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <RatingStars
                    rating={averageRating}
                    count={ratingCount}
                    showCount={true}
                    showRatingValue={true}
                    starClassName="h-4 w-4"
                    ratingValueClassName="text-base font-extrabold text-slate-900"
                    countClassName="text-sm font-semibold text-slate-500"
                  />
                  <span className="text-sm font-semibold text-slate-600">
                    {ratingCount} avaliações publicadas
                  </span>
                </div>

                {reviewsLoading ? (
                  <p className="text-sm text-slate-500">Carregando avaliações...</p>
                ) : recentReviews.length > 0 ? (
                  <div className="space-y-2">
                    {recentReviews.map((review) => {
                      const reviewSource = review as ReviewOverviewSource;
                      const authorName = reviewSource.user?.name || 'Usuário';
                      const avatarRaw = reviewSource.user?.avatar_url;
                      const avatarUrl = avatarRaw ? getFullImageUrl(avatarRaw) : null;
                      const criterionScores = Array.isArray(review.review_criterion_scores)
                        ? review.review_criterion_scores
                        : [];
                      const initials = authorName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((token: string) => token.charAt(0).toUpperCase())
                        .join('');
                      const content = String(reviewSource.comment ?? reviewSource.body ?? '').trim();
                      return (
                        <div
                          key={review.id}
                          className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={`Avatar de ${authorName}`}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-600">
                                  {initials || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700">{authorName}</p>
                              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{content}</p>
                              {criterionScores.length > 0 && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {criterionScores.map((score) => (
                                    <div
                                      key={score.id}
                                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                                    >
                                      <p className="text-[11px] font-bold text-slate-600">
                                        {score.title}
                                      </p>
                                      <RatingStars
                                        rating={Number(score.score || 0)}
                                        showCount={false}
                                        showRatingValue={true}
                                        className="mt-1"
                                        starClassName="h-3 w-3"
                                        ratingValueClassName="text-xs font-black text-slate-900"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Ainda não há comentários de avaliações para exibir.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Esta empresa ainda não possui avaliações publicadas.
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Serviços Oferecidos */}
          {company.services && Array.isArray(company.services) && company.services.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Serviços Oferecidos
              </h3>
              <ul className="space-y-2">
                {company.services.map((service) => (
                  <li key={service} className="flex items-center text-slate-600 group text-sm">
                    <span className="mr-3 h-1.5 w-1.5 rounded-full bg-emerald-400/40 group-hover:bg-emerald-500 transition-colors" />
                    <span className="group-hover:text-slate-900 transition-colors font-medium">
                      {service}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Certificações */}
          {company.certifications &&
            Array.isArray(company.certifications) &&
            company.certifications.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Certificações
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.certifications.map((cert) => (
                    <Badge
                      key={cert}
                      variant="outline"
                      className="px-3 py-1.5 text-[11px] font-bold gap-1.5 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors uppercase tracking-tight"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>
    </>
  );
}

function MobileCompanyOverview({ company }: { company: Company }) {
  const foundedYear = Number(company.founded_year || 0);
  const yearsInBusiness =
    foundedYear > 1900 ? Math.max(1, new Date().getFullYear() - foundedYear) : null;
  const employeesCount = Number(company.employees_count || 0);
  const projectCount =
    (Array.isArray(company.project_types) ? company.project_types.length : 0) +
    (Array.isArray(company.services_offered) ? company.services_offered.length : 0);
  const location = [company.address, company.city, company.state].filter(Boolean).join(', ');
  const whatsappUrl = (company as Company & { whatsapp_url?: string | null }).whatsapp_url;
  const whatsappHref =
    whatsappUrl ||
    (company.whatsapp ? `https://wa.me/${String(company.whatsapp).replace(/\D/g, '')}` : null);
  const phoneHref = company.phone ? `tel:${String(company.phone).replace(/\D/g, '')}` : null;

  const stats = [
    {
      icon: ShieldCheck,
      value: yearsInBusiness ? `+${yearsInBusiness} anos` : 'Verificada',
      label: yearsInBusiness ? 'No mercado' : 'Perfil validado',
    },
    {
      icon: CheckCircle2,
      value: projectCount > 0 ? `${projectCount}+` : 'Projetos',
      label: projectCount > 0 ? 'Soluções cadastradas' : 'Atuação informada',
    },
    {
      icon: Users,
      value: employeesCount > 0 ? `${employeesCount}+` : 'Equipe',
      label: employeesCount > 0 ? 'Profissionais' : 'Especializada',
    },
    {
      icon: ShieldCheck,
      value: 'Suporte',
      label: 'Técnico e comercial',
    },
  ];

  return (
    <div className="space-y-3 md:hidden">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Info className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-950">Sobre a Empresa</h2>
              <span className="text-slate-700">⌃</span>
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700">
              {company.description || 'Empresa cadastrada no Avalia Solar com atuação informada.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-slate-100 px-2 py-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={`${stat.value}-${stat.label}`}
                className={`px-2 text-center ${index > 0 ? 'border-l border-slate-100' : ''}`}
              >
                <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-black leading-tight text-slate-950">{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium leading-tight text-slate-600">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 text-sm font-bold text-slate-800">
          <ContactCell icon={Globe2} label="Site" href={company.website || undefined} external />
          <ContactCell icon={Phone} label="Ligar" href={phoneHref || undefined} />
          <ContactCell icon={MapPin} label={location || 'Localização não informada'} />
          <ContactCell
            icon={Clock}
            label={company.working_hours || 'Atendimento comercial'}
            badge="Atendimento"
          />
        </div>
      </section>

      <section className="grid grid-cols-[1.15fr_0.85fr] gap-3">
        <Button
          onClick={() =>
            openQuoteWizard({
              source: 'company-mobile-overview',
              preferredCompanyId: company.id,
            })
          }
          className="h-14 rounded-2xl bg-blue-700 text-base font-black text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] hover:bg-blue-800"
        >
          <FileText className="mr-2 h-5 w-5" />
          Solicitar orçamento
        </Button>

        {whatsappHref ? (
          <WhatsappButton
            size="default"
            enabled
            href={whatsappHref}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white text-base font-black text-slate-950 shadow-sm hover:bg-slate-50"
            label="WhatsApp"
            companyId={company.id}
            requireSignup
            signupGateSource="contact_reveal"
            signupGateTitle="Crie sua conta para falar no WhatsApp"
            signupGateDescription="Libere o contato direto desta empresa e volte exatamente para o mesmo lugar depois do cadastro."
          />
        ) : (
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-slate-200 text-base font-black text-slate-500"
            disabled
          >
            WhatsApp
          </Button>
        )}
      </section>
    </div>
  );
}

function ContactCell({
  icon: Icon,
  label,
  href,
  badge,
  external = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  badge?: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex min-h-[70px] items-center gap-3 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-blue-700" />
      <div className="min-w-0">
        {badge && (
          <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700">
            {badge}
          </span>
        )}
        <p className="line-clamp-2 text-sm font-bold leading-tight text-slate-800">
          {label}
          {external && <ExternalLink className="ml-1 inline h-3.5 w-3.5" />}
        </p>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      {content}
    </a>
  );
}
