'use client';

import Image from 'next/image';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Plus,
  Lock,
  TrendingUp,
  Users,
  Target,
  MousePointerClick,
  AlertCircle,
  BarChart3,
  Download,
  Pause,
  Play,
  Send,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { isFeatureEnabled } from '@/lib/feature-access';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';

interface BannersSponsorshipProps {
  companyId: string;
}

type BannerPerformance = {
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  investment_cents?: number;
  cpc_cents?: number;
  investment?: number;
  cpc?: number;
};

type ActiveAddon = {
  id: number;
  name: string;
  ends_at: string;
  days_remaining: number;
};

type CompanyBanner = {
  id: number;
  title: string;
  thumbnail_url?: string | null;
  link_url?: string | null;
  banner_type: string;
  operational_status: string;
  moderation_status: string;
  rejected_reason?: string | null;
  position: string;
  slot_key: string;
  starts_at?: string;
  ends_at?: string;
  days_remaining?: number;
  performance: BannerPerformance;
  active_addons: ActiveAddon[];
  allowed_actions: string[];
  delivery_health?: {
    status: 'healthy' | 'blocked';
    blockers: string[];
    checks: Array<{ key: string; label: string; ok: boolean }>;
  };
};

type Quota = {
  used: number;
  limit: number | null;
  remaining: number | null;
  can_create: boolean;
};

type DashboardPayload = {
  quota: Quota;
  summary: BannerPerformance;
  banners: CompanyBanner[];
};

type BannerAddon = {
  id: number;
  name: string;
  code: string;
  description: string;
  price_cents: number;
  promotional_price_cents?: number | null;
  effective_price_cents: number;
  currency: string;
  duration_days: number;
};

type ApiFailure = Error & { status?: number };

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  approved: 'Aprovado',
  draft: 'Rascunho',
  expired: 'Expirado',
  paused: 'Pausado',
  rejected: 'Rejeitado',
  scheduled: 'Agendado',
  submitted: 'Em análise',
};

const BANNER_POSITIONS = [
  ['navbar', 'Barra de navegação'],
  ['sidebar', 'Barra lateral'],
  ['home_top', 'Topo da página inicial'],
  ['categories_top', 'Topo de categoria'],
  ['categories_filter_sidebar', 'Filtro lateral de categoria'],
  ['categories_right_rail', 'Lateral direita de categoria'],
  ['companies_top', 'Topo de empresas'],
  ['companies_footer', 'Rodapé de empresas'],
  ['companies_right_rail', 'Lateral direita de empresas'],
  ['search_top', 'Topo da busca'],
  ['search_mid', 'Meio da busca'],
  ['article_footer_cta', 'CTA no rodapé de artigo'],
  ['pricing_advertise_section', 'Seção de publicidade em preços'],
  ['company_profile_about_inline', 'Perfil: conteúdo sobre'],
  ['company_profile_related_carousel', 'Perfil: carrossel relacionado'],
  ['company_profile_sidebar_sponsored', 'Perfil da empresa'],
  ['compare_hero', 'Comparador: destaque'],
  ['compare_page_top', 'Comparador: topo'],
  ['compare_page_inline', 'Comparador: conteúdo'],
  ['compare_page_sidebar', 'Comparador: lateral'],
  ['compare_page_bottom', 'Comparador: rodapé'],
  ['comparison_floating_bar', 'Comparador: barra flutuante'],
  ['financing_simulator_micro_banner', 'Simulador de financiamento'],
] as const;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

type BannerCheckoutResponse = {
  subscription: {
    id: number;
    status: string;
    payment_provider: string;
    checkout_session_id: string;
  };
  redirect_url: string;
  message?: string;
};

function formatMoney(cents?: number, currency: string = 'BRL') {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

type DetailedPerformance = {
  banner_id: number;
  metrics: BannerPerformance;
  quality?: {
    total_events: number;
    reportable_events: number;
    discarded_events: number;
    discard_reasons: Record<string, number>;
  };
  context_breakdown?: {
    page_path: string;
    placement: string;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
  }[];
  breakdown: {
    placement: string;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
  }[];
  time_series: {
    day: string;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
  }[];
};

function PerformanceDialog({ banner, trigger }: { banner: CompanyBanner; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailedPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchApi<DetailedPerformance>(
          `/company_dashboard/banners/${banner.id}/performance`
        );
        setData(resp);
      } catch (e: unknown) {
        setError(errorMessage(e, 'Falha ao carregar performance'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [open, banner.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Performance: {banner.title}</DialogTitle>
          <DialogDescription>Métricas e série temporal do anúncio patrocinado.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-400">Carregando métricas...</div>
        ) : error ? (
          <div className="py-10 text-center text-rose-500">{error}</div>
        ) : data ? (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Views</div>
                <div className="font-black text-lg">{data.metrics.impressions}</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cliques</div>
                <div className="font-black text-lg">{data.metrics.clicks}</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Leads</div>
                <div className="font-black text-lg">{data.metrics.leads}</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">CTR</div>
                <div className="font-black text-lg">{data.metrics.ctr}%</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Custo</div>
                <div className="font-black text-lg">
                  {formatMoney(
                    data.metrics.investment_cents || (data.metrics.investment || 0) * 100
                  )}
                </div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">CPC</div>
                <div className="font-black text-lg">
                  {formatMoney(data.metrics.cpc_cents || (data.metrics.cpc || 0) * 100)}
                </div>
              </div>
            </div>

            {data.quality && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Qualidade do tracking</h4>
                    <p className="mt-1 text-xs text-slate-500">{data.quality.reportable_events} reportáveis de {data.quality.total_events} eventos</p>
                  </div>
                  <Badge variant={data.quality.discarded_events > 0 ? 'secondary' : 'default'}>
                    {data.quality.discarded_events} descartados
                  </Badge>
                </div>
                {Object.keys(data.quality.discard_reasons).length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Motivos: {Object.entries(data.quality.discard_reasons).map(([reason, count]) => `${reason} (${count})`).join(', ')}
                  </p>
                )}
              </div>
            )}

            {data.breakdown?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Por posição</h4>
                <div className="grid gap-2">
                  {data.breakdown.map((row) => (
                    <div key={row.placement} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs">
                      <span className="font-semibold">{row.placement}</span>
                      <span className="text-slate-500">{row.impressions} imp. · {row.clicks} cliques · {row.leads} leads · {row.ctr}% CTR</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.context_breakdown?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Por página e posição</h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {data.context_breakdown.map((row) => (
                    <div key={`${row.page_path}:${row.placement}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-white/5">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{row.page_path}</div>
                        <div className="truncate text-slate-500">{row.placement}</div>
                      </div>
                      <span className="shrink-0 text-slate-500">{row.impressions} imp. · {row.clicks} cliques · {row.leads} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simple mini-chart representation */}
            {data.time_series.length > 0 && (
              <div
                role="img"
                aria-label={`Gráfico de impressões dos últimos ${data.time_series.length} dias`}
                className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 h-48 flex items-end justify-between gap-1"
              >
                {data.time_series.map((ts, i) => {
                  const max = Math.max(...data.time_series.map((t) => t.impressions)) || 1;
                  const height = (ts.impressions / max) * 100;
                  return (
                    <div
                      key={i}
                      tabIndex={0}
                      aria-label={`${new Date(ts.day).toLocaleDateString('pt-BR')}: ${ts.impressions} impressões`}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      <div
                        className="w-full bg-brand-blue/80 hover:bg-brand-blue rounded-t-md transition-all"
                        style={{ height: `${Math.max(4, height)}%` }}
                      />

                      {/* Tooltip */}
                      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {new Date(ts.day).toLocaleDateString('pt-BR')}: {ts.impressions} views
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddonCheckoutDialog({ banner, trigger }: { banner: CompanyBanner; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [addons, setAddons] = useState<BannerAddon[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadAddons = async () => {
      setLoadingAddons(true);
      setError(null);
      try {
        const resp = await fetchApi<{ banner_addons: BannerAddon[] }>('/banner_addons');
        const list = resp?.banner_addons || [];
        setAddons(list);
        if (list[0]?.id) setSelectedAddonId((current) => current || String(list[0].id));
      } catch (e: unknown) {
        setError(errorMessage(e, 'Falha ao carregar add-ons'));
      } finally {
        setLoadingAddons(false);
      }
    };
    loadAddons();
  }, [open]);

  const idempotencyKeyRef = useRef('');

  const doCheckout = async () => {
    if (!selectedAddonId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          globalThis.crypto?.randomUUID?.() ||
          `banner-${banner.id}-${selectedAddonId}-${Date.now()}-${Math.random()}`;
      }
      const resp = await fetchApi<BannerCheckoutResponse>(
        '/company_dashboard/banner_addon_checkout',
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKeyRef.current },
          body: JSON.stringify({ addon_id: Number(selectedAddonId), banner_id: banner.id }),
        }
      );
      if (resp.redirect_url) {
        window.location.href = resp.redirect_url;
      }
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao criar checkout'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Impulsionar Banner</DialogTitle>
          <DialogDescription>
            Escolha um pacote de destaque para o banner <strong>{banner.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pacote</Label>
            <Select
              value={selectedAddonId}
              onValueChange={(value) => {
                idempotencyKeyRef.current = '';
                setSelectedAddonId(value);
              }}
              disabled={loadingAddons || addons.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingAddons ? 'Carregando...' : 'Selecione um pacote'}
                />
              </SelectTrigger>
              <SelectContent>
                {addons.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} • {formatMoney(a.effective_price_cents, a.currency)} •{' '}
                    {a.duration_days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={doCheckout} disabled={submitting || loadingAddons || !selectedAddonId}>
            {submitting ? 'Gerando Checkout...' : 'Ir para Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BannerFormDialog({
  banner,
  trigger,
  onSaved,
}: {
  banner?: CompanyBanner;
  trigger: ReactNode;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(banner?.title || '');
  const [link, setLink] = useState(banner?.link_url || '');
  const [position, setPosition] = useState(banner?.position || 'home_top');
  const [bannerType, setBannerType] = useState(banner?.banner_type || 'rectangular_large');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim() || !link.trim() || (!banner && !image)) {
      setError('Preencha título, link e imagem.');
      return;
    }
    if (image && (!image.type.startsWith('image/') || image.size > 5 * 1024 * 1024)) {
      setError('Use imagem válida com até 5 MB.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const body = new FormData();
    body.set('title', title.trim());
    body.set('link', link.trim());
    body.set('position', position);
    body.set('banner_type', bannerType);
    if (image) body.set('image', image);

    try {
      await fetchApi(`/company_dashboard/banners${banner ? `/${banner.id}` : ''}`, {
        method: banner ? 'PATCH' : 'POST',
        body,
      });
      await onSaved();
      setOpen(false);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Não foi possível salvar banner.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{banner ? 'Editar banner' : 'Novo banner'}</DialogTitle>
          <DialogDescription>
            {banner
              ? 'Alterações voltam para rascunho e exigem nova moderação.'
              : 'Crie anúncio em rascunho e envie para moderação quando estiver pronto.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor={`banner-title-${banner?.id || 'new'}`}>Título</Label>
            <Input
              id={`banner-title-${banner?.id || 'new'}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`banner-link-${banner?.id || 'new'}`}>Link de destino</Label>
            <Input
              id={`banner-link-${banner?.id || 'new'}`}
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://suaempresa.com.br/oferta"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Posição</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger aria-label="Posição do banner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={bannerType} onValueChange={setBannerType}>
                <SelectTrigger aria-label="Formato do banner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular_large">Retangular grande</SelectItem>
                  <SelectItem value="rectangular_small">Retangular pequeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`banner-image-${banner?.id || 'new'}`}>
              Imagem {banner ? '(opcional)' : ''}
            </Label>
            <Input
              id={`banner-image-${banner?.id || 'new'}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
              required={!banner}
            />
            <p className="text-xs text-slate-500">PNG, JPEG ou WebP. Máximo 5 MB.</p>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? 'Salvando...' : banner ? 'Salvar alterações' : 'Criar rascunho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BannersSponsorship({ companyId }: BannersSponsorshipProps) {
  const { features } = useCompanyFeatures(companyId);
  const allowed = useMemo(() => isFeatureEnabled(features, 'promo_banner'), [features]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBannerId, setActionBannerId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!allowed) return;
    void companyId;

    setLoading(true);
    setError(null);
    try {
      const resp = await fetchApi<DashboardPayload>('/company_dashboard/banners');
      setData(resp);
    } catch (e: unknown) {
      const failure = e as ApiFailure;
      if (failure.status === 403) {
        setError('Acesso restrito ao seu plano atual.');
      } else {
        setError(errorMessage(e, 'Falha ao sincronizar dados.'));
      }
    } finally {
      setLoading(false);
    }
  }, [allowed, companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAction = async (
    banner: CompanyBanner,
    action: 'submit' | 'pause' | 'resume' | 'delete'
  ) => {
    if (action === 'delete' && !window.confirm(`Excluir o banner “${banner.title}”?`)) return;

    setActionBannerId(banner.id);
    setActionError(null);
    try {
      await fetchApi(
        `/company_dashboard/banners/${banner.id}${action === 'delete' ? '' : `/${action}`}`,
        {
          method: action === 'delete' ? 'DELETE' : 'PATCH',
        }
      );
      await loadData();
    } catch (e: unknown) {
      setActionError(errorMessage(e, 'Não foi possível concluir ação.'));
    } finally {
      setActionBannerId(null);
    }
  };

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/5 flex items-center justify-center mb-8">
            <Lock className="h-10 w-10 text-rose-500/20" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">
            Recurso Bloqueado
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-xs text-center mb-8">
            Faça upgrade para plano com Avalia Solar Ads e libere banners patrocinados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Avalia Solar Ads
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
            Campanhas <span className="text-brand-blue">Patrocinadas</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/40 max-w-md font-medium leading-relaxed">
            Gerencie seus anúncios de destaque.{' '}
            {data?.quota &&
              `Você tem ${data.quota.used} de ${data.quota.limit ?? 'ilimitados'} anúncios ativos.`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <BannerFormDialog
            onSaved={loadData}
            trigger={
              <Button
                disabled={!data?.quota?.can_create}
                className="h-12 px-8 rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Anúncio
              </Button>
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 bg-rose-50/50 dark:bg-rose-500/5 rounded-[3rem] border border-rose-100 dark:border-rose-500/10">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {error}
          </h3>
          <Button variant="outline" className="mt-6" onClick={loadData}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <>
          {actionError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"
            >
              {actionError}
            </div>
          )}
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Impressões</span>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {data.summary.impressions.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Cliques (CTR)</span>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {data.summary.clicks.toLocaleString('pt-BR')}{' '}
                  <span className="text-sm font-semibold text-slate-400">
                    ({data.summary.ctr}%)
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Leads</span>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {data.summary.leads.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Investimento</span>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {formatMoney(data.summary.investment_cents)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel */}
          <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Funil de campanha</h3>
                  <p className="text-xs text-slate-500 mt-1">Eventos reportáveis no período atual</p>
                </div>
                <BarChart3 className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Impressões', data.summary.impressions, 'bg-brand-blue'],
                  ['Cliques', data.summary.clicks, 'bg-emerald-500'],
                  ['Leads', data.summary.leads, 'bg-orange-500'],
                  ['CTR', `${data.summary.ctr}%`, 'bg-purple-500'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <div className={`absolute inset-y-0 left-0 w-1 ${color}`} />
                    <div className="pl-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="pl-2 mt-2 text-xl font-black">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
                  </div>
                ))}
              </div>
              {data.summary.clicks > 0 && (
                <p className="mt-4 text-xs font-semibold text-slate-500">
                  Conversão clique para lead: {((data.summary.leads / data.summary.clicks) * 100).toFixed(2)}%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Banner List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Seus Anúncios
            </h3>
            {data.banners.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 dark:bg-white/5 rounded-3xl">
                Nenhum anúncio criado.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.banners.map((banner) => (
                  <Card
                    key={banner.id}
                    className="rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800"
                  >
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 relative">
                      {banner.thumbnail_url && (
                        <Image
                          src={banner.thumbnail_url}
                          alt={banner.title}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover"
                        />
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge
                          variant={banner.operational_status === 'active' ? 'default' : 'secondary'}
                          className="uppercase text-[9px] font-black tracking-widest px-3 py-1"
                        >
                          {STATUS_LABELS[banner.operational_status] || banner.operational_status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-1">{banner.title}</h4>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-6">
                        Posição: {banner.position}
                      </p>

                      {banner.delivery_health && (
                        <div className={`mb-6 rounded-xl border p-3 ${
                          banner.delivery_health.status === 'healthy'
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                            : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Saúde da entrega
                            </span>
                            <Badge variant="secondary" className="text-[9px] uppercase">
                              {banner.delivery_health.status === 'healthy' ? 'Normal' : 'Bloqueado'}
                            </Badge>
                          </div>
                          {banner.delivery_health.blockers.length > 0 && (
                            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                              Bloqueios: {banner.delivery_health.blockers.join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {banner.moderation_status === 'rejected' && banner.rejected_reason && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold text-rose-900 dark:text-rose-500">
                              Banner Rejeitado
                            </span>
                          </div>
                          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                            {banner.rejected_reason}
                          </p>
                          <BannerFormDialog
                            banner={banner}
                            onSaved={loadData}
                            trigger={
                              <Button
                                variant="outline"
                                className="mt-2 w-full text-[10px] uppercase font-bold text-rose-700 border-rose-200"
                              >
                                Corrigir banner
                              </Button>
                            }
                          />
                        </div>
                      )}

                      {/* Add-ons */}
                      {banner.active_addons.length > 0 && (
                        <div className="mb-6 space-y-2">
                          {banner.active_addons.map((addon) => (
                            <div
                              key={addon.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-900 dark:text-amber-500">
                                  {addon.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                {Math.max(addon.days_remaining, 0)} dias
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Visitas
                          </div>
                          <div className="font-black text-sm">{banner.performance.impressions}</div>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Cliques
                          </div>
                          <div className="font-black text-sm">{banner.performance.clicks}</div>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Leads
                          </div>
                          <div className="font-black text-sm">{banner.performance.leads}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {banner.allowed_actions.includes('buy_addon') && (
                            <AddonCheckoutDialog
                              banner={banner}
                              trigger={
                                <Button className="flex-1 bg-brand-blue hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                                  Impulsionar
                                </Button>
                              }
                            />
                          )}
                          {banner.allowed_actions.includes('edit') && (
                            <BannerFormDialog
                              banner={banner}
                              onSaved={loadData}
                              trigger={
                                <Button
                                  variant="outline"
                                  className="flex-1 font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl"
                                >
                                  Editar
                                </Button>
                              }
                            />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl"
                          onClick={() => {
                            window.open(`/api/v1/company_dashboard/banners/${banner.id}/export.csv`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Exportar CSV
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          {banner.allowed_actions.includes('submit') && (
                            <Button
                              variant="outline"
                              disabled={actionBannerId === banner.id}
                              onClick={() => runAction(banner, 'submit')}
                            >
                              <Send className="mr-2 h-4 w-4" /> Enviar
                            </Button>
                          )}
                          {banner.allowed_actions.includes('pause') && (
                            <Button
                              variant="outline"
                              disabled={actionBannerId === banner.id}
                              onClick={() => runAction(banner, 'pause')}
                            >
                              <Pause className="mr-2 h-4 w-4" /> Pausar
                            </Button>
                          )}
                          {banner.allowed_actions.includes('resume') && (
                            <Button
                              variant="outline"
                              disabled={actionBannerId === banner.id}
                              onClick={() => runAction(banner, 'resume')}
                            >
                              <Play className="mr-2 h-4 w-4" /> Retomar
                            </Button>
                          )}
                          {banner.allowed_actions.includes('delete') && (
                            <Button
                              variant="outline"
                              className="text-destructive"
                              disabled={actionBannerId === banner.id}
                              onClick={() => runAction(banner, 'delete')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </Button>
                          )}
                        </div>

                        <PerformanceDialog
                          banner={banner}
                          trigger={
                            <Button
                              variant="secondary"
                              className="w-full font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Ver Performance Detalhada
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
