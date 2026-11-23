'use client';

import { ArrowRight, Clock } from 'lucide-react';
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
      <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-4 text-xs space-y-1">
        <div className="font-semibold text-[hsl(var(--dashboard-ink))]">
          Atribuição Determinística e Trilha Auditável
        </div>
        <p className="text-[hsl(var(--dashboard-muted))] leading-relaxed">
          Cada jornada detalha o clique de origem e as chegadas ou eventos observados com chave de sessão válida e consentimento do usuário. Eventos do navegador não comprovam conversão final sem confirmação do CRM.
        </p>
      </div>

      {/* Jornadas Recentes */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
          Jornadas observadas recentemente ({records.length})
        </h3>

        {records.length === 0 ? (
          <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-12 text-center text-sm text-[hsl(var(--dashboard-muted))]">
            Nenhuma jornada registrada neste período. Certifique-se de que a tag está instalada e que o link no marketplace está recebendo cliques.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectProspect(r.id)}
                className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 sm:p-5 shadow-xs hover:border-[hsl(var(--dashboard-accent)/40)] transition-colors cursor-pointer space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--dashboard-border))] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[hsl(var(--dashboard-ink))]">
                      {r.account_name}
                    </span>
                    <Badge variant="outline" className="rounded-md text-xs font-normal">
                      {r.source_label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[hsl(var(--dashboard-muted))]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(r.clicked_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 rounded-lg text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-surface))]"
                    >
                      Ver Trilha
                      <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Stepper Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Step 1: Clique */}
                  <div className="rounded-lg p-3 bg-[hsl(var(--dashboard-surface))] border border-[hsl(var(--dashboard-border))] space-y-1">
                    <div className="font-semibold text-[hsl(var(--dashboard-ink))]">
                      1. Clique Inicial
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">Origem: {r.source_label}</div>
                    <div className="text-[hsl(var(--dashboard-muted))] truncate">{r.target_url}</div>
                  </div>

                  {/* Step 2: Chegada */}
                  <div
                    className={`rounded-lg p-3 border space-y-1 ${
                      r.evidence_status !== 'click_only'
                        ? 'bg-[hsl(var(--dashboard-surface))] border-emerald-500/30'
                        : 'bg-[hsl(var(--dashboard-surface)/50)] border-transparent opacity-60'
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        r.evidence_status !== 'click_only' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      2. Chegada Verificada
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
                    className={`rounded-lg p-3 border space-y-1 ${
                      r.evidence_status === 'form_event_observed' || r.evidence_status === 'lead_confirmed'
                        ? 'bg-[hsl(var(--dashboard-surface))] border-amber-500/30'
                        : 'bg-[hsl(var(--dashboard-surface)/50)] border-transparent opacity-60'
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        r.evidence_status === 'form_event_observed' || r.evidence_status === 'lead_confirmed'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      3. Formulário
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">
                      {r.events_count > 0 ? `${r.events_count} eventos observados` : 'Sem submissão'}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--dashboard-muted))]">Zero captura de PII</div>
                  </div>

                  {/* Step 4: Conversão */}
                  <div
                    className={`rounded-lg p-3 border space-y-1 ${
                      r.evidence_status === 'lead_confirmed'
                        ? 'bg-[hsl(var(--dashboard-surface))] border-[hsl(var(--dashboard-border))]'
                        : 'bg-[hsl(var(--dashboard-surface)/50)] border-transparent opacity-60'
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        r.evidence_status === 'lead_confirmed' ? 'text-[hsl(var(--dashboard-ink))]' : 'text-[hsl(var(--dashboard-muted))]'
                      }`}
                    >
                      4. Conversão Declarada
                    </div>
                    <div className="text-[hsl(var(--dashboard-muted))]">
                      Sem webhook bilateral
                    </div>
                    <div className="text-[11px] text-[hsl(var(--dashboard-muted))]">Declaração unilateral</div>
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
