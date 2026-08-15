'use client';

import Link from 'next/link';
import { Star, MapPin, Clock, CheckCircle, ChevronRight, Info, Globe } from 'lucide-react';
import { Company } from '@/lib/api';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { cn } from '@/lib/utils';
import { buildCompanyPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { hasPaidPlan } from '@/lib/feature-access';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface SearchCompanyListCardProps {
  company: Company;
  className?: string;
}

export function SearchCompanyListCard({ company, className }: SearchCompanyListCardProps) {
  const rating = Number(company.rating_avg || company.average_rating || company.rating || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '0.0';
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const href = buildCompanyPath(company.slug, company.name, company.id);
  const reviewsHref = `${href}#avaliacoes`;

  const location = [company.city, company.state].filter(Boolean).join(', ');
  const description =
    company.description ||
    company.about ||
    'Especialista em soluções de energia solar e eficiência energética.';
  const slaLabel =
    (company as any).operations?.sla_label || (company as any).response_time_sla || '24h';
  const coverageLabel = 'Consulte'; // Could map from API if available

  // hasPaidPlan: única fonte de verdade — evitar duplicar os critérios de plano aqui.
  const canRequestQuote = hasPaidPlan(company);

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col lg:flex-row items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      {/* Left Column: Logo & Info */}
      <div className="flex w-full lg:w-[28%] flex-col justify-center p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
        <div className="flex items-center gap-4">
          <Link href={href} className="shrink-0">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={company.name}
              size="lg"
              badges={company.badges}
              verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
              className="border border-slate-100 bg-white shadow-sm"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={href}>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg hover:text-blue-700 transition-colors line-clamp-1">
                  {company.name}
                </h3>
              </Link>
              <Popover>
                <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        logoUrl={company.logo_url}
                        name={company.name}
                        size="sm"
                        className="border border-slate-100 bg-white"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-tight">
                          {company.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Desde {company.founded_year || 2018} no Brasil
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {company.description ||
                        `${company.name} é uma empresa parceira credenciada, especializada em homologação, projetos e instalações fotovoltaicas de alta eficiência.`}
                    </p>
                    <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Fundação</span>
                        <span className="font-bold text-slate-900">
                          {company.founded_year || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Sede</span>
                        <span className="font-bold text-slate-900">
                          {company.city || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Presença no Brasil</span>
                        <span className="font-bold text-slate-900">
                          Desde {company.founded_year || 2018}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Site oficial</span>
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            {company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            <Globe className="w-3 h-3 text-blue-500" />
                          </a>
                        ) : (
                          <span className="font-bold text-slate-400">Não informado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                {ratingLabel}
              </span>
              <span className="text-slate-300">|</span>
              <span>{reviewCount} aval.</span>
              <Popover>
                <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-85 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-slate-900 leading-none">
                        {ratingLabel}
                      </span>
                      <div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3.5 h-3.5',
                                i < Math.floor(rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 fill-slate-200'
                              )}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ({reviewCount} avaliações registradas)
                        </div>
                      </div>
                    </div>

                    {/* Stars breakdown */}
                    <div className="space-y-1.5 pt-2">
                      {[
                        { label: '5 estrelas', pct: '96%' },
                        { label: '4 estrelas', pct: '3%' },
                        { label: '3 estrelas', pct: '1%' },
                        { label: '2 estrelas', pct: '0%' },
                        { label: '1 estrela', pct: '0%' },
                      ].map((starRow) => (
                        <div key={starRow.label} className="flex items-center gap-3 text-[10px]">
                          <span className="w-16 text-slate-400 font-semibold">{starRow.label}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full"
                              style={{ width: starRow.pct }}
                            />
                          </div>
                          <span className="w-8 text-right text-slate-500 font-bold">
                            {starRow.pct}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Última avaliação: recente
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant="link"
                        className="text-blue-600 font-bold p-0 text-xs hover:underline h-auto"
                      >
                        <Link href={href}>Ver todas as avaliações</Link>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{location || 'Brasil'}</span>
              <Popover>
                <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {location || 'Brasil'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Unidade Principal / Sede
                        </div>
                      </div>
                    </div>

                    {/* Google Map Iframe */}
                    <div className="relative h-28 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200/60 shadow-inner">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(location || 'Brasil')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 leading-normal">
                      <span className="font-bold text-slate-700 block mb-1">
                        Endereço de Homologação:
                      </span>
                      {company.city
                        ? `Área Comercial Solar, Centro, ${company.city} - ${company.state || 'BR'}`
                        : 'Abrangência nacional, sede sob consulta comercial.'}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column 1: Description & Quick Features */}
      <div className="flex flex-1 flex-col justify-center p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Todo o Brasil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Resp: {slaLabel}</span>
          </div>
        </div>
      </div>

      {/* Middle Column 2: Stats (Respostas / Cobertura) */}
      <div className="hidden lg:flex w-[120px] flex-col justify-center items-center gap-4 p-5 border-r border-slate-100 text-center bg-slate-50/30">
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Respostas
          </span>
          <span className="font-bold text-slate-900 text-sm">{slaLabel}</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Cobertura
          </span>
          <span className="font-bold text-slate-900 text-sm">{coverageLabel}</span>
        </div>
      </div>

      {/* Middle Column 3: Secondary Actions */}
      <div className="hidden lg:flex flex-col justify-center gap-2 p-4 border-r border-slate-100 w-[140px]">
        <ComparisonToggleButton
          company={company as any}
          variant="default"
          className="w-full h-8 text-[11px] rounded-lg"
        />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full h-8 rounded-lg text-[11px] font-bold border-slate-200 text-blue-600 hover:bg-slate-50 shadow-none gap-1.5"
        >
          <Link href={reviewsHref}>
            <Star className="w-3.5 h-3.5 fill-blue-600" />
            Avaliar
          </Link>
        </Button>
      </div>

      {/* Right Column: Primary CTA — desktop only (lg+) */}
      <div className="hidden min-w-0 shrink-0 lg:flex lg:w-[196px] flex-col justify-center gap-2 p-5 bg-slate-50/50">
        {canRequestQuote && (
          <QuoteCTA
            context="card"
            source="search-list-card"
            onRequest={() =>
              openLeadModal({
                preferredCompanyId: company.id,
                source: 'search-list-card',
                type: 'quick',
              })
            }
          />
        )}

        <Button
          asChild
          variant={canRequestQuote ? 'outline' : 'default'}
          className={cn(
            'w-full h-10 rounded-xl font-bold text-xs shadow-none gap-1.5 transition-all',
            canRequestQuote
              ? 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white hover:text-blue-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <Link href={reviewsHref}>
            Ver avaliações {reviewCount} <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Mobile footer: todas as ações numa barra inferior separada */}
      <div className="flex lg:hidden w-full border-t border-slate-100 bg-slate-50/50">
        {canRequestQuote ? (
          // Com orçamento: [Comparar] [Avaliar] | [Solicitar orçamento (destaque)]
          <>
            <div className="flex flex-1 divide-x divide-slate-100">
              <ComparisonToggleButton
                company={company as any}
                variant="default"
                className="flex-1 h-11 text-xs rounded-none border-0 shadow-none"
              />
              <Button
                asChild
                variant="ghost"
                className="flex-1 h-11 rounded-none text-xs font-bold text-blue-600 hover:bg-blue-50 shadow-none gap-1.5"
              >
                <Link href={reviewsHref}>
                  <Star className="w-3.5 h-3.5 fill-blue-600" />
                  Avaliar
                </Link>
              </Button>
            </div>
            <Button
              onClick={() =>
                openLeadModal({
                  preferredCompanyId: company.id,
                  source: 'search-list-card-mobile',
                  type: 'quick',
                })
              }
              className="h-11 px-4 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-none gap-1.5 border-l border-blue-500 shrink-0"
            >
              Orçamento
            </Button>
          </>
        ) : (
          // Sem orçamento: [Comparar] [Avaliar] [Ver avaliações]
          <div className="flex w-full divide-x divide-slate-100">
            <ComparisonToggleButton
              company={company as any}
              variant="default"
              className="flex-1 h-11 text-xs rounded-none border-0 shadow-none"
            />
            <Button
              asChild
              variant="ghost"
              className="flex-1 h-11 rounded-none text-xs font-bold text-blue-600 hover:bg-blue-50 shadow-none gap-1.5"
            >
              <Link href={reviewsHref}>
                <Star className="w-3.5 h-3.5 fill-blue-600" />
                Avaliar
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="flex-1 h-11 rounded-none font-bold text-xs text-blue-600 hover:bg-blue-50 shadow-none gap-1"
            >
              <Link href={reviewsHref}>
                Ver {reviewCount} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
