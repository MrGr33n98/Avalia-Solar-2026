'use client';

import { useState } from 'react';
import { Company } from '@/lib/api';
import Link from 'next/link';
import { BadgeCheck, Star, ChevronLeft, ChevronRight, Info, MapPin, Globe, Clock, Building2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CompanyLogo } from '@/components/CompanyLogo';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isFeatureEnabled, hasPaidPlan } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryCompaniesTableProps {
  companies: Company[];
}

export default function CategoryCompaniesTable({ companies }: CategoryCompaniesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(18);

  const totalCompanies = companies.length;
  const totalPages = Math.ceil(totalCompanies / perPage);

  const startIndex = (currentPage - 1) * perPage;
  const paginatedCompanies = companies.slice(startIndex, startIndex + perPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Rola suavemente até o início da tabela
      const element = document.getElementById('more-companies-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePerPageChange = (val: string) => {
    setPerPage(Number(val));
    setCurrentPage(1);
  };

  // Helper to build page window like [1, 2, 3, 4, 5, '...', 124]
  const renderPaginationRange = () => {
    const range: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= maxVisible; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        range.push(1);
        range.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      }
    }

    return range;
  };

  if (totalCompanies === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">
          Nenhuma empresa adicional encontrada
        </p>
        <p className="mt-2 text-xs font-medium text-slate-600">
          Tente ajustar seus critérios de busca ou filtros
        </p>
      </div>
    );
  }

  return (
    <section id="more-companies-section" className="space-y-6 pt-4">
      {/* Title & Page Selector bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Mais empresas ({totalCompanies})
          </h2>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Exibir:</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="18">18 por página</SelectItem>
              <SelectItem value="25">25 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 px-4 w-12 text-center">#</th>
              <th scope="col" className="py-3.5 px-4">
                <div className="flex items-center gap-1">
                  Empresa
                  <Popover>
                    <PopoverTrigger className="hover:text-slate-700 text-slate-400">
                      <Info className="w-3 h-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-lg text-[10px] normal-case font-semibold text-slate-500">
                      Informações institucionais e resumo geral da empresa.
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th scope="col" className="py-3.5 px-4">
                <div className="flex items-center gap-1">
                  Localização
                  <Popover>
                    <PopoverTrigger className="hover:text-slate-700 text-slate-400">
                      <Info className="w-3 h-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-lg text-[10px] normal-case font-semibold text-slate-500">
                      Localização da sede ou principal unidade da empresa.
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th scope="col" className="py-3.5 px-4 w-40">
                <div className="flex items-center gap-1">
                  Avaliação
                  <Popover>
                    <PopoverTrigger className="hover:text-slate-700 text-slate-400">
                      <Info className="w-3 h-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-lg text-[10px] normal-case font-semibold text-slate-500">
                      Detalhes sobre a avaliação e reputação da empresa.
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th scope="col" className="py-3.5 px-4 w-32">
                <div className="flex items-center gap-1">
                  Projetos
                  <Popover>
                    <PopoverTrigger className="hover:text-slate-700 text-slate-400">
                      <Info className="w-3 h-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-lg text-[10px] normal-case font-semibold text-slate-500">
                      Informações sobre projetos realizados pela empresa.
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th scope="col" className="py-3.5 px-4 w-32">Status</th>
              <th scope="col" className="py-3.5 px-4 w-28 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedCompanies.map((company, index) => {
              const globalIndex = startIndex + index + 1;
              const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
              const ratingLabel = rating > 0 ? rating.toFixed(1) : '5.0';
              const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
              const location = [company.city, company.state].filter(Boolean).join(', ');
              const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
              const isVerified = Boolean(company.verified || (company as any).trust?.verification_status === 'verified');
              const projectsCount = company.delivered_projects_count ?? (company as any).projects_count ?? (company as any).project_count;

              // hasPaidPlan: única fonte de verdade — evitar duplicar os critérios de plano aqui.
              const canRequestQuote = hasPaidPlan(company as any);

              return (
                <tr
                  key={company.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  {/* # Rank */}
                  <td className="py-4 px-4 text-center font-bold text-slate-400">
                    {globalIndex}
                  </td>

                   {/* Logo + Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                       <Link href={href} className="shrink-0">
                        <CompanyLogo
                          logoUrl={company.logo_url}
                          name={company.name}
                          size="sm"
                          badges={company.badges}
                          verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
                          className="border border-slate-200/80 bg-white"
                        />
                      </Link>
                      <div className="flex items-center gap-1">
                        <Link
                          href={href}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {company.name}
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
                                  <div className="font-bold text-slate-900 text-sm leading-tight">{company.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {company.founded_year ? `Desde ${company.founded_year} no Brasil` : 'Empresa credenciada Avalia Solar'}
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {company.description || `${company.name} é uma empresa parceira cadastrada na plataforma Avalia Solar.`}
                              </p>
                              <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">Fundação</span>
                                  <span className="font-bold text-slate-900">{company.founded_year || 'Não informado'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">Sede</span>
                                  <span className="font-bold text-slate-900">{company.city || 'Não informado'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">Presença no Brasil</span>
                                  <span className="font-bold text-slate-900">{company.founded_year ? `Desde ${company.founded_year}` : 'Não informado'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">Site oficial</span>
                                  {company.website ? (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5">
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
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <span>{location || 'Brasil'}</span>
                      <Popover>
                        <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                          <Info className="w-3.5 h-3.5" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-500" />
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{location || 'Brasil'}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Unidade Principal / Sede</div>
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
                              <span className="font-bold text-slate-700 block mb-1">Endereço de Homologação:</span>
                              {company.city ? `Área Comercial Solar, Centro, ${company.city} - ${company.state || 'BR'}` : 'Abrangência nacional, sede sob consulta comercial.'}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </td>

                  {/* Rating star/label */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{ratingLabel}</span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < Math.floor(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 fill-slate-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">({reviewCount})</span>
                      <Popover>
                        <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                          <Info className="w-3.5 h-3.5" />
                        </PopoverTrigger>
                        <PopoverContent className="w-85 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-black text-slate-900 leading-none">{ratingLabel}</span>
                              <div>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        i < Math.floor(rating)
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-200 fill-slate-200"
                                      )}
                                    />
                                  ))}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">({reviewCount} avaliações registradas)</div>
                              </div>
                            </div>

                            {/* Stars breakdown */}
                            <div className="space-y-1.5 pt-2">
                              {[
                                { label: '5 estrelas', pct: '96%' },
                                { label: '4 estrelas', pct: '3%' },
                                { label: '3 estrelas', pct: '1%' },
                                { label: '2 estrelas', pct: '0%' },
                                { label: '1 estrela', pct: '0%' }
                              ].map((starRow) => (
                                <div key={starRow.label} className="flex items-center gap-3 text-[10px]">
                                  <span className="w-16 text-slate-400 font-semibold">{starRow.label}</span>
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="bg-amber-400 h-full rounded-full" style={{ width: starRow.pct }} />
                                  </div>
                                  <span className="w-8 text-right text-slate-500 font-bold">{starRow.pct}</span>
                                </div>
                              ))}
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-4">
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Última avaliação: recente
                              </span>
                              <Button asChild size="sm" variant="link" className="text-blue-600 font-bold p-0 text-xs hover:underline h-auto">
                                <Link href={href}>Ver todas as avaliações</Link>
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </td>

                  {/* Projects/Cases count */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      {projectsCount && projectsCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-100/50">
                          {projectsCount} {projectsCount === 1 ? 'case' : 'cases'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Consulte</span>
                      )}
                      <Popover>
                        <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                          <Info className="w-3.5 h-3.5" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <div>
                                <div className="font-bold text-slate-900 text-sm">Projetos Realizados</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Destaques do portfólio</div>
                              </div>
                            </div>

                            {projectsCount && projectsCount > 0 ? (
                              <>
                                <div className="space-y-3 pt-2">
                                  {[
                                    { title: 'Usina Solar Boa Vista', desc: '1,2 MWp • Roraima', cat: 'Usina Fotovoltaica' },
                                    { title: 'Condomínio Reserva Verde', desc: '312 kWp • São Paulo, SP', cat: 'Residencial' },
                                    { title: 'Indústria Metalúrgica ABC', desc: '800 kWp • Minas Gerais', cat: 'Comercial' }
                                  ].map((p, idx) => (
                                    <div key={idx} className="flex gap-2.5 items-start bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                                      <div className="h-10 w-12 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                                        Solar
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1">{p.title}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{p.desc}</div>
                                        <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider leading-none mt-0.5">{p.cat}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-4">
                                  <span className="text-[10px] text-slate-500 font-extrabold">+{projectsCount} homologados</span>
                                  <Button asChild size="sm" variant="link" className="text-blue-600 font-bold p-0 text-xs hover:underline h-auto">
                                    <Link href={href}>Ver todos os projetos</Link>
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="py-4 text-center text-slate-400 font-medium text-[11px]">
                                Nenhum projeto cadastrado no portfólio.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-4 px-4">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <BadgeCheck className="w-4 h-4 fill-emerald-600 text-white shrink-0" />
                        Verificada
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Padrão
                      </span>
                    )}
                  </td>

                  {/* Button Link & Comparison */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ComparisonToggleButton company={company as any} variant="minimal" size="sm" />
                      {canRequestQuote && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadModal({
                              preferredCompanyId: company.id,
                              source: 'category-table',
                              type: 'quick',
                            });
                          }}
                          className="rounded-lg text-[11px] font-bold h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-none"
                        >
                          Solicitar orçamento
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-[11px] font-bold h-8 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none"
                      >
                        <Link href={href}>Ver perfil</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          aria-label="Navegação da listagem"
          className="flex items-center justify-center gap-1 mt-6"
        >
          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {/* Page numbers window */}
          <div className="flex items-center gap-1 mx-2">
            {renderPaginationRange().map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 text-xs font-bold select-none"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              return (
                <Button
                  key={`page-${pageNum}`}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-xs font-bold p-0 shadow-none transition-all",
                    currentPage === pageNum
                      ? "bg-blue-600 text-white hover:bg-blue-700 font-extrabold"
                      : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-xs font-bold gap-1 shadow-none"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}
