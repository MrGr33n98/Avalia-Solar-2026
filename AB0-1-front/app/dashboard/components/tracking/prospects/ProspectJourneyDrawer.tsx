'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink, ShieldCheck, CheckCircle2, Clock, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { companyDashboardApi } from '@/lib/api';

interface Props {
  companyId: string | number;
  clickId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ProspectJourneyDrawer({ companyId, clickId, open, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['prospect-journey', companyId, clickId],
    queryFn: () => companyDashboardApi.getProspectJourney(companyId, clickId!),
    enabled: Boolean(companyId && clickId && open),
  });

  if (!open) return null;

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  const getStepBadge = (step: string) => {
    switch (step) {
      case 'outbound_click':
        return <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/10">1. Clique</Badge>;
      case 'landing_verified':
        return <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">2. Chegada Verificada</Badge>;
      case 'form_submitted':
        return <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">3. Formulário Observado</Badge>;
      case 'lead_confirmed':
      case 'quote_request_submitted':
        return <Badge variant="outline" className="border-purple-500/30 text-purple-600 bg-purple-500/10">4. Conversão Confirmada</Badge>;
      default:
        return <Badge variant="secondary">{step}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-drawer-title"
        className="relative z-10 w-full max-w-lg bg-[hsl(var(--dashboard-panel,var(--background)))] border-l border-[hsl(var(--dashboard-border,var(--border)))] shadow-2xl flex flex-col h-full overflow-hidden sm:rounded-l-2xl"
      >
        {/* Header */}
        <header className="p-5 border-b border-[hsl(var(--dashboard-border,var(--border))] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
                Trilha de Evidências
              </span>
              <Badge variant="outline" className="text-xs">
                {clickId?.slice(0, 8)}...
              </Badge>
            </div>
            <h2 id="journey-drawer-title" className="text-lg font-bold mt-1 text-[hsl(var(--dashboard-ink,var(--foreground)))]">
              Jornada Detalhada do Prospect
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar painel"
            className="rounded-full hover:bg-[hsl(var(--dashboard-surface,var(--muted)))]"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              Não foi possível carregar a jornada deste prospect. Verifique se o registro pertence ao seu tenant.
            </div>
          ) : data ? (
            <>
              {/* Summary Card */}
              <div className="rounded-xl border border-[hsl(var(--dashboard-border,var(--border)))] bg-[hsl(var(--dashboard-surface,var(--muted)/30))] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--dashboard-muted))]">Conta Identificada</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                    {data.summary.account_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--dashboard-muted))]">Origem no Avalia Solar</span>
                  <span className="text-xs font-medium text-[hsl(var(--dashboard-ink,var(--foreground)))]">
                    {data.summary.source_context}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[hsl(var(--dashboard-muted))]">Destino Oficial</span>
                  <a
                    href={data.summary.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline break-all"
                  >
                    {data.summary.target_url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold mb-3 text-[hsl(var(--dashboard-ink,var(--foreground)))]">
                  Eventos Encadeados ({data.timeline.length} etapas)
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[hsl(var(--dashboard-border,var(--border)))]">
                  {data.timeline.map((step, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-background bg-blue-600 group-first:bg-emerald-600" />
                      <div className="rounded-xl border border-[hsl(var(--dashboard-border,var(--border)))] bg-[hsl(var(--dashboard-panel,var(--background)))] p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          {getStepBadge(step.step)}
                          <div className="flex items-center gap-1 text-xs text-[hsl(var(--dashboard-muted))]">
                            <Clock className="h-3 w-3" />
                            {formatDate(step.occurred_at)}
                          </div>
                        </div>

                        <p className="text-sm font-medium text-[hsl(var(--dashboard-ink,var(--foreground)))]">
                          {step.label}
                        </p>

                        {step.landing_path && (
                          <div className="text-xs text-[hsl(var(--dashboard-muted))] flex items-center gap-1">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span>Página: {step.landing_path}</span>
                          </div>
                        )}

                        {step.referrer_host && (
                          <div className="text-xs text-[hsl(var(--dashboard-muted))]">
                            Referrer: {step.referrer_host}
                          </div>
                        )}

                        {step.consent_state && (
                          <div className="text-xs flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            <span className="text-[hsl(var(--dashboard-muted))]">
                              Consentimento LGPD: <strong>{step.consent_state === 'granted' ? 'Concedido' : step.consent_state}</strong>
                            </span>
                          </div>
                        )}

                        <div className="text-[11px] font-mono text-[hsl(var(--dashboard-muted))] pt-1 border-t border-[hsl(var(--dashboard-border,var(--border)))]">
                          Evidência: {step.evidence_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-[hsl(var(--dashboard-border,var(--border))] bg-[hsl(var(--dashboard-surface,var(--muted)/30))] flex items-center justify-between">
          <span className="text-xs text-[hsl(var(--dashboard-muted))] flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            Isolamento de tenant estrito
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </footer>
      </aside>
    </div>
  );
}
