'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, MousePointerClick, Sparkles, ArrowRight } from 'lucide-react';
import analyticsApi from '@/lib/api-analytics';

interface BadgeCtaAnalyticsProps {
  companyId: number;
}

type ConversionMetrics = {
  badge_cta_click?: number;
  badge_cta_view?: number;
  badges_tab_open?: number;
  lead_created?: number;
  [key: string]: number | undefined;
};

export default function BadgeCtaAnalytics({ companyId }: BadgeCtaAnalyticsProps) {
  const [metrics, setMetrics] = useState<ConversionMetrics>({});

  useEffect(() => {
    const load = async () => {
      try {
        const response = await analyticsApi.getConversionMetrics(companyId, 30);
        setMetrics(response.metrics || {});
      } catch (err) {
        console.error('[BadgeCtaAnalytics] error loading metrics', err);
      }
    };
    load();
  }, [companyId]);

  const summary = useMemo(() => {
    const clicks = metrics.badge_cta_click || 0;
    const views = metrics.badge_cta_view || 0;
    const tabOpens = metrics.badges_tab_open || 0;
    const leads = metrics.lead_created || 0;
    const ctr = views > 0 ? `${Math.round((clicks / views) * 100)}%` : '—';
    return { clicks, views, tabOpens, leads, ctr };
  }, [metrics]);

  return (
    <Card className="border border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BarChart3 className="h-4 w-4" />
          Performance do CTA de selos
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="Cliques" value={summary.clicks} icon={MousePointerClick} />
          <Metric label="Visualizacoes" value={summary.views} icon={Sparkles} />
          <Metric label="Aberturas da aba" value={summary.tabOpens} icon={ArrowRight} />
          <Metric label="Leads" value={summary.leads} icon={BarChart3} />
        </div>
        <div className="text-xs text-muted-foreground">
          CTR (cliques / visualizacoes): <span className="font-semibold text-foreground">{summary.ctr}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-lg bg-white/60 border p-3 shadow-sm flex items-center gap-3">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-base font-semibold">{value}</div>
      </div>
    </div>
  );
}
