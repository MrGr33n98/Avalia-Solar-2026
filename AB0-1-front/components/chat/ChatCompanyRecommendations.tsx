'use client';

import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

const MOBIVOLT_SPONSORED_CARDS_ENABLED = true;
const MOBIVOLT_CARD_WHATSAPP_ENABLED = false;
const MOBIVOLT_COMPARE_BUTTON_ENABLED = true;

const normalizeCompanyRecommendation = (company: any) => ({
  id: typeof company?.id === 'number' ? company.id : null,
  name: company?.name || company?.nome || 'Empresa recomendada',
  city: company?.city || company?.cidade || '',
  state: company?.state || company?.estado || '',
  logo_url: company?.logo_url || null,
  sponsored: company?.sponsored ?? company?.patrocinada ?? false,
  verified: company?.verified ?? company?.verificada ?? false,
  rating_avg: company?.rating_avg ?? company?.nota_media,
  rating_count: company?.rating_count ?? company?.total_avaliacoes ?? 0,
  services: Array.isArray(company?.services) ? company.services : (Array.isArray(company?.servicos) ? company.servicos : []),
  review_snippet: company?.review_snippet,
  profile_url: company?.profile_url || company?.link_perfil,
  slug: company?.slug,
  whatsapp: company?.whatsapp
});

export interface ChatCompanyRecommendationsProps {
  metadata: any;
  comparedCompanyIds: number[];
  onCompanyClick: (companyId: number, type: 'profile' | 'whatsapp') => void;
  onRequestQuote: (companyId: number) => void;
  onCompare: (companyId: number) => void;
  onRequestPersonalizedSearch: () => void;
}

const RecommendationsContent: React.FC<ChatCompanyRecommendationsProps> = ({
  metadata,
  comparedCompanyIds,
  onCompanyClick,
  onRequestQuote,
  onCompare,
  onRequestPersonalizedSearch
}) => {
  // Defensive guard against malformed metadata
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Metadata inválida ou indefinida');
  }

  const rawCompanies = metadata.companies;
  const hasCompanies = Array.isArray(rawCompanies) && rawCompanies.length > 0;

  if (!hasCompanies) {
    return (
      <div className="mt-3.5 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-center space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Não encontramos instaladores solares ativos na sua região no momento. Quer que façamos uma busca personalizada grátis?
        </p>
        <button
          type="button"
          onClick={onRequestPersonalizedSearch}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-bold py-2 rounded-lg shadow-sm transition-colors active:scale-95 duration-150"
        >
          Solicitar Busca Personalizada
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 space-y-3.5 w-full">
      {rawCompanies.map((rawCompany: any, companyIndex: number) => {
        const company = normalizeCompanyRecommendation(rawCompany);
        const trackableCompanyId = company.id;

        return (
          <div
            key={company.id ?? `${company.name}-${companyIndex}`}
            className={`p-3.5 rounded-xl border transition-all duration-200 bg-white dark:bg-zinc-900 ${
              company.sponsored && MOBIVOLT_SPONSORED_CARDS_ENABLED
                ? 'border-amber-400 dark:border-amber-500 shadow-md relative overflow-hidden bg-gradient-to-br from-amber-50/10 to-transparent dark:from-amber-950/10'
                : 'border-zinc-200/80 dark:border-zinc-800 shadow-sm'
            }`}
          >
            {/* Badge de Destaque Patrocinado */}
            {company.sponsored && MOBIVOLT_SPONSORED_CARDS_ENABLED && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg tracking-wider uppercase">
                Destaque
              </div>
            )}

            <div className="flex items-start space-x-3">
              {/* Logo da Empresa */}
              <div className="w-12 h-12 rounded-lg bg-zinc-50 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-150 dark:border-zinc-700">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm font-bold uppercase">
                    {company.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Dados Principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate pr-6">
                    {company.name}
                  </h4>
                  {company.verified && (
                    <span className="inline-flex items-center text-emerald-500" title="Empresa Verificada">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {company.city}, {company.state}
                </p>

                {/* Nota / Avaliações */}
                {company.rating_avg !== undefined && company.rating_avg !== null && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < Math.floor(company.rating_avg || 0)
                              ? 'fill-current'
                              : 'text-zinc-200 dark:text-zinc-700'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                      {Number(company.rating_avg || 0).toFixed(1)}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                      ({company.rating_count || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags de Serviços */}
            {company.services && company.services.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {company.services.slice(0, 3).map((service: string, index: number) => (
                  <span
                    key={index}
                    className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}

            {/* Snippet de Review */}
            {company.review_snippet && (
              <div className="mt-2 text-[10px] italic text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border-l-2 border-brand-cyan/60 leading-normal">
                "{company.review_snippet}"
              </div>
            )}

            {/* Ações Comerciais do Card */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <a
                href={company.profile_url || (company.slug ? `/companies/${company.slug}` : '/companies')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackableCompanyId !== null && onCompanyClick(trackableCompanyId, 'profile')}
                className="flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 py-1.5 rounded-lg transition-colors cursor-pointer text-center"
              >
                Ver Perfil
              </a>
              {trackableCompanyId !== null && (
                <button
                  type="button"
                  onClick={() => onRequestQuote(trackableCompanyId)}
                  className="flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-brand-blue to-brand-cyan hover:from-brand-blue-dark hover:to-brand-blue py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Quero Orçamento
                </button>
              )}

              {MOBIVOLT_CARD_WHATSAPP_ENABLED && trackableCompanyId !== null && company.whatsapp && (
                <button
                  type="button"
                  onClick={() => onCompanyClick(trackableCompanyId, 'whatsapp')}
                  className="col-span-2 flex items-center justify-center text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  WhatsApp
                </button>
              )}

              {MOBIVOLT_COMPARE_BUTTON_ENABLED && trackableCompanyId !== null && (
                <button
                  type="button"
                  onClick={() => onCompare(trackableCompanyId)}
                  className={`col-span-2 flex items-center justify-center text-[10px] font-bold border py-1.5 rounded-lg transition-colors ${
                    comparedCompanyIds.includes(trackableCompanyId)
                      ? 'border-brand-blue text-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 dark:border-brand-blue'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  {comparedCompanyIds.includes(trackableCompanyId) ? '✓ Comparando' : 'Comparar Instalador'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ChatCompanyRecommendations(props: ChatCompanyRecommendationsProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="mt-3.5 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-center">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Não foi possível carregar as recomendações no momento.
          </p>
          <button 
            type="button"
            onClick={props.onRequestPersonalizedSearch}
            className="mt-2 text-[10px] text-red-700 dark:text-red-400 underline hover:text-red-800 transition-colors"
          >
            Tentar busca manual
          </button>
        </div>
      }
    >
      <RecommendationsContent {...props} />
    </ErrorBoundary>
  );
}
