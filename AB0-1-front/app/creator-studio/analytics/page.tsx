'use client';

import * as React from 'react';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/api-config';
import { Loader2, Eye, Users, MousePointerClick, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

type AnalyticsData = {
  views: number;
  followers: number;
  clicks: number;
  daily_views: Array<{ date: string; views: number }>;
};

export default function CreatorAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch(buildApiUrl('reviewer/analytics'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar as métricas de analytics.');
        return res.json();
      })
      .then((resData) => {
        if (active) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e5eff]" />
        <p className="text-sm font-semibold text-slate-500">Carregando métricas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        <p className="font-semibold">{error || 'Métricas indisponíveis no momento.'}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            window.location.reload();
          }}
          className="mt-3 inline-flex min-h-[36px] items-center rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const maxDailyViews = Math.max(...data.daily_views.map((d) => d.views), 1);

  return (
    <div className="space-y-6 text-[#0b1730]">
      <div>
        <p className="text-sm font-semibold text-[#1e5eff]">Creator Studio</p>
        <h2 className="mt-1 text-3xl font-bold leading-tight">Analytics</h2>
        <p className="mt-2 text-sm text-[#53627a]">
          Métricas de alcance público do seu perfil, publicações e links do seu Creator Tree.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#53627a]">Visualizações Totais</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1e5eff]">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">{data.views}</p>
          <p className="mt-1 text-xs text-[#718096]">Perfil + publicações públicas</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#53627a]">Seguidores</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">{data.followers}</p>
          <p className="mt-1 text-xs text-[#718096]">Conexões em seu perfil</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#53627a]">Cliques em Links</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">{data.clicks}</p>
          <p className="mt-1 text-xs text-[#718096]">Redirecionamentos em blocos ativos</p>
        </div>
      </div>

      {/* Chart & Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Views Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Visualizações Diárias</h3>
            <span className="text-xs text-[#718096]">Últimos 7 dias</span>
          </div>
          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-2">
            {data.daily_views.map((d, index) => {
              const heightPercent = Math.max(5, (d.views / maxDailyViews) * 100);
              return (
                <div key={index} className="group flex flex-1 flex-col items-center">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-7 scale-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white transition group-hover:scale-100 whitespace-nowrap">
                      {d.views} visualizações
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-blue-500 to-[#1e5eff] transition-all group-hover:from-blue-600 group-hover:to-[#174dcc]"
                    />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-[#718096]">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600">
              <Sparkles className="h-5 w-5 fill-current" />
              <h3 className="font-bold text-[#0b1730]">Dicas de Crescimento</h3>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[#53627a]">
              <li className="flex items-start gap-2.5">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#1e5eff]" />
                <span>
                  <strong>Publique novos artigos:</strong> Creators que publicam ao menos 1 vez por semana têm 3x mais visualizações.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#1e5eff]" />
                <span>
                  <strong>Compartilhe seu link:</strong> Promova seu link do <strong>Creator Tree</strong> nas suas redes sociais para atrair cliques.
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/creator-studio/tree"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1e5eff] hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <span>Gerenciar blocos no Tree</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
