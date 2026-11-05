'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Check, ChevronRight, Copy, Download, ExternalLink, LockKeyhole, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { badgesApi, type Badge } from '@/lib/api';
import {
  AVALIA_BADGES_2026,
  badgeEmbedHtml,
  findOfficialAward,
  officialBadgeUrl,
  type AvaliaBadgeCategory,
} from '@/lib/badges/avalia-badges-2026';

type FilterState = 'all' | 'earned' | 'available';
type CompanyInfo = {
  id?: number | string;
  name?: string;
  slug?: string;
  reviews_count?: number | null;
};

interface AvaliaBadgesWorkspaceProps {
  company: CompanyInfo | null;
  companyId: string | number;
}

export default function AvaliaBadgesWorkspace({ company, companyId }: AvaliaBadgesWorkspaceProps) {
  const [awards, setAwards] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedId, setSelectedId] = useState('pioneira-2026');
  const [status, setStatus] = useState<FilterState>('all');
  const [segment, setSegment] = useState<'all' | AvaliaBadgeCategory>('all');
  const resolvedCompanyId = String(company?.id ?? companyId ?? '').trim();

  useEffect(() => {
    let disposed = false;
    async function fetchOfficialAwards() {
      setLoading(true);
      setLoadError(false);
      setAwards([]);
      if (!resolvedCompanyId) {
        if (!disposed) {
          setLoading(false);
          setLoadError(true);
        }
        return;
      }
      try {
        const result = await badgesApi.getByCompany(resolvedCompanyId);
        if (!disposed) {
          if (!Array.isArray(result)) throw new Error('Formato inválido de conquistas');
          setAwards(result);
        }
      } catch {
        if (!disposed) {
          setAwards([]);
          setLoadError(true);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void fetchOfficialAwards();
    return () => { disposed = true; };
  }, [resolvedCompanyId, retryKey]);

  const earned = useMemo(
    () => AVALIA_BADGES_2026.filter((item) => findOfficialAward(item, awards)),
    [awards]
  );

  const filtered = useMemo(
    () => AVALIA_BADGES_2026.filter((item) => {
      if (segment !== 'all' && item.segment !== 'geral' && item.segment !== segment) return false;
      const isEarned = Boolean(findOfficialAward(item, awards));
      if (status === 'earned' && !isEarned) return false;
      if (status === 'available' && isEarned) return false;
      return true;
    }),
    [segment, status, awards]
  );

  const selected = AVALIA_BADGES_2026.find((item) => item.id === selectedId) || AVALIA_BADGES_2026[0];
  const selectedAward = findOfficialAward(selected, awards);
  const verificationPath = selectedAward ? officialBadgeUrl(selectedAward, resolvedCompanyId) : null;
  const embed = selectedAward ? badgeEmbedHtml(selected, selectedAward, resolvedCompanyId) : null;

  const hasReviewMetric = typeof company?.reviews_count === 'number' &&
    Number.isFinite(company.reviews_count) && company.reviews_count >= 0;
  const reviewCount = hasReviewMetric ? company!.reviews_count! : null;
  const milestonePercent = reviewCount === null ? 0 : Math.min(100, Math.round(reviewCount / 5 * 100));

  const copyEmbed = async () => {
    if (!embed || !selectedAward) return;
    try {
      await navigator.clipboard.writeText(embed);
      toast.success('Código de incorporação do selo oficial copiado.');
    } catch {
      toast.error('Não foi possível copiar o código. Verifique as permissões do navegador.');
    }
  };

  return (
    <section aria-label="Catálogo de Badges Avalia Solar 2026" className="space-y-5 pb-12" data-testid="avalia-badges-workspace">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">
              <Award className="h-4 w-4" aria-hidden="true" />
              Avalia Solar / Reconhecimentos
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#09172F] sm:text-3xl">
              Sua jornada de conquistas
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Sete reconhecimentos de 2026 por participação, desempenho e especialidade.
              Conheça os critérios, acompanhe sua atividade e compartilhe apenas os selos
              oficialmente concedidos à sua empresa.
            </p>
          </div>
          <UiBadge variant="outline" className="h-fit w-fit shrink-0 border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            Temporada 2026
          </UiBadge>
        </div>

        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl bg-[#09172F] p-4 text-white">
            <span className="text-[11px] font-medium text-white/70">Selos oficialmente conquistados</span>
            <div className="mt-1 flex items-baseline gap-1">
              <strong className="text-3xl font-bold" data-testid="earned-count">{loading || loadError ? '—' : earned.length}</strong>
              <span className="text-sm text-white/65">/ 7</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#FFC107] transition-[width]" style={{ width: loading || loadError ? '0%' : String(earned.length / 7 * 100) + '%' }} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Primeiro marco de engajamento</span>
              <span className="text-xs font-bold text-blue-700">{reviewCount === null ? 'Sem dados' : String(Math.min(reviewCount, 5)) + '/5 avaliações'}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: String(milestonePercent) + '%' }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Acompanhe avaliações autênticas publicadas. Atingir esse marco não concede automaticamente selos de liderança.
            </p>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
            <span>Não foi possível consultar as concessões oficiais agora. Nenhum selo está sendo apresentado como conquistado.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setRetryKey((old) => old + 1)}>
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Tentar novamente
            </Button>
          </div>
        )}
        {loading && <div role="status" className="mt-3 text-xs text-slate-500">Consultando registros oficiais de reconhecimento...</div>}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#09172F]">Catálogo de selos</h2>
          <p className="text-xs text-slate-500">Selecione um badge para consultar a missão, as evidências e a verificação.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
            Categoria
            <select aria-label="Filtrar especialidade" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800" value={segment} onChange={(e) => setSegment(e.target.value as typeof segment)}>
              <option value="all">Todas</option>
              <option value="comercial">Comercial</option>
              <option value="residencial">Residencial</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
            Conquistas
            <select aria-label="Filtrar conquistas" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800" value={status} onChange={(e) => setStatus(e.target.value as FilterState)}>
              <option value="all">Todos</option>
              <option value="earned">Conquistados</option>
              <option value="available">A conquistar</option>
            </select>
          </label>
        </div>
      </div>

      <div data-testid="badge-catalog-grid" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => {
          const granted = Boolean(findOfficialAward(item, awards));
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              aria-pressed={selected.id === item.id}
              data-testid={'badge-card-' + item.id}
              className={'group flex min-w-0 flex-col items-center rounded-xl border bg-white p-3 text-center shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:p-4 ' +
                (selected.id === item.id ? 'border-blue-600 ring-1 ring-blue-600/25' : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md')}
            >
              <div className="relative flex h-[160px] w-full items-center justify-center sm:h-[215px]">
                <Image
                  src={item.image}
                  alt={'Arte do selo ' + item.title}
                  width={170}
                  height={198}
                  unoptimized
                  className={'h-full max-h-[210px] w-auto object-contain transition-transform group-hover:scale-[1.03] ' +
                    (granted ? '' : 'opacity-80')}
                />
                {!granted && (
                  <span className="absolute bottom-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                    Prévia · não concedido
                  </span>
                )}
              </div>
              <span className="mt-2 line-clamp-2 min-h-9 text-xs font-bold leading-4 text-[#09172F] sm:text-sm">{item.title}</span>
              <span className={'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ' +
                (granted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                {granted ? <Check className="h-3 w-3" aria-hidden="true" /> : <LockKeyhole className="h-3 w-3" aria-hidden="true" />}
                {granted ? 'Conquistado' : 'A conquistar'}
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum selo corresponde aos filtros selecionados.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex min-h-[270px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
          <Image src={selected.image} width={240} height={280} unoptimized alt={'Badge ' + selected.title} className="h-auto max-h-[255px] w-auto object-contain" />
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="badge-details">
          <div className="flex flex-wrap items-center gap-2">
            <UiBadge variant="outline" className="border-blue-200 text-blue-700">{selected.shortLabel}</UiBadge>
            <UiBadge variant="outline" className="text-slate-500">2026</UiBadge>
            {selectedAward ? <UiBadge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Oficialmente concedido</UiBadge> :
              <UiBadge variant="outline" className="text-slate-600">Prévia do catálogo</UiBadge>}
          </div>
          <h3 className="mt-3 text-xl font-bold text-[#09172F]">{selected.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{selected.criterion}</p>
          <div className="mt-4 rounded-xl bg-blue-50/70 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Sua próxima missão</h4>
            <p className="mt-1 text-sm text-blue-950">{selected.mission}</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            {selected.evidence}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedAward && verificationPath ? (
              <>
                <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  <a href={selected.image} download={selected.id + '.svg'}><Download className="mr-2 h-4 w-4" />Baixar SVG</a>
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={!embed} onClick={() => { void copyEmbed(); }}>
                  <Copy className="mr-2 h-4 w-4" />Copiar código HTML
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={verificationPath} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Verificar selo</Link>
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Downloads e incorporação liberados após concessão oficial
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row sm:items-center">
        <p className="max-w-3xl leading-relaxed">
          Os badges de participação, liderança, suporte e especialidade seguem critérios diferentes.
          Nenhum selo é comprado ou liberado por plano; indicadores de progresso não substituem apuração e atribuição oficial.
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-700">
          <ChevronRight className="h-4 w-4" />Avalia Solar · edição 2026
        </span>
      </div>
    </section>
  );
}
