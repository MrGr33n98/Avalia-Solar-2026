'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, ArrowUpRight, TrendingUp, Star, Loader2 } from 'lucide-react';
import { publicCompaniesApi } from '@/lib/api-public';
import { useFeedStore } from '@/store/feedStore';
import { FollowedCommunitiesCard } from './FollowedCommunitiesCard';
import { track } from '@/lib/analytics/lazy';
import { FollowButton } from './FollowButton';

export function FeedRightRail() {
  type FeaturedCompany = { id: number; slug?: string; name: string; logo_url?: string; category_name?: string; categories?: { name: string }[]; rating_avg?: number | string };
  const [companies, setCompanies] = useState<FeaturedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const trendingTopics = useFeedStore((state) => state.trendingTopics);
  const suggestedCreators = useFeedStore((state) => state.suggestedCreators);
  const suggestedCompanies = useFeedStore((state) => state.suggestedCompanies);
  const suggestedGroups = useFeedStore((state) => state.suggestedGroups);

  useEffect(() => {
    let active = true;
    publicCompaniesApi
      .getFeatured()
      .then((res) => {
        if (active) {
          setCompanies((res || []).map((company) => ({ ...company, logo_url: company.logo_url || undefined })));
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar empresas em destaque:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="space-y-4">
      {/* Featured Companies */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span>Empresas em Destaque</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
            <span className="text-xs">Carregando destaques...</span>
          </div>
        ) : companies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma empresa em destaque no momento.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {companies.slice(0, 5).map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug || ''}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors border border-transparent hover:border-border/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded bg-white flex items-center justify-center border border-border flex-shrink-0 overflow-hidden">
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt={company.name}
                        width={36}
                        height={36}
                        sizes="36px"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{company.name}</p>
                    <p className="text-muted-foreground truncate flex items-center gap-1">
                      <span>
                        {company.category_name ||
                          company.categories?.[0]?.name ||
                          'Tecnologia Solar'}
                      </span>
                      {company.rating_avg && Number(company.rating_avg) > 0 ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center text-amber-500 font-semibold gap-0.5">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {Number(company.rating_avg).toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-muted-foreground">Sem avaliações</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      {(suggestedCreators.length > 0 || suggestedCompanies.length > 0 || suggestedGroups.length > 0) && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">Sugestões para você</p>
          {suggestedCreators.slice(0, 3).map((creator) => (
            <div key={`creator-${creator.id}`} className="flex items-center justify-between gap-2">
              <Link href={`/creators/${creator.slug || creator.id}`} onClick={() => track('feed_creator_suggestion_clicked', { creator_id: creator.id })} className="truncate text-xs font-medium text-primary hover:underline">{creator.name}</Link>
              <FollowButton target={{ type: 'ReviewerProfile', id: creator.id }} />
            </div>
          ))}
          {suggestedCompanies.slice(0, 3).map((company) => (
            <Link key={`company-${company.id}`} href={`/companies/${company.slug || company.id}`} onClick={() => track('feed_company_suggestion_clicked', { company_id: company.id })} className="block text-xs font-medium text-primary hover:underline">
              {company.name}
            </Link>
          ))}
          {suggestedGroups.slice(0, 3).map((group) => (
            <Link key={`group-${group.id}`} href={`/groups/${group.slug || group.id}`} onClick={() => track('feed_group_suggestion_clicked', { group_id: group.id })} className="block text-xs font-medium text-primary hover:underline">
              {group.name}
            </Link>
          ))}
        </div>
      )}

      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <span>Assuntos em Alta</span>
        </div>
        {trendingTopics.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum assunto em alta no momento.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {trendingTopics.map((topic) => (
              <span
                key={topic.slug}
                className="px-2.5 py-1 rounded-full bg-muted font-medium text-slate-600 border border-slate-200/50"
              >
                {topic.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Followed Communities */}
      <FollowedCommunitiesCard />

      {/* Micro Footer */}
      <div
        className="text-[11px] text-muted-foreground px-2 space-y-1"
        aria-label="Links institucionais"
      >
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          <Link href="/about" className="hover:underline">
            Sobre
          </Link>
          <span>·</span>
          <Link href="/help" className="hover:underline">
            Ajuda
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
          <span>·</span>
          <Link href="/cookies" className="hover:underline">
            Cookies
          </Link>
        </div>
        <p className="text-muted-foreground/80">© 2026 Avalia Solar</p>
      </div>
    </aside>
  );
}
