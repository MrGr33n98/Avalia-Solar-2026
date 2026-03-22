import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Company, Review } from '@/lib/api';
import { CheckCircle2, Award, Zap, ShieldCheck, MessageSquare } from 'lucide-react';
import SponsoredBanner from './SponsoredBanner';
import { RatingStars } from '@/components/RatingStars';
import { getFullImageUrl } from '@/utils/image';

interface CompanyOverviewProps {
  company: Company;
  reviews?: Review[];
  reviewsLoading?: boolean;
  showCompetitorBanners?: boolean;
}

export default function CompanyOverview({
  company,
  reviews = [],
  reviewsLoading = false,
  showCompetitorBanners = true,
}: CompanyOverviewProps) {
  const averageRating = Number(
    (company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0
  );
  const ratingCount = Number(
    (company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0
  );
  const recentReviews = reviews
    .filter((review) => {
      const content = String((review as any)?.comment ?? (review as any)?.body ?? '').trim();
      return content.length > 0;
    })
    .slice(0, 2);

  const totalReads = reviews.reduce((acc, r) => acc + (Number(r.metadata?.read_count) || 0), 0);
  const totalClicks = reviews.reduce((acc, r) => acc + (Number(r.metadata?.cta_clicks) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Impacto das Avaliações (Proof of Value) */}
      {ratingCount > 0 && (totalReads > 0 || totalClicks > 0) && (
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg border border-blue-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MessageSquare className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100 mb-4">Impacto das suas Avaliações</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-black mb-1">{totalReads}</p>
                <p className="text-xs font-semibold text-blue-100">Pessoas leram seus mini cases</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-black mb-1">{totalClicks}</p>
                <p className="text-xs font-semibold text-blue-100">Cliques em seus CTAs de contato</p>
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
            <p className="italic text-slate-400">Nenhuma descrição disponível.</p>
          )}
        </div>
      </section>

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
              const typeLower = type.toLowerCase();
              let iconSrc = null;
              if (typeLower.includes('residenc')) iconSrc = '/images/icone-avalia-solar-residencial.png';
              else if (typeLower.includes('comerci')) iconSrc = '/images/comercial-icone-avalia-solar.png';
              else if (typeLower.includes('rura')) iconSrc = '/images/rural-icone-avalia-solar.png';

              return (
                <div 
                  key={type} 
                  className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="bg-blue-50/50 p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center relative w-10 h-10">
                    {iconSrc ? (
                      <Image 
                        src={iconSrc} 
                        alt={type} 
                        fill 
                        className="object-contain p-1.5"
                      />
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
                    const authorName = (review as any)?.user?.name || 'Usuário';
                    const avatarRaw = (review as any)?.user?.avatar_url;
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
                    const content = String((review as any)?.comment ?? (review as any)?.body ?? '').trim();
                    return (
                      <div key={review.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
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
                <p className="text-sm text-slate-500">Ainda não há comentários de avaliações para exibir.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Esta empresa ainda não possui avaliações publicadas.</p>
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
                  <span className="group-hover:text-slate-900 transition-colors font-medium">{service}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Certificações */}
        {company.certifications && Array.isArray(company.certifications) && company.certifications.length > 0 && (
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
  );
}
