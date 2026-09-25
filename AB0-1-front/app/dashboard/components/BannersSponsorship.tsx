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
  MousePointer,
  AlertCircle,
  BarChart3,
  Activity,
  Download,
  Pause,
  Play,
  Send,
  Trash2,
  Globe,
  MapPin,
  Eye,
  Info,
  BookOpen,
  Lightbulb,
  Megaphone,
  Search,
  MoreHorizontal,
  ChevronRight,
  ArrowRight,
  Edit3,
  Calendar as CalendarIcon,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { isFeatureEnabled } from '@/lib/feature-access';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { fetchBannerApi } from '@/lib/api-banner-client';

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
  ends_at: string | null;
  days_remaining: number | null;
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
  target_states?: string[];
  target_cities?: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  days_remaining?: number | null;
  performance: BannerPerformance;
  active_addons: ActiveAddon[];
  allowed_actions: string[];
  delivery_health?: {
    status: 'healthy' | 'blocked';
    blockers: string[];
    checks: Array<{ key: string; label: string; ok: boolean }>;
  };
};

type BannerQuota = {
  active_used: number;
  active_limit: number | null;
  active_remaining: number | null;
  can_activate: boolean;
  can_create_draft: boolean;
  can_create?: boolean; // legacy
  used?: number;
  limit?: number | null;
  remaining?: number | null;
};

type OperationalHealth = {
  status: 'healthy' | 'degraded' | 'stale' | 'unknown';
  last_aggregated_at?: string | null;
  lag_minutes?: number | null;
  reportable_events_24h: number;
  discarded_events_24h: number;
  discard_rate_24h?: number;
  discard_reasons_24h?: Record<string, number>;
  quality_history?: Array<{
    date: string;
    reportable_events: number;
    discarded_events: number;
    discard_rate: number;
  }>;
  incident_history?: Array<{
    date: string;
    type: 'discard_rate_high' | 'reconciliation_divergence' | 'aggregate_missing' | string;
    severity: 'warning' | 'critical' | string;
    value: number;
    affected_banners?: Array<{ id: number; title: string; event_count?: number }>;
  }>;
  divergent_banners_yesterday: number;
  checked_at?: string;
};

type ExportAudit = {
  id: number;
  actor_id?: number | null;
  format?: string;
  days?: string;
  incident_type?: string;
  banner_id?: string | null;
  record_count: number;
  created_at: string;
};

type ExportAlert = {
  id: number;
  status: string;
  count: number;
  threshold: number;
  window_hours: number;
  created_at: string;
};

type PlacementOption = {
  key: string;
  label?: string;
  status: 'active' | 'planned';
  dimensions: [number, number];
  commercial: string;
};

type DashboardPayload = {
  quota: BannerQuota;
  summary: BannerPerformance;
  operational_health?: OperationalHealth;
  placements?: PlacementOption[];
  banners: CompanyBanner[];
  time_series?: Array<{ day: string; impressions: number; clicks: number; leads?: number }>;
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

type ApiFailure = Error & { status?: number; details?: { code?: string } };
type ExportIncident = {
  date: string;
  type: string;
  severity: string;
  value: number;
  affected_banners?: Array<{ id: number; title: string; event_count?: number }>;
};
type ExportRow = {
  date: string;
  type: string;
  severity: string;
  value: number;
  banner_id: number | '';
  banner_title: string;
  event_count: number;
};

function downloadIncidentExport(incidents: ExportIncident[], format: 'csv' | 'json') {
  const rows: ExportRow[] = incidents.flatMap((incident): ExportRow[] =>
    incident.affected_banners?.length
      ? incident.affected_banners.map((banner) => ({
          date: incident.date,
          type: incident.type,
          severity: incident.severity,
          value: incident.value,
          banner_id: banner.id,
          banner_title: banner.title,
          event_count: banner.event_count ?? 0,
        }))
      : [
          {
            date: incident.date,
            type: incident.type,
            severity: incident.severity,
            value: incident.value,
            banner_id: '',
            banner_title: '',
            event_count: 0,
          },
        ]
  );
  const content =
    format === 'json'
      ? JSON.stringify(rows, null, 2)
      : [
          'date,type,severity,value,banner_id,banner_title,event_count',
          ...rows.map((row) =>
            Object.values(row as Record<string, string | number>)
              .map((value) => `"${String(value).replaceAll('\"', '\\"')}"`)
              .join(',')
          ),
        ].join('\n');
  const blob = new Blob([content], {
    type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `banner-incidentes-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  approved: 'Aprovado',
  draft: 'Rascunho',
  expired: 'Expirado',
  paused: 'Pausado',
  rejected: 'Rejeitado',
  scheduled: 'Agendado',
  submitted: 'Em análise',
};

export const ACTIVE_BANNER_POSITIONS = new Set([
  'home_top',
  'categories_top',
  'compare_hero',
  'compare_page_top',
  'compare_page_bottom',
  'companies_top',
  'company_profile_about_inline',
  'sidebar',
  'search_mid',
  'pricing_advertise_section',
]);

export const BANNER_POSITIONS = [
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
  const [chartDays, setChartDays] = useState<'7' | '30' | '90'>('30');

  const filteredTimeSeries = useMemo(() => {
    const series = data?.time_series ?? [];
    if (!series.length) return [];
    const latestDay = Math.max(...series.map((point) => new Date(point.day).getTime()));
    const cutoff = new Date(latestDay);
    cutoff.setDate(cutoff.getDate() - Number(chartDays) + 1);
    return series.filter((point) => new Date(point.day) >= cutoff);
  }, [chartDays, data?.time_series]);

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchBannerApi<DetailedPerformance>(
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
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Impressões</div>
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
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Qualidade do tracking
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {data.quality.reportable_events} reportáveis de {data.quality.total_events}{' '}
                      eventos
                    </p>
                  </div>
                  <Badge variant={data.quality.discarded_events > 0 ? 'secondary' : 'default'}>
                    {data.quality.discarded_events} descartados
                  </Badge>
                </div>
                {Object.keys(data.quality.discard_reasons).length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Motivos:{' '}
                    {Object.entries(data.quality.discard_reasons)
                      .map(([reason, count]) => `${reason} (${count})`)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}

            {data.breakdown?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Por posição
                </h4>
                <div className="grid gap-2">
                  {data.breakdown.map((row) => (
                    <div
                      key={row.placement}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold">{row.placement}</span>
                      <span className="text-slate-500">
                        {row.impressions} imp. · {row.clicks} cliques · {row.leads} leads ·{' '}
                        {row.ctr}% CTR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.context_breakdown?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Por página e posição
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {(data.context_breakdown ?? []).map((row) => (
                    <div
                      key={`${row.page_path}:${row.placement}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{row.page_path}</div>
                        <div className="truncate text-slate-500">{row.placement}</div>
                      </div>
                      <span className="shrink-0 text-slate-500">
                        {row.impressions} imp. · {row.clicks} cliques · {row.leads} leads
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Impressões ao longo do tempo
                </h4>
                <p className="text-xs text-slate-500">A série já carregada, sem novas consultas.</p>
              </div>
              <Select value={chartDays} onValueChange={(value) => setChartDays(value as '7' | '30' | '90')}>
                <SelectTrigger aria-label="Período do gráfico" className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Simple mini-chart representation */}
            {filteredTimeSeries.length > 0 && (
              <div
                role="img"
                aria-label={`Gráfico de impressões dos últimos ${filteredTimeSeries.length} dias`}
                className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 h-48 flex items-end justify-between gap-1"
              >
                {filteredTimeSeries.map((ts, i) => {
                  const max = Math.max(...filteredTimeSeries.map((t) => t.impressions)) || 1;
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
        const resp = await fetchBannerApi<{ banner_addons: BannerAddon[] }>('/banner_addons');
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
      const resp = await fetchBannerApi<BannerCheckoutResponse>(
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

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={doCheckout}
            disabled={submitting || loadingAddons || !selectedAddonId}
          >
            {submitting ? 'Gerando Checkout...' : 'Ir para Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const BRAZIL_UFS = [
  'SP', 'MG', 'RJ', 'PR', 'RS', 'SC', 'BA', 'GO', 'DF', 'ES',
  'PE', 'CE', 'MT', 'MS', 'PA', 'AM', 'MA', 'RN', 'PB', 'AL',
  'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'
] as const;

function BannerFormDialog({
  banner,
  trigger,
  onSaved,
  placements,
  companyId,
}: {
  banner?: CompanyBanner;
  trigger: ReactNode;
  onSaved: () => Promise<void>;
  placements?: PlacementOption[];
  companyId?: string;
}) {
  const [open, setOpen] = useState(false);
  const placementOptions = placements || [];
  const [title, setTitle] = useState(banner?.title || '');
  const [link, setLink] = useState(banner?.link_url || '');
  const [position, setPosition] = useState(banner?.position || 'home_top');
  const [bannerType, setBannerType] = useState(banner?.banner_type || 'rectangular_large');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(banner?.thumbnail_url || null);

  const initialScope = (banner?.target_cities && banner.target_cities.length > 0)
    ? 'cities'
    : (banner?.target_states && banner.target_states.length > 0)
      ? 'regional'
      : 'national';

  const [targetScope, setTargetScope] = useState<'national' | 'regional' | 'cities'>(initialScope);
  const [targetStates, setTargetStates] = useState<string[]>(banner?.target_states || []);
  const [targetCities, setTargetCities] = useState<string>((banner?.target_cities || []).join(', '));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(banner?.title || '');
      setLink(banner?.link_url || '');
      setPosition(banner?.position || 'home_top');
      setBannerType(banner?.banner_type || 'rectangular_large');
      setImage(null);
      setPreviewUrl(banner?.thumbnail_url || null);
      const scope = (banner?.target_cities && banner.target_cities.length > 0)
        ? 'cities'
        : (banner?.target_states && banner.target_states.length > 0)
          ? 'regional'
          : 'national';
      setTargetScope(scope);
      setTargetStates(banner?.target_states || []);
      setTargetCities((banner?.target_cities || []).join(', '));
      setError(null);
    }
  }, [open, banner]);

  const selectedPlacement = placementOptions.find((p) => p.key === position);
  const placementDims = selectedPlacement?.dimensions
    ? `${selectedPlacement.dimensions[0]}×${selectedPlacement.dimensions[1]} px`
    : null;

  const toggleState = (uf: string) => {
    setTargetStates((prev) =>
      prev.includes(uf) ? prev.filter((item) => item !== uf) : [...prev, uf]
    );
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(banner?.thumbnail_url || null);
    }
  };

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

    if (targetScope === 'national') {
      body.set('target_states', JSON.stringify([]));
      body.set('target_cities', JSON.stringify([]));
    } else if (targetScope === 'regional') {
      body.set('target_states', JSON.stringify(targetStates));
      body.set('target_cities', JSON.stringify([]));
    } else {
      body.set('target_states', JSON.stringify(targetStates));
      const citiesList = targetCities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      body.set('target_cities', JSON.stringify(citiesList));
    }

    try {
      const params = companyId ? { company_id: companyId } : undefined;
      await fetchBannerApi(`/company_dashboard/banners${banner ? `/${banner.id}` : ''}`, {
        method: banner ? 'PATCH' : 'POST',
        params,
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
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-h-[90dvh] sm:w-full sm:max-w-[620px] sm:p-6">
        <DialogHeader>
          <DialogTitle>{banner ? 'Editar banner' : 'Novo banner'}</DialogTitle>
          <DialogDescription>
            {banner
              ? 'Alterações voltam para rascunho e exigem nova moderação.'
              : 'Crie o anúncio gratuitamente como rascunho. O pagamento acontece somente ao escolher um pacote de promoção.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor={`banner-title-${banner?.id || 'new'}`}>Título da Campanha</Label>
            <Input
              id={`banner-title-${banner?.id || 'new'}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Promoção Inversores e Módulos Q4"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`banner-link-${banner?.id || 'new'}`}>Link de Destino (URL com UTM)</Label>
            <Input
              id={`banner-link-${banner?.id || 'new'}`}
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://suaempresa.com.br/oferta?utm_source=avaliasolar"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Posição / Zona do Anúncio</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger aria-label="Posição do banner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {placementOptions.map((placement) => {
                    const label = placement.label || placement.key.replaceAll('_', ' ');
                    const active = placement.status === 'active';
                    const dims = placement.dimensions ? `${placement.dimensions[0]}×${placement.dimensions[1]} px` : '';
                    return (
                      <SelectItem key={placement.key} value={placement.key} disabled={!active}>
                        {active ? `${label} (${dims})` : `${label} (Em breve)`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {placementDims && (
                <p className="text-[11px] font-semibold text-brand-blue">
                  Dimensão recomendada: {placementDims}
                </p>
              )}
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

          {/* Geographic Targeting Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-blue" />
                Alcance Geográfico (Segmentação)
              </Label>
              <span className="text-[11px] text-slate-400">Onde seu banner será exibido</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTargetScope('national')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  targetScope === 'national'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-blue font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Brasil Inteiro
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('regional')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  targetScope === 'regional'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-blue font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Por Estados (UF)
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('cities')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  targetScope === 'cities'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-blue font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cidades
              </button>
            </div>

            {targetScope === 'national' && (
              <p className="text-xs text-slate-500 leading-relaxed">
                Seu anúncio será veiculado para visitantes de todo o território nacional que acessarem as zonas selecionadas.
              </p>
            )}

            {(targetScope === 'regional' || targetScope === 'cities') && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Selecione os Estados ({targetStates.length} selecionados):
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetStates(['SP', 'MG', 'RJ', 'ES'])}
                      className="text-[10px] text-brand-blue font-semibold hover:underline"
                    >
                      + Sudeste
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetStates(['PR', 'SC', 'RS'])}
                      className="text-[10px] text-brand-blue font-semibold hover:underline"
                    >
                      + Sul
                    </button>
                    {targetStates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetStates([])}
                        className="text-[10px] text-destructive font-semibold hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {BRAZIL_UFS.map((uf) => {
                    const selected = targetStates.includes(uf);
                    return (
                      <button
                        key={uf}
                        type="button"
                        onClick={() => toggleState(uf)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                          selected
                            ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-blue'
                        }`}
                      >
                        {uf}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {targetScope === 'cities' && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Label htmlFor="target-cities-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-blue" />
                  Cidades Alvo (separadas por vírgula)
                </Label>
                <Input
                  id="target-cities-input"
                  value={targetCities}
                  onChange={(e) => setTargetCities(e.target.value)}
                  placeholder="Ex: Campinas, Ribeirão Preto, Sorocaba, São José dos Campos"
                  className="text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Deixe vazio para cobrir todos os municípios dos estados selecionados acima.
                </p>
              </div>
            )}
          </div>

          {/* Creative Image */}
          <div className="space-y-2">
            <Label htmlFor={`banner-image-${banner?.id || 'new'}`}>
              Imagem do Banner {banner ? '(opcional se mantiver atual)' : ''}
            </Label>
            <Input
              id={`banner-image-${banner?.id || 'new'}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleImageChange(event.target.files?.[0] || null)}
              required={!banner}
            />
            <p className="text-xs text-slate-500">Formatos aceitos: PNG, JPEG ou WebP. Máximo 5 MB.</p>

            {previewUrl && (
              <div className="mt-3 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Pré-visualização do Criativo:
                </p>
                <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <Image
                    src={previewUrl}
                    alt="Preview do banner"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={save} disabled={submitting}>
            {submitting ? 'Salvando...' : banner ? 'Salvar alterações' : 'Criar rascunho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: 'Ativa',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  },
  scheduled: {
    label: 'Agendada',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
  },
  paused: {
    label: 'Pausada',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  },
  submitted: {
    label: 'Em Revisão',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800',
  },
  draft: {
    label: 'Rascunho',
    className:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  rejected: {
    label: 'Rejeitada',
    className:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800',
  },
  expired: {
    label: 'Finalizada',
    className:
      'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800',
  },
};

function formatCampaignPeriod(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt && !endsAt) return 'Contínuo';
  const start = startsAt
    ? new Date(startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : 'Início';
  const end = endsAt
    ? new Date(endsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : 'Contínuo';
  return `${start} - ${end}`;
}

function formatCampaignLocation(banner: CompanyBanner) {
  if (banner.target_cities && banner.target_cities.length > 0) {
    const states =
      banner.target_states && banner.target_states.length > 0
        ? `${banner.target_states.join(', ')} • `
        : '';
    return `${states}${banner.target_cities.slice(0, 2).join(', ')}${
      banner.target_cities.length > 2 ? ` (+${banner.target_cities.length - 2})` : ''
    }`;
  }
  if (banner.target_states && banner.target_states.length > 0) {
    return banner.target_states.join(', ');
  }
  return 'Brasil Inteiro (Nacional)';
}

function QuickGuideDialog({ trigger }: { trigger: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-blue" />
            Guia rápido de campanhas
          </DialogTitle>
          <DialogDescription>
            Boas práticas para aproveitar ao máximo o Avalia Solar Ads.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <h5 className="font-semibold text-slate-900 dark:text-white mb-1">
              1. Proposta de valor clara
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Destaque seu principal diferencial competitivo nos primeiros 3 segundos de leitura.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <h5 className="font-semibold text-slate-900 dark:text-white mb-1">
              2. Segmentação geográfica assertiva
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Se você atua em estados ou cidades específicas, configure o alcance regional para não dispersar impressões.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <h5 className="font-semibold text-slate-900 dark:text-white mb-1">
              3. Acompanhe a entrega e otimize
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Revise CTR e leads gerados semanalmente. Pause ou ajuste criativos com baixa conversão.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" size="sm">
              Fechar
            </Button>
          </DialogClose>
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
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [incidentDays, setIncidentDays] = useState<'3' | '7'>('7');
  const [incidentType, setIncidentType] = useState('all');
  const [incidentBanner, setIncidentBanner] = useState('all');
  const [exportAudits, setExportAudits] = useState<ExportAudit[]>([]);
  const [exportAuditsOpen, setExportAuditsOpen] = useState(false);
  const [exportAuditsLoading, setExportAuditsLoading] = useState(false);
  const [exportAlerts, setExportAlerts] = useState<ExportAlert[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!allowed) return;

    setLoading(true);
    setError(null);
    try {
      const params = companyId ? { company_id: companyId } : undefined;
      const [resp, alerts] = await Promise.all([
        fetchBannerApi<DashboardPayload>('/company_dashboard/banners', { params }),
        fetchBannerApi<{ alerts?: ExportAlert[] }>('/company_dashboard/banners/export_alerts', { params }),
      ]);
      setData(resp);
      setExportAlerts(alerts.alerts ?? []);
    } catch (e: unknown) {
      const failure = e as ApiFailure;
      if (failure.status === 403) {
        const code = failure.details?.code;
        setError(code === 'FEATURE_DISABLED' ? 'Banner não habilitado no plano da empresa.' : code === 'POLICY_FORBIDDEN' ? 'Você pode consultar banners, mas não pode alterá-los.' : 'Acesso restrito: verifique plano e permissão da empresa.');
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

  const incidentOptions = useMemo(() => {
    const incidents = data?.operational_health?.incident_history ?? [];
    return Array.from(
      new Map(
        incidents.flatMap((incident) =>
          (incident.affected_banners ?? []).map((banner) => [String(banner.id), banner.title])
        )
      ).entries()
    );
  }, [data?.operational_health?.incident_history]);

  const filteredIncidentHistory = useMemo(() => {
    const incidents = data?.operational_health?.incident_history ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(incidentDays));
    return incidents.filter((incident) => {
      const inPeriod = new Date(`${incident.date}T23:59:59`) >= cutoff;
      const inType = incidentType === 'all' || incident.type === incidentType;
      const inBanner =
        incidentBanner === 'all' ||
        (incident.affected_banners ?? []).some((banner) => String(banner.id) === incidentBanner);
      return inPeriod && inType && inBanner;
    });
  }, [data?.operational_health?.incident_history, incidentBanner, incidentDays, incidentType]);

  const acknowledgeExportAlert = async (alertId: number) => {
    try {
      await fetchBannerApi(`/company_dashboard/banners/${alertId}/acknowledge_export_alert`, {
        method: 'PATCH',
      });
      await loadData();
    } catch (e: unknown) {
      setActionError(errorMessage(e, 'Não foi possível reconhecer o alerta.'));
    }
  };

  const loadExportAudits = async () => {
    setExportAuditsLoading(true);
    try {
      const response = await fetchBannerApi<{ audits: ExportAudit[] }>(
        '/company_dashboard/banners/export_audits'
      );
      setExportAudits(response.audits ?? []);
      setExportAuditsOpen(true);
    } catch (e: unknown) {
      setActionError(errorMessage(e, 'Histórico indisponível para este usuário.'));
    } finally {
      setExportAuditsLoading(false);
    }
  };

  const runAction = async (
    banner: CompanyBanner,
    action: 'submit' | 'pause' | 'resume' | 'delete'
  ) => {
    if (action === 'delete' && !window.confirm(`Excluir o banner “${banner.title}”?`)) return;

    setActionBannerId(banner.id);
    setActionError(null);
    try {
      await fetchBannerApi(
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

  const exportFilteredIncidents = async (format: 'csv' | 'json') => {
    await fetchBannerApi('/company_dashboard/banners/export_audit', {
      method: 'POST',
      body: {
        format,
        days: incidentDays,
        incident_type: incidentType,
        banner_id: incidentBanner === 'all' ? null : incidentBanner,
        record_count: filteredIncidentHistory.length,
      },
    });
    downloadIncidentExport(filteredIncidentHistory, format);
  };

  const [chartPeriod, setChartPeriod] = useState<'7' | '30' | '90'>('30');

  const featuredCampaign = useMemo(() => {
    if (!data?.banners || data.banners.length === 0) return null;
    return (
      data.banners.find((b) => b.operational_status === 'active') ||
      data.banners.find((b) => b.operational_status === 'scheduled') ||
      data.banners[0] ||
      null
    );
  }, [data?.banners]);

  const filteredBanners = useMemo(() => {
    if (!data?.banners) return [];
    return data.banners.filter((banner) => {
      const matchesStatus =
        statusFilter === 'all' || banner.operational_status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const titleMatch = banner.title.toLowerCase().includes(query);
      const positionMatch = banner.position.toLowerCase().includes(query);
      const statesMatch = (banner.target_states ?? []).some((s) =>
        s.toLowerCase().includes(query)
      );
      const citiesMatch = (banner.target_cities ?? []).some((c) =>
        c.toLowerCase().includes(query)
      );
      return titleMatch || positionMatch || statesMatch || citiesMatch;
    });
  }, [data?.banners, searchQuery, statusFilter]);

  const filteredTimeSeries = useMemo(() => {
    const series = data?.time_series ?? [];
    if (!series.length) return [];
    const latestDay = Math.max(...series.map((point) => new Date(point.day).getTime()));
    const cutoff = new Date(latestDay);
    cutoff.setDate(cutoff.getDate() - Number(chartPeriod) + 1);
    return series.filter((point) => new Date(point.day) >= cutoff);
  }, [chartPeriod, data?.time_series]);

  const quota = useMemo(() => {
    if (!data?.quota) return null;
    const used = data.quota.active_used ?? data.quota.used ?? 0;
    const limit = data.quota.active_limit ?? data.quota.limit ?? null;
    const remaining =
      data.quota.active_remaining ??
      data.quota.remaining ??
      (limit !== null ? Math.max(0, limit - used) : null);
    const canActivate = data.quota.can_activate ?? (limit === null || used < limit);
    const canCreate = data.quota.can_create_draft ?? data.quota.can_create ?? true;
    const percent = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return { used, limit, remaining, canActivate, canCreate, percent };
  }, [data?.quota]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="h-16 w-16 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Recurso Bloqueado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6">
            Faça upgrade para plano com Avalia Solar Ads e libere banners patrocinados.
          </p>
          <Button
            type="button"
            className="h-10 px-5 rounded-lg bg-brand-blue hover:bg-blue-600 text-white font-medium text-sm shadow-xs transition-all active:scale-[0.98]"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'product-pricing');
              window.location.href = url.toString();
            }}
          >
            Conhecer Planos e Assinaturas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="space-y-1">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Layers className="h-3.5 w-3.5 text-brand-blue" />
            Divulgação
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-semibold">Campanhas Patrocinadas</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Campanhas Patrocinadas
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Sobre Campanhas Patrocinadas"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Posicionamento patrocinado nos resultados de busca, catálogo de integradores e simulador solar.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie suas campanhas patrocinadas e acompanhe os resultados em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Seletor do Período do gráfico - para E2E e alinhamento visual */}
            <Select value={chartPeriod} onValueChange={(val) => setChartPeriod(val as '7' | '30' | '90')}>
              <SelectTrigger aria-label="Período do gráfico" className="h-9 sm:h-10 text-xs px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <BannerFormDialog
              placements={data?.placements}
              companyId={companyId}
              onSaved={loadData}
              trigger={
                <Button
                  disabled={quota ? !quota.canCreate : false}
                  className="h-9 sm:h-10 px-4 rounded-lg bg-brand-blue hover:bg-blue-600 text-white font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nova campanha
                </Button>
              }
            />

            <QuickGuideDialog
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 sm:h-10 px-3.5 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
                >
                  <BookOpen className="h-4 w-4 mr-1.5 text-slate-500" />
                  Guia rápido
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 p-5">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertTitle className="text-sm font-bold">Falha ao carregar campanhas</AlertTitle>
          <AlertDescription className="text-xs mt-1 text-rose-800 dark:text-rose-400">
            {error}
          </AlertDescription>
          <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={loadData}>
            Tentar novamente
          </Button>
        </Alert>
      ) : data ? (
        <>
          {actionError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-brand-blue shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
                    Impressões
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {data.summary.impressions.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <MousePointer className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
                    Cliques (CTR)
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                      {data.summary.clicks.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      ({data.summary.ctr}%)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
                    Leads
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {data.summary.leads.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
                    CTR
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {data.summary.ctr}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main 2-Column Cockpit Layout (8 cols / 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda - 8 colunas */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              {/* Card Spotlight: Campanha em Destaque */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Campanha em destaque
                  </h3>
                  {featuredCampaign && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Opções da campanha em destaque</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PerformanceDialog
                          banner={featuredCampaign}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <BarChart3 className="h-3.5 w-3.5 mr-2 text-brand-blue" />
                              Ver performance
                            </DropdownMenuItem>
                          }
                        />
                        {featuredCampaign.allowed_actions.includes('edit') && (
                          <BannerFormDialog
                            banner={featuredCampaign}
                            placements={data.placements}
                            companyId={companyId}
                            onSaved={loadData}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Editar campanha
                              </DropdownMenuItem>
                            }
                          />
                        )}
                        {featuredCampaign.allowed_actions.includes('buy_addon') && (
                          <AddonCheckoutDialog
                            banner={featuredCampaign}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Impulsionar
                              </DropdownMenuItem>
                            }
                          />
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {featuredCampaign ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    {/* Imagem do Banner */}
                    <div className="sm:col-span-4 relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800">
                      {featuredCampaign.thumbnail_url ? (
                        <Image
                          src={featuredCampaign.thumbnail_url}
                          alt={featuredCampaign.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 250px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <Eye className="h-6 w-6 mb-1 opacity-50" />
                          <span className="text-[10px] font-medium">Criativo da Campanha</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium px-2 py-0.5 border ${
                            STATUS_CONFIG[featuredCampaign.operational_status]?.className ?? 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {STATUS_CONFIG[featuredCampaign.operational_status]?.label ?? featuredCampaign.operational_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Detalhes Centrais */}
                    <div className="sm:col-span-5 space-y-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {featuredCampaign.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {formatCampaignPeriod(featuredCampaign.starts_at, featuredCampaign.ends_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          {featuredCampaign.target_cities?.length || featuredCampaign.target_states?.length ? (
                            <MapPin className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                          ) : (
                            <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[160px]">{formatCampaignLocation(featuredCampaign)}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        Divulgue sua marca para clientes e integradores que buscam soluções em energia solar.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        {featuredCampaign.days_remaining != null && featuredCampaign.days_remaining > 0 && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {featuredCampaign.days_remaining} dias restantes
                          </span>
                        )}
                        <PerformanceDialog
                          banner={featuredCampaign}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold text-brand-blue hover:text-blue-700 p-0 hover:bg-transparent"
                            >
                              Ver detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    {/* Métricas Compactas à Direita */}
                    <div className="sm:col-span-3 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Impressões</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {featuredCampaign.performance.impressions.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Cliques (CTR)</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {featuredCampaign.performance.clicks}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            ({featuredCampaign.performance.ctr}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Leads</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {featuredCampaign.performance.leads}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">CPL</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {featuredCampaign.performance.leads > 0
                            ? formatMoney((featuredCampaign.performance.investment_cents ?? 0) / featuredCampaign.performance.leads)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Nenhuma campanha ativa no momento.{' '}
                    {quota?.canCreate && (
                      <span className="text-brand-blue font-medium cursor-pointer">
                        Crie uma nova campanha acima.
                      </span>
                    )}
                  </div>
                )}
              </Card>

              {/* Tabela Datatable: Minhas Campanhas */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Minhas campanhas
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Acompanhe o desempenho de todas as suas campanhas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-44 sm:w-56">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Buscar campanha..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs w-[130px] rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="all">Todas as campanhas</SelectItem>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="scheduled">Agendadas</SelectItem>
                        <SelectItem value="paused">Pausadas</SelectItem>
                        <SelectItem value="draft">Rascunhos</SelectItem>
                        <SelectItem value="submitted">Em Revisão</SelectItem>
                        <SelectItem value="rejected">Rejeitadas</SelectItem>
                        <SelectItem value="expired">Finalizadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredBanners.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Nenhum anúncio encontrado para os filtros selecionados.
                  </div>
                ) : (
                  <>
                    {/* Visualização Desktop (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                            <TableHead className="w-[30%]">Nome da campanha</TableHead>
                            <TableHead className="w-[18%]">Período</TableHead>
                            <TableHead className="w-[12%]">Status</TableHead>
                            <TableHead className="w-[12%] text-right">Impressões</TableHead>
                            <TableHead className="w-[14%] text-right">Cliques (CTR)</TableHead>
                            <TableHead className="w-[8%] text-right">Leads</TableHead>
                            <TableHead className="w-[6%] text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBanners.map((banner) => (
                            <TableRow
                              key={banner.id}
                              className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-12 rounded bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700">
                                    {banner.thumbnail_url ? (
                                      <Image
                                        src={banner.thumbnail_url}
                                        alt={banner.title}
                                        fill
                                        unoptimized
                                        sizes="48px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Eye className="h-3.5 w-3.5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[200px]">
                                      {banner.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                                      {banner.target_cities?.length || banner.target_states?.length ? (
                                        <MapPin className="h-3 w-3 text-brand-blue shrink-0" />
                                      ) : (
                                        <Globe className="h-3 w-3 text-emerald-600 shrink-0" />
                                      )}
                                      <span className="truncate">{formatCampaignLocation(banner)}</span>
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                                {formatCampaignPeriod(banner.starts_at, banner.ends_at)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-medium border ${
                                    STATUS_CONFIG[banner.operational_status]?.className ?? 'bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {STATUS_CONFIG[banner.operational_status]?.label ?? banner.operational_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium text-slate-900 dark:text-white tabular-nums">
                                {banner.performance.impressions.toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium text-slate-900 dark:text-white tabular-nums">
                                {banner.performance.clicks}{' '}
                                <span className="text-[11px] font-normal text-slate-400">
                                  ({banner.performance.ctr}%)
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium text-slate-900 dark:text-white tabular-nums">
                                {banner.performance.leads}
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Ações da campanha ${banner.title}`}
                                      className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 text-xs">
                                    <PerformanceDialog
                                      banner={banner}
                                      trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <BarChart3 className="h-3.5 w-3.5 mr-2 text-brand-blue" />
                                          Ver performance
                                        </DropdownMenuItem>
                                      }
                                    />
                                    {banner.allowed_actions.includes('edit') && (
                                      <BannerFormDialog
                                        banner={banner}
                                        placements={data.placements}
                                        companyId={companyId}
                                        onSaved={loadData}
                                        trigger={
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Edit3 className="h-3.5 w-3.5 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                        }
                                      />
                                    )}
                                    {banner.allowed_actions.includes('buy_addon') && (
                                      <AddonCheckoutDialog
                                        banner={banner}
                                        trigger={
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                            Impulsionar
                                          </DropdownMenuItem>
                                        }
                                      />
                                    )}
                                    {banner.allowed_actions.includes('submit') && (
                                      <DropdownMenuItem
                                        disabled={actionBannerId === banner.id}
                                        onClick={() => runAction(banner, 'submit')}
                                      >
                                        <Send className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                        Enviar para moderação
                                      </DropdownMenuItem>
                                    )}
                                    {banner.allowed_actions.includes('pause') && (
                                      <DropdownMenuItem
                                        disabled={actionBannerId === banner.id}
                                        onClick={() => runAction(banner, 'pause')}
                                      >
                                        <Pause className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                        Pausar veiculação
                                      </DropdownMenuItem>
                                    )}
                                    {banner.allowed_actions.includes('resume') && (
                                      <DropdownMenuItem
                                        disabled={actionBannerId === banner.id}
                                        onClick={() => runAction(banner, 'resume')}
                                      >
                                        <Play className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                        Retomar veiculação
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => {
                                        window.open(
                                          `/api/v1/company_dashboard/banners/${banner.id}/export.csv`,
                                          '_blank',
                                          'noopener,noreferrer'
                                        );
                                      }}
                                    >
                                      <Download className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                      Exportar CSV
                                    </DropdownMenuItem>
                                    {banner.allowed_actions.includes('delete') && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-rose-600 focus:text-rose-600 dark:text-rose-400"
                                          disabled={actionBannerId === banner.id}
                                          onClick={() => runAction(banner, 'delete')}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                                          Excluir campanha
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Visualização Mobile (Card List) */}
                    <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBanners.map((banner) => (
                        <div key={banner.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-10 w-14 rounded bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0 border border-slate-200/50">
                                {banner.thumbnail_url ? (
                                  <Image
                                    src={banner.thumbnail_url}
                                    alt={banner.title}
                                    fill
                                    unoptimized
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Eye className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                  {banner.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {formatCampaignLocation(banner)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-medium shrink-0 ${
                                STATUS_CONFIG[banner.operational_status]?.className ?? 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              {STATUS_CONFIG[banner.operational_status]?.label ?? banner.operational_status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Impressões</span>
                              <span className="font-bold tabular-nums">
                                {banner.performance.impressions}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Cliques</span>
                              <span className="font-bold tabular-nums">
                                {banner.performance.clicks} ({banner.performance.ctr}%)
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Leads</span>
                              <span className="font-bold tabular-nums">{banner.performance.leads}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400">
                              {formatCampaignPeriod(banner.starts_at, banner.ends_at)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <PerformanceDialog
                                banner={banner}
                                trigger={
                                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                                    Performance
                                  </Button>
                                }
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                  {banner.allowed_actions.includes('edit') && (
                                    <BannerFormDialog
                                      banner={banner}
                                      placements={data.placements}
                                      companyId={companyId}
                                      onSaved={loadData}
                                      trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <Edit3 className="h-3.5 w-3.5 mr-2" />
                                          Editar
                                        </DropdownMenuItem>
                                      }
                                    />
                                  )}
                                  {banner.allowed_actions.includes('buy_addon') && (
                                    <AddonCheckoutDialog
                                      banner={banner}
                                      trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                          Impulsionar
                                        </DropdownMenuItem>
                                      }
                                    />
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      window.open(
                                        `/api/v1/company_dashboard/banners/${banner.id}/export.csv`,
                                        '_blank',
                                        'noopener,noreferrer'
                                      );
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5 mr-2" />
                                    Exportar CSV
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              {/* Informative Growth Banner */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Info className="h-4 w-4 text-brand-blue shrink-0" />
                  <span>
                    Seus anúncios serão exibidos para empresas que demonstraram interesse em energia solar, com base em localização, categoria e comportamento de navegação.
                  </span>
                </div>
                <QuickGuideDialog
                  trigger={
                    <button
                      type="button"
                      className="font-semibold text-brand-blue hover:text-blue-700 dark:hover:text-blue-400 shrink-0"
                    >
                      Entender como funciona →
                    </button>
                  }
                />
              </div>

              {/* Seção Retrátil: Análise Avançada & Diagnóstico Técnico */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Análise avançada & Diagnóstico
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Funil de conversão completo e telemetria operacional de entrega.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="h-8 text-xs font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {showDiagnostics ? "Ocultar Diagnóstico Técnico" : "Ver Diagnóstico Técnico"}
                  </Button>
                </div>

                {/* Funil de Campanha */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-brand-blue" />
                      Funil de campanha
                    </span>
                    {data.summary.clicks > 0 && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        Conversão clique para lead: <strong className="text-slate-700 dark:text-slate-200">{((data.summary.leads / data.summary.clicks) * 100).toFixed(2)}%</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Impressões</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                        {data.summary.impressions.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliques</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                        {data.summary.clicks.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Leads</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                        {data.summary.leads.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">CTR Médio</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                        {data.summary.ctr}%
                      </span>
                    </div>
                  </div>

                  {filteredTimeSeries.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-slate-500">Impressões diárias no período</span>
                        <span className="text-[11px] font-semibold text-brand-blue tabular-nums">
                          {filteredTimeSeries.reduce((acc, p) => acc + p.impressions, 0).toLocaleString('pt-BR')} total
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`Gráfico de impressões dos últimos ${filteredTimeSeries.length} dias`}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 h-24 flex items-end justify-between gap-1"
                      >
                        {filteredTimeSeries.map((ts, i) => {
                          const max = Math.max(...filteredTimeSeries.map((t) => t.impressions)) || 1;
                          const height = (ts.impressions / max) * 100;
                          return (
                            <div
                              key={i}
                              tabIndex={0}
                              aria-label={`${new Date(ts.day).toLocaleDateString('pt-BR')}: ${ts.impressions} impressões`}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              <div
                                className="w-full bg-brand-blue/80 hover:bg-brand-blue rounded-t transition-all"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              />
                              <span className="text-[9px] text-slate-400 mt-1 truncate">
                                {ts.day.slice(8)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnóstico Técnico Expandido */}
                {showDiagnostics && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {exportAlerts.filter((alert) => alert.status === 'open').length > 0 && (
                      <div
                        role="status"
                        data-testid="banner-export-alerts"
                        className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <strong>Atenção operacional:</strong> foram detectadas exportações acima do limiar configurado ({exportAlerts.filter((alert) => alert.status === 'open')[0].count} em 24h).
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() =>
                            acknowledgeExportAlert(
                              exportAlerts.filter((alert) => alert.status === 'open')[0].id
                            )
                          }
                        >
                          Marcar como visto
                        </Button>
                      </div>
                    )}

                    {(() => {
                      const health = data.operational_health;
                      const labels = {
                        healthy: ['Operação normal', 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'],
                        degraded: ['Qualidade degradada', 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'],
                        stale: ['Dados atrasados', 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'],
                        unknown: ['Aguardando dados', 'border-slate-200 bg-slate-50 text-slate-700 dark:text-slate-300'],
                      } as const;
                      const [label, tone] = labels[health?.status ?? 'unknown'];
                      const discardRate = health?.discard_rate_24h ?? 0;
                      const topDiscardReason = Object.entries(health?.discard_reasons_24h ?? {}).sort(
                        ([, a], [, b]) => b - a
                      )[0];
                      return (
                        <div className={`p-4 rounded-xl border ${tone}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <Activity className="h-5 w-5" />
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider">
                                  Saúde da medição
                                </p>
                                <p className="text-sm font-bold">{label}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-1 text-xs">
                              <span>Eventos válidos 24h: <strong>{health?.reportable_events_24h ?? 0}</strong></span>
                              <span>Descartados: <strong>{health?.discarded_events_24h ?? 0}</strong></span>
                              <span>Taxa: <strong>{discardRate.toFixed(2)}%</strong></span>
                              <span>Atraso: <strong>{health?.lag_minutes == null ? 'n/d' : `${health.lag_minutes} min`}</strong></span>
                              <span>Divergências: <strong>{health?.divergent_banners_yesterday ?? 0}</strong></span>
                              <span>Motivo principal: <strong>{topDiscardReason ? `${topDiscardReason[0]} (${topDiscardReason[1]})` : 'n/d'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Qualidade 7 dias */}
                    {data.operational_health?.quality_history?.length ? (
                      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Qualidade nos últimos 7 dias
                            </p>
                            <p className="text-[11px] text-slate-500">Eventos válidos x descartados</p>
                          </div>
                          <Activity className="h-4 w-4 text-brand-blue" />
                        </div>
                        <div className="grid grid-cols-7 gap-2" data-testid="banner-quality-history">
                          {data.operational_health.quality_history.map((day) => {
                            const total = day.reportable_events + day.discarded_events;
                            const validWidth = total ? (day.reportable_events / total) * 100 : 0;
                            return (
                              <div key={day.date} className="min-w-0" title={`${day.date}: ${day.discard_rate}% descartados`}>
                                <div className="flex h-14 flex-col justify-end overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                  <div className="bg-rose-400" style={{ height: `${100 - validWidth}%` }} />
                                  <div className="bg-emerald-400" style={{ height: `${validWidth}%` }} />
                                </div>
                                <p className="mt-1 truncate text-center text-[10px] text-slate-500">{day.date.slice(5)}</p>
                                <p className="text-center text-[10px] font-bold text-slate-700 dark:text-slate-300">{day.discard_rate.toFixed(1)}%</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Incidentes Recentes */}
                    {data.operational_health?.incident_history?.length ? (
                      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Incidentes recentes</p>
                            <p className="text-[11px] text-slate-500">Sinais para investigação operacional</p>
                          </div>
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="mb-3 grid gap-2 sm:grid-cols-3">
                          <select
                            aria-label="Período dos incidentes"
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                            value={incidentDays}
                            onChange={(e) => setIncidentDays(e.target.value as '3' | '7')}
                          >
                            <option value="7">Últimos 7 dias</option>
                            <option value="3">Últimos 3 dias</option>
                          </select>
                          <select
                            aria-label="Tipo de incidente"
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                            value={incidentType}
                            onChange={(e) => setIncidentType(e.target.value)}
                          >
                            <option value="all">Todos os tipos</option>
                            <option value="discard_rate_high">Descarte alto</option>
                            <option value="reconciliation_divergence">Divergência</option>
                            <option value="aggregate_missing">Agregado ausente</option>
                          </select>
                          <select
                            aria-label="Banner afetado"
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                            value={incidentBanner}
                            onChange={(e) => setIncidentBanner(e.target.value)}
                          >
                            <option value="all">Todos os banners</option>
                            {incidentOptions.map(([id, title]) => (
                              <option key={id} value={id}>
                                {title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => exportFilteredIncidents('csv')}
                            disabled={filteredIncidentHistory.length === 0}
                          >
                            <Download className="mr-1.5 h-3 w-3" /> Exportar CSV
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => exportFilteredIncidents('json')}
                            disabled={filteredIncidentHistory.length === 0}
                          >
                            <Download className="mr-1.5 h-3 w-3" /> Exportar JSON
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={loadExportAudits}
                            disabled={exportAuditsLoading}
                          >
                            <Activity className="mr-1.5 h-3 w-3" />
                            {exportAuditsLoading ? 'Carregando histórico…' : 'Histórico de exportações'}
                          </Button>
                        </div>

                        {exportAuditsOpen && (
                          <div className="mb-3 rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-xs" data-testid="banner-export-audit-history">
                            <p className="mb-1 font-bold text-[10px] uppercase text-slate-500">Downloads auditados</p>
                            {exportAudits.length ? (
                              exportAudits.map((audit) => (
                                <div key={audit.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0 text-[11px]">
                                  <span>{audit.format?.toUpperCase()} · {audit.record_count} incidentes</span>
                                  <time dateTime={audit.created_at}>{new Date(audit.created_at).toLocaleString('pt-BR')}</time>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-400">Nenhuma exportação registrada.</p>
                            )}
                          </div>
                        )}

                        <ol className="space-y-1.5" data-testid="banner-incident-history">
                          {filteredIncidentHistory.slice(-5).reverse().map((incident, index) => {
                            const label =
                              incident.type === 'discard_rate_high'
                                ? 'Taxa de descarte alta'
                                : incident.type === 'reconciliation_divergence'
                                  ? 'Divergência de reconciliação'
                                  : 'Agregado ausente';
                            return (
                              <li key={`${incident.date}-${incident.type}-${index}`} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                                <button
                                  type="button"
                                  className="w-full flex items-center justify-between text-left font-medium"
                                  onClick={() =>
                                    setExpandedIncident(
                                      expandedIncident === `${incident.date}-${incident.type}`
                                        ? null
                                        : `${incident.date}-${incident.type}`
                                    )
                                  }
                                >
                                  <span>{label}</span>
                                  <span className="text-slate-400 text-[11px]">{incident.date} · {incident.value}</span>
                                </button>
                                {expandedIncident === `${incident.date}-${incident.type}` && (
                                  <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                                    {incident.affected_banners?.length
                                      ? incident.affected_banners.map((b) => (
                                          <div key={b.id}>{b.title} {b.event_count ? `(${b.event_count} eventos)` : ''}</div>
                                        ))
                                      : 'Nenhum banner identificado'}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            </div>

            {/* Coluna Direita - 4 colunas (Sidebar / Rail) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Widget: Dica de Boas Práticas */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-brand-blue shrink-0">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Dica de boas práticas
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Mantenha o conteúdo da sua campanha sempre atualizado e com uma proposta de valor clara. Isso aumenta o engajamento e melhora o CTR.
                    </p>
                    <QuickGuideDialog
                      trigger={
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand-blue hover:text-blue-700 dark:hover:text-blue-400 block pt-1"
                        >
                          Ver guia completo →
                        </button>
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Widget: Seu Plano & Quota */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-blue" />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Seu plano
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold text-brand-blue border-brand-blue/30 bg-blue-50/50 dark:bg-blue-950/40">
                    {quota?.canActivate ? 'Plano Ativo' : 'Limite Atingido'}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Quota de campanhas
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {quota?.limit === null
                      ? 'Campanhas ilimitadas disponíveis no plano'
                      : `Você pode criar até ${quota?.limit} campanhas ativas simultaneamente.`}
                  </p>
                </div>

                {quota && (
                  <div className="space-y-1.5 pt-1">
                    <Progress value={quota.percent} className="h-2 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                      <span>{quota.used} de {quota.limit ?? '∞'} usadas</span>
                      <span className="font-semibold text-brand-blue">{quota.remaining ?? '∞'} restantes</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold border-slate-200 dark:border-slate-800 mt-2"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'product-pricing');
                    window.location.href = url.toString();
                  }}
                >
                  Gerenciar plano →
                </Button>
              </Card>

              {/* Widget: Seus Anúncios (Ações Rápidas) */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-brand-blue" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Seus anúncios
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualize, edite e gerencie seus anúncios patrocinados.
                </p>

                {featuredCampaign && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="h-10 w-14 rounded bg-slate-200 dark:bg-slate-700 relative overflow-hidden shrink-0">
                      {featuredCampaign.thumbnail_url ? (
                        <Image
                          src={featuredCampaign.thumbnail_url}
                          alt={featuredCampaign.title}
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {featuredCampaign.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formatCampaignLocation(featuredCampaign)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {featuredCampaign && featuredCampaign.allowed_actions.includes('edit') ? (
                    <BannerFormDialog
                      banner={featuredCampaign}
                      placements={data.placements}
                      companyId={companyId}
                      onSaved={loadData}
                      trigger={
                        <Button className="h-8 text-xs font-medium bg-brand-blue hover:bg-blue-600 text-white">
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      }
                    />
                  ) : (
                    <BannerFormDialog
                      placements={data.placements}
                      companyId={companyId}
                      onSaved={loadData}
                      trigger={
                        <Button
                          disabled={quota ? !quota.canCreate : false}
                          className="h-8 text-xs font-medium bg-brand-blue hover:bg-blue-600 text-white"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Criar
                        </Button>
                      }
                    />
                  )}

                  <Button
                    variant="outline"
                    className="h-8 text-xs font-medium border-slate-200 dark:border-slate-800"
                    onClick={() => {
                      if (featuredCampaign) {
                        window.open(
                          `/api/v1/company_dashboard/banners/${featuredCampaign.id}/export.csv`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      } else {
                        window.open(
                          `/api/v1/company_dashboard/banners`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exportar CSV
                  </Button>
                </div>
              </Card>

              {/* Widget: Saúde da Medição (Status Compacto) */}
              <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Saúde da medição
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                    Operação normal
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    Eventos válidos 24h: <strong className="text-slate-700 dark:text-slate-300">{data.operational_health?.reportable_events_24h ?? 0}</strong>
                  </p>
                  <p>
                    Atraso na fila: <strong className="text-slate-700 dark:text-slate-300">{data.operational_health?.lag_minutes ?? 0} min</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs font-semibold text-brand-blue hover:text-blue-700 p-0"
                  onClick={() => setShowDiagnostics(true)}
                >
                  Ver Diagnóstico Técnico →
                </Button>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
