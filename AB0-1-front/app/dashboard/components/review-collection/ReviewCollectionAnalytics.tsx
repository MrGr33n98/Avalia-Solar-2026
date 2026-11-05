'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchApi } from '@/lib/api';
import {
  BarChart3,
  Link as LinkIcon,
  MessageCircle,
  Mail,
  QrCode,
  Code2,
  HelpCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChannelMetricItem {
  views: number;
  starts: number;
  submissions: number;
  approved: number;
  conversion_rate: number;
}

export interface ChannelMetricsResponse {
  channels: Record<string, ChannelMetricItem>;
  total: {
    views: number;
    starts: number;
    submissions: number;
    approved: number;
    conversion_rate: number;
  };
}

interface ReviewCollectionAnalyticsProps {
  formId: number;
  companyId: string;
}

const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  link: { label: 'Link Direto', icon: LinkIcon, color: 'text-blue-600 bg-blue-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
  email: { label: 'Via E-mail', icon: Mail, color: 'text-indigo-600 bg-indigo-50' },
  qr: { label: 'QR Code', icon: QrCode, color: 'text-slate-800 bg-slate-100' },
  widget: { label: 'Widget do Site', icon: Code2, color: 'text-amber-600 bg-amber-50' },
  unassigned: { label: 'Não Atribuído (Legado)', icon: HelpCircle, color: 'text-slate-500 bg-slate-50' },
};

export function ReviewCollectionAnalytics({ formId, companyId }: ReviewCollectionAnalyticsProps) {
  const [data, setData] = useState<ChannelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMetrics = async () => {
    if (!formId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetchApi<{ channel_metrics: ChannelMetricsResponse }>(
        `/company_admin/review_forms/${formId}/channel_metrics`,
        { params: { company_id: companyId } }
      );
      if (res?.channel_metrics) {
        setData(res.channel_metrics);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, [formId, companyId]);

  if (loading) {
    return (
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span>Carregando métricas por canal...</span>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Não foi possível carregar as métricas por canal deste formulário.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadMetrics}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  const channels = data.channels || {};
  const channelKeys = ['link', 'whatsapp', 'email', 'qr', 'widget', 'unassigned'];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden border">
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                Atribuição por Canal (QW-08)
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-extrabold uppercase rounded-full px-2 py-0.5 border-emerald-200 bg-emerald-50 text-emerald-800"
              >
                Métricas sob consulta
              </Badge>
            </div>
            <h3 className="text-base font-black text-slate-950">Desempenho por Canal de Coleta</h3>
            <p className="text-xs text-slate-500">
              Acompanhe de onde vêm suas avaliações. Dados anteriores são identificados como{' '}
              <strong className="text-slate-700">Não Atribuído</strong> sem distorcer o histórico.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadMetrics}
            className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Tabela do Funil por Canal */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3 text-right">Visitas</th>
                <th className="py-2.5 px-3 text-right">Inícios</th>
                <th className="py-2.5 px-3 text-right">Submissões</th>
                <th className="py-2.5 px-3 text-right">Aprovadas</th>
                <th className="py-2.5 px-3 text-right">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {channelKeys.map((key) => {
                const metric = channels[key] || {
                  views: 0,
                  starts: 0,
                  submissions: 0,
                  approved: 0,
                  conversion_rate: 0,
                };
                const config = CHANNEL_CONFIG[key] || {
                  label: key,
                  icon: HelpCircle,
                  color: 'text-slate-500 bg-slate-50',
                };
                const IconComponent = config.icon;

                return (
                  <tr key={key} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.color}`}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-slate-800">{config.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {metric.views}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {metric.starts}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {metric.submissions}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {metric.approved}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-slate-950">
                        {metric.conversion_rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

