/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowUpRight, TrendingUp, Star, Loader2 } from 'lucide-react';
import { publicCompaniesApi } from '@/lib/api-public';
import { useFeedStore } from '@/store/feedStore';

export function FeedRightRail() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const trendingTopics = useFeedStore((state) => state.trendingTopics);

  useEffect(() => {
    let active = true;
    publicCompaniesApi
      .getFeatured()
      .then((res) => {
        if (active) {
          setCompanies(res || []);
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
                      <img
                        src={company.logo_url}
                        alt={company.name}
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
            {trendingTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-muted font-medium text-slate-600 border border-slate-200/50"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

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
