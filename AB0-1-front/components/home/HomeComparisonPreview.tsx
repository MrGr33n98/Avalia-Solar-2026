'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Star,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Company } from '@/lib/api';

type HomeComparisonPreviewProps = {
  companies: Company[];
};

const getCoverageCount = (company: Company) => {
  const cities = Array.isArray(company.coverage_cities)
    ? company.coverage_cities
    : String(company.coverage_cities || '').split(',').filter(Boolean);
  const states = Array.isArray(company.coverage_states)
    ? company.coverage_states
    : String(company.coverage_states || '').split(',').filter(Boolean);
  return cities.length || states.length * 10 || 0;
};

const getSpeedBadge = (time?: string) => {
  if (!time || time === 'Consultar') return null;
  const lower = time.toLowerCase();
  if (lower.includes('h')) {
    const hours = parseInt(lower) || 0;
    if (hours <= 2) {
      return { label: 'Rápido', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  }
  return { label: 'Médio', color: 'bg-amber-50 text-amber-700 border-amber-200' };
};

export default function HomeComparisonPreview({ companies }: HomeComparisonPreviewProps) {
  const selected = companies.slice(0, 3);
  if (selected.length < 2) return null;

  // Encontra a empresa com maior nota para destacar
  const highestRatedCompanyId = selected.reduce((prev, current) => {
    const prevRating = Number(prev.average_rating ?? prev.rating_avg ?? 0);
    const currRating = Number(current.average_rating ?? current.rating_avg ?? 0);
    return currRating > prevRating ? current : prev;
  }, selected[0])?.id;

  const gridColsClass = selected.length === 2
    ? 'grid-cols-[58px_repeat(2,minmax(0,1fr))] sm:grid-cols-[88px_repeat(2,168px)] md:grid-cols-[200px_repeat(2,minmax(0,1fr))]'
    : 'grid-cols-[58px_repeat(3,minmax(0,1fr))] sm:grid-cols-[88px_repeat(3,168px)] md:grid-cols-[200px_repeat(3,minmax(0,1fr))]';

  return (
    <section className="bg-white pb-16 sm:pb-20" aria-labelledby="comparison-preview-title">
      <div className="mx-auto max-w-7xl px-[1cm] sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-none">
          {/* Header do Box */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-blue-700">
                <span className="text-xs font-extrabold uppercase tracking-[0.14em]">Comparação transparente</span>
              </div>
              <h2 id="comparison-preview-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Compare empresas lado a lado
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Reputação, resposta e cobertura usando os mesmos critérios para todas.
              </p>
            </div>

          </div>

          {/* Grid de Comparação */}
          <div className="relative">
            <div
              className="w-full touch-auto overflow-visible scroll-smooth md:overflow-x-auto md:overscroll-x-contain"
              aria-label="Comparação de empresas com rolagem horizontal no celular"
            >
          <div className={`grid w-full min-w-0 ${gridColsClass} divide-x divide-slate-200 md:min-w-full`}>
            {/* Coluna 1: critérios sticky em todas as larguras. */}
            <div className="sticky left-0 z-20 flex flex-col bg-slate-50">
              {/* Espaço do Header da Empresa */}
              <div className="flex h-[112px] flex-col justify-end border-b border-slate-200 p-1 md:h-[174px] md:p-5">
                <span className="text-[7px] font-semibold uppercase tracking-[0.04em] text-slate-500 sm:text-[8px] md:text-xs">
                  <span>Critério</span>
                </span>
              </div>
              
              {/* Linhas de Critérios */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex h-[78px] items-center border-b border-slate-200 p-1 md:h-[96px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">
                      <span>Reputação</span>
                    </h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Média de avaliações de clientes</p>
                  </div>
                </div>

                <div className="flex h-[64px] items-center border-b border-slate-200 p-1 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">
                      <span>Verificação</span>
                    </h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Documentos e dados conferidos</p>
                  </div>
                </div>

                <div className="flex h-[64px] items-center border-b border-slate-200 p-1 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">
                      <span className="md:hidden">Resposta</span>
                      <span className="hidden md:inline">Tempo de resposta</span>
                    </h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Média para primeiro contato</p>
                  </div>
                </div>

                <div className="flex h-[66px] items-center border-b border-slate-200 p-1 md:h-[88px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">
                      <span>Cobertura</span>
                    </h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Onde a empresa atua</p>
                  </div>
                </div>

                <div className="flex h-[64px] items-center border-b border-slate-200 p-1 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">Projetos</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Projetos concluídos</p>
                  </div>
                </div>

                <div className="flex h-[64px] items-center p-1 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="break-normal text-[7px] font-semibold leading-tight text-slate-900 sm:text-[8px] md:text-sm">Garantia</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Tempo de garantia médio</p>
                  </div>
                </div>

                {/* Espaço para o botão inferior */}
                <div className="h-10 md:h-16" />
              </div>
            </div>

            {/* Colunas das Empresas */}
            {selected.map((company) => {
              const isHighlighted = company.id === highestRatedCompanyId;
              const rating = Number(company.average_rating ?? company.rating_avg ?? company.rating ?? 0);
              const reviews = Number(company.rating_count ?? company.reviews_count ?? company.total_reviews ?? 0);
              const speed = getSpeedBadge(company.response_time_sla);
              const coverageCount = getCoverageCount(company);
              const projects = company.delivered_projects_score || 0;
              const warranty = company.warranty_years || 0;

              return (
                <div 
                  key={company.id} 
                  className={`relative flex min-w-0 flex-col transition-colors ${
                    isHighlighted 
                      ? 'bg-blue-50/20'
                      : 'bg-white'
                  }`}
                >
                  {/* Ribbon Destaque */}
                  {isHighlighted && (
                    <div className="absolute left-1/2 top-1 z-10 flex max-w-[62px] -translate-x-1/2 items-center justify-center gap-0.5 rounded-full bg-blue-600 px-1 py-0.5 text-center text-[6px] font-black uppercase leading-[0.85] tracking-[0.02em] text-white shadow-sm sm:max-w-none sm:px-3 sm:py-1 sm:text-[9px] md:top-3.5">
                      <Sparkles className="h-1.5 w-1.5 shrink-0 fill-amber-300 text-amber-300 sm:h-2.5 sm:w-2.5" /> Melhor avaliada
                    </div>
                  )}

                  {/* Header do Card (Identificação) */}
                  <div className="flex h-[112px] flex-col justify-start border-b border-slate-200 p-1.5 pt-4 md:h-[174px] md:justify-between md:p-5 md:pt-11">
                    <div className="flex items-start justify-between gap-1 md:gap-4">
                      {/* Logo Container */}
                      <CompanyLogo
                        logoUrl={company.logo_url}
                        name={company.name}
                        size="custom"
                        badges={company.badges}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        verifiedBadgeUrl={(company as any).verified_badge_image_url || (company as any).verified_badge_url}
                        className="h-9 w-9 rounded-lg shadow-sm sm:h-12 sm:w-12"
                        badgeClassName="-right-1 -top-1 h-4 w-4 sm:-right-1.5 sm:-top-1.5 sm:h-5 sm:w-5"
                      />

                      {/* Status Badges */}
                      {company.verified ? (
                        <span className="hidden items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 sm:inline-flex">
                          Verificada
                        </span>
                      ) : (
                        <span className="hidden items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 sm:inline-flex">
                          Em análise
                        </span>
                      )}
                    </div>

                    <div className="mt-1 md:mt-2">
                      <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-700 block">
                        <h3 className="line-clamp-3 break-normal text-[7px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-xs md:text-base">{company.name}</h3>
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                        <div className="hidden text-amber-400 sm:flex">
                          {[1, 2, 3, 4, 5].map((i) => {
                            const filled = i <= Math.round(rating);
                            return (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                              />
                            );
                          })}
                        </div>
                        <span className="text-[8px] font-bold text-slate-700 sm:text-[11px]">{rating > 0 ? rating.toFixed(1) : 'Sem nota'}</span>
                        {reviews > 0 && (
                          <span className="hidden text-[10px] text-slate-500 sm:inline">({reviews} avaliações)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linhas de Dados */}
                  <div className="flex-grow flex flex-col justify-between text-slate-800">
                    
                    {/* 1. Reputação */}
                    <div className="flex h-[78px] flex-col justify-center gap-1 border-b border-slate-100 p-1.5 md:h-[96px] md:p-5">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-black text-slate-900 md:text-base">{rating.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-500 md:text-xs">/5</span>
                          </div>
                          {/* Barra de Progresso */}
                          <div className="w-full bg-slate-150 rounded-full h-1 mt-0.5 overflow-hidden md:h-1.5 md:mt-1">
                            <div 
                              className={`h-1 rounded-full md:h-1.5 ${isHighlighted ? 'bg-blue-600' : 'bg-slate-700'}`} 
                              style={{ width: `${(rating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="mt-1 hidden text-[10px] text-slate-500 sm:inline">Baseada em {reviews} avaliações</span>
                        </>
                      ) : (
                        <span className="break-normal text-[9px] font-semibold leading-tight text-slate-500 md:text-xs">Ainda sem avaliações</span>
                      )}
                    </div>

                    {/* 2. Verificação */}
                    <div className="flex h-[64px] flex-col justify-center border-b border-slate-100 p-1.5 md:h-[80px] md:p-5">
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-slate-900 md:gap-1 md:text-sm">
                        {company.verified ? (
                          <>
                            <span className="text-emerald-600">
                              <span className="md:hidden">OK</span>
                              <span className="hidden md:inline">Verificada</span>
                            </span>
                            <BadgeCheck className="h-3 w-3 text-emerald-600 md:h-4 md:w-4" />
                          </>
                        ) : (
                          <>
                            <span className="text-amber-600">
                              <span className="md:hidden">Análise</span>
                              <span className="hidden md:inline">Em análise</span>
                            </span>
                          </>
                        )}
                      </div>
                      <span className="mt-1 hidden text-[10px] text-slate-500 sm:inline">
                        {company.verified ? 'Documentos verificados' : 'Documentos em verificação'}
                      </span>
                    </div>

                    {/* 3. Tempo de Resposta */}
                    <div className="flex h-[64px] flex-col justify-center border-b border-slate-100 p-1.5 md:h-[80px] md:p-5">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="text-[9px] font-bold text-slate-900 md:text-sm">{company.response_time_sla || 'Consultar'}</span>
                        {speed && (
                          <span className={`hidden px-1.5 py-0.5 rounded text-[9px] font-extrabold border sm:inline-flex ${speed.color}`}>
                            {speed.label}
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 hidden text-[10px] text-slate-500 sm:inline">Média para 1º contato</span>
                    </div>

                    {/* 4. Cobertura */}
                    <div className="flex h-[66px] items-center justify-between gap-1 border-b border-slate-100 p-1.5 md:h-[88px] md:gap-4 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="line-clamp-1 text-[9px] font-bold text-slate-900 md:text-sm">
                          {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-[8px] text-slate-500 md:text-[10px]">
                          {coverageCount > 0 ? `+${coverageCount} cidades atendidas` : 'Sob consulta'}
                        </span>
                      </div>
                    </div>

                    {/* 5. Projetos Realizados */}
                    <div className="flex h-[64px] items-center justify-between gap-1 border-b border-slate-100 p-1.5 md:h-[80px] md:gap-4 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-slate-900 md:text-sm">{projects > 0 ? `+${projects}` : 'Consultar'}</span>
                        <span className="mt-0.5 hidden text-[10px] text-slate-500 sm:inline">Projetos concluídos</span>
                      </div>
                    </div>

                    {/* 6. Garantia */}
                    <div className="flex h-[64px] items-center justify-between gap-1 border-b border-slate-100 p-1.5 md:h-[80px] md:gap-4 md:border-b-0 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-slate-900 md:text-sm">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                        <span className="mt-0.5 hidden text-[10px] text-slate-500 sm:inline">Garantia média</span>
                      </div>
                    </div>

                    {/* Botão de Perfil */}
                    <div className="flex items-center justify-center p-1.5 md:p-4">
                      <Button 
                        asChild 
                        className={`h-7 w-full rounded-lg px-1 text-[8px] font-bold sm:text-xs md:h-10 md:rounded-xl ${
                          isHighlighted 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                            : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50 border'
                        }`}
                      >
                        <Link href={`/companies/${company.slug || company.id}`}>
                          <span className="sm:hidden">Ver</span>
                          <span className="hidden sm:inline">Ver perfil da empresa</span>
                        </Link>
                      </Button>
                    </div>

                  </div>
                </div>
              );
            })}
            </div>
          </div>
          </div>

          {/* Dica da plataforma e rodapé */}
          <div className="border-t border-slate-200 bg-slate-50 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="rounded-full bg-blue-100 p-1 text-blue-700 shrink-0">
                <Sparkles className="h-3 w-3 fill-blue-700" />
              </div>
              <p>
                <strong>Dica Avalia Solar:</strong> Compare todos os critérios e escolha a empresa que melhor atende às suas necessidades.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <span className="text-slate-500 hidden lg:inline">Não encontrou o que procura?</span>
              <QuoteCTA context="hero" source="home_comparison" shortLabel="Orçamento" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
