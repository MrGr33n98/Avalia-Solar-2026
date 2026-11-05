'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { companyDashboardApi, dashboardApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import {
  MARKETING_WIDGETS, createMarketingWidgetHtml,
  type MarketingWidgetKind, type MarketingWidgetTheme, type MarketingWidgetSnapshot,
} from '@/lib/marketing-widgets/snapshot';

interface CompanyInfo { id?: string | number; name?: string; slug?: string; }
interface MarketingWidgetsProps { company: CompanyInfo | null; companyId: string | number; }
interface StatsResponse { stats?: { approved_reviews?: number; average_rating?: number }; data_status?: string; }
interface ReviewItem { id: number; rating: number; comment: string; user_name?: string; featured: boolean; status: string; }
interface ReviewResponse {
  reviews?: ReviewItem[];
  permissions?: { can_feature_reviews?: boolean; social_proof_enabled?: boolean };
  data_status?: string;
}
interface RankingResponse {
  status?: string; mode?: string;
  official_ranking?: { position?: number | null; population?: number | null };
  ranking?: { position?: number | null; population?: number | null };
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0A1F44]">
      <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 8 21 2 13 22 10 13Z" fill="#FFC107" />
        <path d="m10 13 3 9 4-15Z" fill="#0B5FFF" />
      </svg>
      Avalia Solar
    </span>
  );
}

function Stars({ rating, small = false }: { rating: number | null; small?: boolean }) {
  if (rating === null) return <span className="text-xs text-slate-500">Sem nota publicada</span>;
  return <span aria-label={'Nota ' + rating.toFixed(1).replace('.', ',') + ' de 5'} className="inline-flex items-center gap-0.5 text-[#F3A000]">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} aria-hidden="true" className={small ? 'text-[12px]' : 'text-lg'} style={{ opacity: rating >= i + 1 ? 1 : rating > i ? .6 : .22 }}>★</span>
    ))}
  </span>;
}

function isNum(n: unknown): n is number { return typeof n === 'number' && Number.isFinite(n); }
function isCount(n: unknown): n is number { return isNum(n) && Number.isSafeInteger(n) && n >= 0; }

function WidgetIllustration({
  kind, snapshot, dense = false,
}: { kind: MarketingWidgetKind; snapshot: MarketingWidgetSnapshot; dense?: boolean }) {
  const hasReviews = isCount(snapshot.approvedCount) && snapshot.approvedCount > 0 && isNum(snapshot.rating);
  const testimonial = snapshot.testimonialAllowed ? snapshot.testimonial : null;
  return (
    <div className={'flex w-full items-center justify-center rounded-xl border border-slate-100 bg-[#FBFCFF] ' +
      (dense ? 'min-h-[154px] p-3' : 'h-[182px] p-3')}>
      {kind === 'ranking' && (
        <div className="relative grid h-40 w-full max-w-[220px] grid-cols-2 grid-rows-2 overflow-hidden rounded-lg border border-blue-200 bg-white text-[10px]">
          {['Desafiadores', 'Líderes', 'Nicho', 'Alta performance'].map((name, i) => (
            <div key={name} className={'flex p-2 font-semibold ' +
              (i === 0 ? 'items-start border-b border-r border-blue-100 text-blue-700' :
              i === 1 ? 'items-start justify-end border-b border-blue-100 text-[#0A1F44]' :
              i === 2 ? 'items-end border-r border-blue-100 text-slate-600' : 'items-end justify-end text-blue-700')}>
              {name}
            </div>
          ))}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-md border bg-white/95 p-2 text-center text-xs font-bold text-[#0A1F44] shadow-sm">
            {snapshot.rankPosition ? 'Posição ' + snapshot.rankPosition + ' de ' + snapshot.rankPopulation : 'Posicionamento em apuração'}
          </div>
        </div>
      )}
      {kind === 'summary' && (
        <div className="w-full max-w-[245px] rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-1 text-xs font-bold text-[#0A1F44]">{snapshot.companyName || 'Empresa'}</span>
            <BrandMark />
          </div>
          <div className="my-3 flex items-center gap-2">
            <span className="text-2xl font-extrabold text-[#0A1F44]">
              {hasReviews ? snapshot.rating!.toFixed(1).replace('.', ',') : '—'}
            </span>
            <Stars rating={hasReviews ? snapshot.rating : null} small />
          </div>
          <div className="text-[11px] text-slate-600">
            {snapshot.approvedCount === null ? 'Dados indisponíveis' : snapshot.approvedCount + ' avaliações aprovadas'}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-[#DCE8FF]"><div className="h-full w-2/3 rounded-full bg-blue-600/30" /></div>
        </div>
      )}
      {kind === 'stars' && (
        <div className="flex w-full max-w-[270px] flex-col gap-2">
          {(['bg-[#0A1F44] text-white', 'bg-white border border-blue-200 text-[#0A1F44]', 'bg-[#FFFAEB] border border-amber-200 text-[#0A1F44]'] as const).map((klass, i) => (
            <div key={klass} className={'flex items-center justify-between gap-2 rounded-lg px-3 py-2 shadow-sm ' + klass}>
              <span className="text-[11px] font-semibold">{['Avaliado no Avalia Solar', 'Veja nossas avaliações', 'Opiniões de clientes'][i]}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold">
                {hasReviews ? snapshot.rating!.toFixed(1).replace('.', ',') : '—'}
                <span className="text-[#F3A000]">★</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {kind === 'testimonial' && (
        <div className="w-full max-w-[270px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {testimonial ? (
            <>
              <p className="line-clamp-3 text-sm font-medium leading-snug text-[#0A1F44]">“{testimonial.quote}”</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-slate-700">{testimonial.author}</span>
                <Stars rating={testimonial.rating} small />
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-[#0A1F44]">Depoimentos de clientes</div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                Nenhum depoimento aprovado e destacado disponível para publicação.
              </div>
            </>
          )}
          <div className="mt-3 border-t border-slate-100 pt-2"><BrandMark /></div>
        </div>
      )}
    </div>
  );
}

/**
 * Marketing assets discovery + safe snapshot generator. Reuses existing moderation,
 * stats, ranking and entitlements, with NO synthetic rating/reviews or buyer claims.
 */
export default function ReputationMarketingWidgets({ company, companyId }: MarketingWidgetsProps) {
  const [active, setActive] = useState<MarketingWidgetKind>('summary');
  const [theme, setTheme] = useState<MarketingWidgetTheme>('light');
  const [data, setData] = useState<{ count: number | null; rating: number | null; review: MarketingWidgetSnapshot['testimonial']; testimonialAllowed: boolean }>({
    count: null, rating: null, review: null, testimonialAllowed: false,
  });
  const [loading, setLoading] = useState(true);
  const [dataScope, setDataScope] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [rank, setRank] = useState<{ position: number; population: number } | null>(null);
  const [rankStatus, setRankStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [rankScope, setRankScope] = useState<string | null>(null);

  const id = String(company?.id ?? companyId ?? '').trim();
  const name = company?.name?.trim() || 'Empresa';
  const slug = company?.slug?.trim() || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(false);
    setData({ count: null, rating: null, review: null, testimonialAllowed: false });
    setDataScope(null);
    setRank(null); setRankScope(null); setRankStatus('idle');
    if (!id) {
      setLoading(false); setLoadError(true);
      return;
    }
    Promise.allSettled([
      dashboardApi.getSocialProofStats({ company_id: id }),
      dashboardApi.getSocialProofReviews({ company_id: id }),
    ]).then(([statsResult, reviewsResult]) => {
      if (cancelled) return;
      const stats = statsResult.status === 'fulfilled' ? statsResult.value as StatsResponse : null;
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value as ReviewResponse : null;
      const s = stats?.data_status === 'degraded' ? null : stats?.stats;
      const count = isCount(s?.approved_reviews) ? s!.approved_reviews! : null;
      const rating = count !== null && count > 0 && isNum(s?.average_rating) &&
        s!.average_rating! >= 0 && s!.average_rating! <= 5 ? s!.average_rating! : null;
      const allowed = reviews?.data_status !== 'degraded' &&
        reviews?.permissions?.can_feature_reviews === true &&
        reviews?.permissions?.social_proof_enabled === true;
      const picked = allowed && Array.isArray(reviews?.reviews)
        ? reviews.reviews.find((item) => item.featured === true && item.status === 'approved' &&
          typeof item.comment === 'string' && Boolean(item.comment.trim()) &&
          isNum(item.rating) && item.rating >= 0 && item.rating <= 5)
        : undefined;
      setData({
        count, rating,
        review: picked ? {
          author: (picked.user_name || 'Cliente').slice(0, 80),
          quote: picked.comment.slice(0, 450),
          rating: picked.rating,
        } : null,
        testimonialAllowed: Boolean(allowed),
      });
      setLoadError(statsResult.status === 'rejected' || reviewsResult.status === 'rejected' || Boolean(!s));
      setDataScope(id);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, retry]);

  useEffect(() => {
    if (active !== 'ranking' || !id || rankStatus !== 'idle') return;
    let cancelled = false;
    setRankStatus('loading');
    companyDashboardApi.getRanking(id).then((payload) => {
      if (cancelled) return;
      const response = payload as RankingResponse;
      const source = response.official_ranking ?? response.ranking;
      if (response.status === 'ready' && response.mode !== 'preview' &&
        isNum(source?.position) && source!.position! > 0 &&
        isNum(source?.population) && source!.population! >= source!.position!) {
        setRank({ position: source!.position!, population: source!.population! });
        setRankScope(id);
        setRankStatus('ready');
      } else {
        setRank(null); setRankStatus('unavailable');
      }
    }).catch(() => { if (!cancelled) { setRank(null); setRankStatus('unavailable'); } });
    return () => { cancelled = true; };
  }, [active, id, rankStatus]);

  const scopedData = dataScope === id ? data : { count: null, rating: null, review: null, testimonialAllowed: false };
  const scopedRank = rankScope === id ? rank : null;
  const snapshot: MarketingWidgetSnapshot = useMemo(() => ({
    companyName: name, slug,
    approvedCount: scopedData.count, rating: scopedData.rating,
    rankPosition: scopedRank?.position ?? null, rankPopulation: scopedRank?.population ?? null,
    testimonial: scopedData.review, testimonialAllowed: scopedData.testimonialAllowed,
  }), [name, slug, scopedData.count, scopedData.rating, scopedData.review, scopedData.testimonialAllowed, scopedRank]);
  const snippet = createMarketingWidgetHtml(active, snapshot, theme);

  const copy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success('HTML estático copiado. Atualize-o quando os dados mudarem.');
      track('reputation_marketing_widget_snapshot_copied', {
        company_id: id, widget_type: active, theme, export_format: 'static_html',
      });
    } catch {
      toast.error('Não foi possível copiar o HTML.');
    }
  };

  return (
    <section data-testid="reputation-marketing-widgets" aria-labelledby="widgets-heading" className="space-y-5 pb-12">
      <header className="rounded-xl border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-7">
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-blue-700">Reputação / Marketing Assets</p>
        <h1 id="widgets-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-[#0A1F44] sm:text-3xl">Widgets de Reputação</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Transforme avaliações autênticas em elementos visuais para seu site. Os dados exibidos são consultados na plataforma.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0A1F44] sm:text-xl">Engaje compradores com widgets personalizados</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Quatro formatos para explorar. A disponibilidade de dados e permissões determina o que pode ser publicado.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="widgets-catalog">
          {MARKETING_WIDGETS.map((item) => (
            <article key={item.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 hover:border-blue-300 hover:shadow-md sm:p-4">
              <WidgetIllustration kind={item.id} snapshot={snapshot} />
              <h3 className="mt-4 text-sm font-bold text-[#0A1F44]">{item.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{item.summary}</p>
              <Button
                type="button" variant={item.id === active ? 'default' : 'outline'}
                aria-pressed={active === item.id} data-testid={'select-widget-' + item.id}
                onClick={() => { setActive(item.id); track('reputation_marketing_widget_selected', { widget_type: item.id, company_id: id }); }}
                className={'mt-4 h-11 w-full text-xs font-semibold ' + (item.id === active ? 'bg-[#0B5FFF] text-white hover:bg-blue-700' : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50')}
              >
                {item.action} <span aria-hidden="true" className="ml-1">→</span>
              </Button>
            </article>
          ))}
        </div>
      </div>

      <div id="widget-customizer" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold text-[#0A1F44]">Personalizar · {MARKETING_WIDGETS.find((item) => item.id === active)?.title}</h2>
          <p className="mt-1 text-xs text-slate-600">Prévia com informações reais da empresa, sem dados de demonstração.</p>
          <div className="mt-4 flex items-center gap-2">
            {(['light', 'dark'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTheme(t)} aria-pressed={theme === t}
                className={'inline-flex h-11 items-center rounded-lg border px-4 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ' +
                  (theme === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600')}>
                Tema {t === 'light' ? 'claro' : 'escuro'}
              </button>
            ))}
          </div>
          <div className={'mt-4 rounded-xl p-3 ' + (theme === 'dark' ? 'bg-[#0A1F44]' : 'bg-[#F7F9FF]')}>
            <WidgetIllustration kind={active} snapshot={snapshot} dense />
          </div>
          {active === 'ranking' && (
            <Link href={'/dashboard?company_id=' + encodeURIComponent(id) + '&tab=ranking-performance'} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">
              Consultar metodologia e posicionamento oficial →
            </Link>
          )}
          {active === 'testimonial' && !data.testimonialAllowed && (
            <p className="mt-3 text-xs text-amber-800" role="status">A publicação de depoimentos depende das permissões de prova social da empresa.</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold text-[#0A1F44]">Código de incorporação</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Exportação HTML <strong>estática</strong>, com link para o perfil oficial. Não sincroniza automaticamente avaliações ou ranking.
          </p>
          {loading || dataScope !== id ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600" role="status">Consultando avaliações e permissões...</p>
          ) : (
            <>
              {loadError && dataScope === id && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" role="alert">
                Algumas informações não puderam ser consultadas. Não publicaremos números incompletos.
                <button type="button" onClick={() => setRetry((k) => k + 1)} className="ml-2 font-semibold underline">Tentar novamente</button>
              </p>}
              {active === 'ranking' && rankStatus === 'loading' && <p className="mt-3 text-xs text-slate-500">Consultando posição oficial...</p>}
              <div className="mt-4 flex-1">
                <label htmlFor="marketing-widget-snippet" className="mb-2 block text-xs font-semibold text-slate-700">HTML gerado</label>
                <textarea
                  id="marketing-widget-snippet"
                  readOnly value={snippet || ''}
                  placeholder="Sem dados publicados ou permissão suficiente para exportar este modelo."
                  className="h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-[#0A1F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>
              {!snippet && <p className="mb-2 text-xs leading-relaxed text-slate-600">
                {active === 'ranking'
                  ? 'O ranking só pode ser exibido quando a API confirmar uma posição oficial, não uma prévia ou posição bloqueada.'
                  : active === 'testimonial'
                    ? 'Selecione uma avaliação aprovada e destacada na gestão de avaliações, com prova social habilitada.'
                    : 'É necessária ao menos uma avaliação aprovada com nota publicada.'}
              </p>}
              <Button type="button" disabled={!snippet} onClick={() => { void copy(); }}
                className="mt-2 h-11 w-full bg-[#0B5FFF] text-white hover:bg-blue-700 sm:w-auto sm:self-end">
                Copiar HTML estático
              </Button>
            </>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            A publicação dinâmica via Shadow DOM exigirá uma etapa separada de backend, cache, segurança e medição por impressão.
          </p>
        </div>
      </div>
    </section>
  );
}
