import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Star,
  Check,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';

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
    ? 'grid-cols-[76px_repeat(2,118px)] sm:grid-cols-[96px_repeat(2,168px)] md:grid-cols-[200px_repeat(2,minmax(0,1fr))]'
    : 'grid-cols-[76px_repeat(3,118px)] sm:grid-cols-[96px_repeat(3,168px)] md:grid-cols-[200px_repeat(3,minmax(0,1fr))]';

  return (
    <section className="bg-white pb-16 sm:pb-20" aria-labelledby="comparison-preview-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">
                <Check className="h-3 w-3" /> Dados verificados
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                <Check className="h-3 w-3" /> Sem viés
              </span>
              <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800 text-xs h-9">
                <Link href="/compare">
                  Exportar comparação
                </Link>
              </Button>
            </div>
          </div>

          {/* Grid de Comparação */}
          <div className="relative">
            <div className="pointer-events-none absolute right-0 top-0 z-30 flex h-full w-10 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent md:hidden">
              <div className="mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-600 text-white shadow-sm">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 z-40 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-700 shadow-sm md:hidden">
              Arraste <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" />
            </div>
            <div
              className="w-full touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth"
              aria-label="Comparação de empresas com rolagem horizontal no celular"
            >
          <div className={`grid min-w-max ${gridColsClass} divide-x divide-slate-200 md:min-w-full`}>
            {/* Coluna 1: critérios sticky em todas as larguras. */}
            <div className="sticky left-0 z-20 flex flex-col bg-slate-50">
              {/* Espaço do Header da Empresa */}
              <div className="flex h-[158px] flex-col justify-end border-b border-slate-200 p-2 md:h-[174px] md:p-5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:text-xs">Critério</span>
              </div>
              
              {/* Linhas de Critérios */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex h-[92px] items-center border-b border-slate-200 p-2 md:h-[96px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Reputação</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Média de avaliações de clientes</p>
                  </div>
                </div>

                <div className="flex h-[76px] items-center border-b border-slate-200 p-2 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Verificação</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Documentos e dados conferidos</p>
                  </div>
                </div>

                <div className="flex h-[76px] items-center border-b border-slate-200 p-2 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Tempo de resposta</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Média para primeiro contato</p>
                  </div>
                </div>

                <div className="flex h-[80px] items-center border-b border-slate-200 p-2 md:h-[88px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Cobertura</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Onde a empresa atua</p>
                  </div>
                </div>

                <div className="flex h-[76px] items-center border-b border-slate-200 p-2 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Projetos</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Projetos concluídos</p>
                  </div>
                </div>

                <div className="flex h-[76px] items-center p-2 md:h-[80px] md:p-5">
                  <div>
                    <h4 className="text-[10px] font-semibold leading-tight text-slate-900 md:text-sm">Garantia</h4>
                    <p className="mt-1 hidden text-[10px] text-slate-500 md:block">Tempo de garantia médio</p>
                  </div>
                </div>

                {/* Espaço para o botão inferior */}
                <div className="h-16" />
              </div>
            </div>

            {/* Colunas das Empresas */}
            {selected.map((company) => {
              const isHighlighted = company.id === highestRatedCompanyId;
              const logoUrl = company.logo_url ? getFullImageUrl(company.logo_url) : null;
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
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1 z-10 md:top-3.5">
                      <Sparkles className="h-2.5 w-2.5 fill-amber-300 text-amber-300" /> Melhor avaliada
                    </div>
                  )}

                  {/* Header do Card (Identificação) */}
                  <div className="flex h-[158px] flex-col justify-between border-b border-slate-200 p-2 pt-9 md:h-[174px] md:p-5 md:pt-11">
                    <div className="flex items-start justify-between gap-1.5 md:gap-4">
                      {/* Logo Container */}
                      <div className="relative flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:h-12 sm:w-20">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={`Logo da ${company.name}`}
                            fill
                          sizes="(max-width: 640px) 56px, 80px"
                            className="object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-slate-300" aria-hidden="true" />
                        )}
                      </div>

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

                    <div className="mt-2">
                      <Link href={`/companies/${company.slug || company.id}`} className="hover:text-blue-700 block">
                        <h3 className="line-clamp-2 text-[10px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-xs md:text-base">{company.name}</h3>
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
                        <span className="text-[10px] font-bold text-slate-700 sm:text-[11px]">{rating > 0 ? rating.toFixed(1) : 'Sem nota'}</span>
                        {reviews > 0 && (
                          <span className="hidden text-[10px] text-slate-500 sm:inline">({reviews} avaliações)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linhas de Dados */}
                  <div className="flex-grow flex flex-col justify-between text-slate-800">
                    
                    {/* 1. Reputação */}
                    <div className="flex h-[92px] flex-col justify-center gap-1.5 border-b border-slate-100 p-2 md:h-[96px] md:p-5">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-slate-900">{rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-500">de 5</span>
                          </div>
                          {/* Barra de Progresso */}
                          <div className="w-full bg-slate-150 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${isHighlighted ? 'bg-blue-600' : 'bg-slate-700'}`} 
                              style={{ width: `${(rating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="mt-1 hidden text-[10px] text-slate-500 sm:inline">Baseada em {reviews} avaliações</span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">Ainda sem avaliações</span>
                      )}
                    </div>

                    {/* 2. Verificação */}
                    <div className="flex h-[76px] flex-col justify-center border-b border-slate-100 p-2 md:h-[80px] md:p-5">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 md:text-sm">
                        {company.verified ? (
                          <>
                            <span className="text-emerald-600">Verificada</span>
                            <BadgeCheck className="h-4 w-4 text-emerald-600" />
                          </>
                        ) : (
                          <>
                            <span className="text-amber-600">Em análise</span>
                          </>
                        )}
                      </div>
                      <span className="mt-1 hidden text-[10px] text-slate-500 sm:inline">
                        {company.verified ? 'Documentos verificados' : 'Documentos em verificação'}
                      </span>
                    </div>

                    {/* 3. Tempo de Resposta */}
                    <div className="flex h-[76px] flex-col justify-center border-b border-slate-100 p-2 md:h-[80px] md:p-5">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="text-xs font-bold text-slate-900 md:text-sm">{company.response_time_sla || 'Consultar'}</span>
                        {speed && (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${speed.color}`}>
                            {speed.label}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Média para 1º contato</span>
                    </div>

                    {/* 4. Cobertura */}
                    <div className="flex h-[80px] items-center justify-between gap-2 border-b border-slate-100 p-2 md:h-[88px] md:gap-4 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="line-clamp-1 text-xs font-bold text-slate-900 md:text-sm">
                          {[company.city, company.state].filter(Boolean).join(', ') || 'Consultar'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">
                          {coverageCount > 0 ? `+${coverageCount} cidades atendidas` : 'Sob consulta'}
                        </span>
                      </div>
                    </div>

                    {/* 5. Projetos Realizados */}
                    <div className="flex h-[76px] items-center justify-between gap-2 border-b border-slate-100 p-2 md:h-[80px] md:gap-4 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-900 md:text-sm">{projects > 0 ? `+${projects}` : 'Consultar'}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Projetos concluídos</span>
                      </div>
                    </div>

                    {/* 6. Garantia */}
                    <div className="flex h-[76px] items-center justify-between gap-2 border-b border-slate-100 p-2 md:h-[80px] md:gap-4 md:border-b-0 md:p-5">
                      <div className="flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-900 md:text-sm">{warranty > 0 ? `${warranty} anos` : 'Consultar'}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Garantia média</span>
                      </div>
                    </div>

                    {/* Botão de Perfil */}
                    <div className="flex items-center justify-center p-2 md:p-4">
                      <Button 
                        asChild 
                        className={`h-9 w-full rounded-xl text-[10px] font-bold sm:text-xs md:h-10 ${
                          isHighlighted 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                            : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50 border'
                        }`}
                      >
                        <Link href={`/companies/${company.slug || company.id}`}>
                          <span className="sm:hidden">Ver perfil</span>
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
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 h-10 w-full md:w-auto rounded-xl">
                <Link href="/quote-wizard">
                  Pedir orçamentos gratuitos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
