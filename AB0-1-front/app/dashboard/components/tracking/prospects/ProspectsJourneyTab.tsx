'use client';

import { ShieldCheck, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProspectsWorkspaceResponse } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  onSelectProspect: (clickId: string) => void;
}

export default function ProspectsJourneyTab({ data, onSelectProspect }: Props) {
  const { records } = data;

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm space-y-2">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>Atribuição Determinística e Trilha Auditável</span>
        </div>
        <p className="text-xs text-[hsl(var(--dashboard-muted))] leading-relaxed">
          Cada jornada rastreia a transição do comprador entre a intenção no Avalia Solar e a navegação no seu site.
          Nenhuma inferência probabilística: a correlação só ocorre quando a Tag Parceira valida o token assinado (`as_click_id`) com integridade HMAC-SHA256 e consentimento explícito.
        </p>
      </div>

      {/* Jornadas Recentes */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
          Jornadas Observadas Recentemente ({records.length})
        </h3>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-12 text-center text-sm text-[hsl(var(--dashboard-muted))]">
            Nenhuma jornada registrada neste período. Certifique-se de que a tag está instalada e que o link no marketplace está recebendo cliques.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectProspect(r.id)}
                className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--dashboard-border))] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[hsl(var(--dashboard-ink))]">
                      {r.account_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {r.source_label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[hsl(var(--dashboard-muted))]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(r.clicked_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600">
                      Ver Trilha Completa
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Stepper Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Step 1: Clique */}
                  <div className="rounded-xl p-3 bg-blue-500/5 border border-blue-500/20 space-y-1">
                    <div className="font-semibold text-blue-600 flex items-center justify-between">
                      <span>1. Clique Inicial</span>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">Origem: {r.source_label}</div>
                    <div className="text-[hsl(var(--dashboard-muted))] truncate">{r.target_url}</div>
                  </div>

                  {/* Step 2: Chegada */}
                  <div
                    className={`rounded-xl p-3 border space-y-1 ${
                      r.evidence_status !== 'click_only'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[hsl(var(--dashboard-surface))] border-transparent opacity-50'
                    }`}
                  >
                    <div
                      className={`font-semibold flex items-center justify-between ${
                        r.evidence_status !== 'click_only' ? 'text-emerald-600' : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      <span>2. Chegada Verificada</span>
                      {r.evidence_status !== 'click_only' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">
                      {r.landing_verified_at ? 'Tag confirmada' : 'Aguardando tag'}
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))] truncate">
                      {r.referrer_host || 'Referrer preservado'}
                    </div>
                  </div>

                  {/* Step 3: Formulário */}
                  <div
                    className={`rounded-xl p-3 border space-y-1 ${
                      r.evidence_status === 'form_event_observed' || r.evidence_status === 'lead_confirmed'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-[hsl(var(--dashboard-surface))] border-transparent opacity-50'
                    }`}
                  >
                    <div
                      className={`font-semibold flex items-center justify-between ${
                        r.evidence_status === 'form_event_observed' || r.evidence_status === 'lead_confirmed'
                          ? 'text-amber-600'
                          : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      <span>3. Formulário</span>
                      {(r.evidence_status === 'form_event_observed' || r.evidence_status === 'lead_confirmed') && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">
                      {r.events_count > 0 ? `${r.events_count} eventos observados` : 'Sem submissão'}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--dashboard-muted))]">Zero captura de PII</div>
                  </div>

                  {/* Step 4: Conversão */}
                  <div
                    className={`rounded-xl p-3 border space-y-1 ${
                      r.evidence_status === 'lead_confirmed'
                        ? 'bg-purple-500/5 border-purple-500/20'
                        : 'bg-[hsl(var(--dashboard-surface))] border-transparent opacity-50'
                    }`}
                  >
                    <div
                      className={`font-semibold flex items-center justify-between ${
                        r.evidence_status === 'lead_confirmed' ? 'text-purple-600' : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      <span>4. Conversão Final</span>
                      {r.evidence_status === 'lead_confirmed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">
                      {r.evidence_status === 'lead_confirmed' ? 'Lead auditado' : 'Não convertido'}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--dashboard-muted))]">Atribuição comprovada</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
