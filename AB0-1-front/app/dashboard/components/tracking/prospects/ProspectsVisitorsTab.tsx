'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProspectsWorkspaceResponse } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  onSelectProspect: (clickId: string) => void;
}

export default function ProspectsVisitorsTab({ data, onSelectProspect }: Props) {
  const { records } = data;

  const identifiedCount = records.filter((r) => r.account_name !== 'Não identificado').length;
  const anonymousCount = records.length - identifiedCount;

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-4 text-xs space-y-1">
        <div className="font-semibold text-[hsl(var(--dashboard-ink))]">
          Privacidade e Conformidade LGPD (Zero Dados Sintéticos)
        </div>
        <p className="text-[hsl(var(--dashboard-muted))] leading-relaxed">
          O Avalia Solar não inventa nomes de empresas nem aplica fingerprinting cross-site sem base legal.
          Identificações de contas só são exibidas quando há evidência legítima fornecida via CRM integrado ou chave de identificador customizado (<code className="font-mono text-[11px]">custom_ids</code>). Visitantes sem identificação explícita são tratados estritamente como anônimos.
        </p>
      </div>

      {/* Metric Counters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <span className="text-xs font-medium text-[hsl(var(--dashboard-muted))]">
            Total de visitantes
          </span>
          <p className="mt-2 text-2xl font-bold text-[hsl(var(--dashboard-ink))]">
            {records.length}
          </p>
          <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Sessões no período</span>
        </div>

        <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <span className="text-xs font-medium text-[hsl(var(--dashboard-muted))]">
            Contas identificadas
          </span>
          <p className="mt-2 text-2xl font-bold text-[hsl(var(--dashboard-accent))]">
            {identifiedCount}
          </p>
          <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Com evidência vinculada</span>
        </div>

        <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <span className="text-xs font-medium text-[hsl(var(--dashboard-muted))]">
            Visitantes anônimos
          </span>
          <p className="mt-2 text-2xl font-bold text-[hsl(var(--dashboard-muted))]">
            {anonymousCount}
          </p>
          <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Sem identificador individual</span>
        </div>
      </div>

      {/* Tabela de Contas e Visitantes */}
      <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[hsl(var(--dashboard-border))] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
              Lista de Visitantes e Contas
            </h3>
            <p className="text-xs text-[hsl(var(--dashboard-muted))]">
              Identificação legítima baseada em evidências de primeiro contato
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Lista de visitantes e contas identificadas com dados de navegação</caption>
            <thead className="bg-[hsl(var(--dashboard-surface))] border-b border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))]">
              <tr>
                <th scope="col" className="py-3 px-4 font-semibold">Conta / Identificador</th>
                <th scope="col" className="py-3 px-4 font-semibold">Status de Evidência</th>
                <th scope="col" className="py-3 px-4 font-semibold">Primeiro Clique</th>
                <th scope="col" className="py-3 px-4 font-semibold">Origem</th>
                <th scope="col" className="py-3 px-4 font-semibold">País</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--dashboard-border))]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[hsl(var(--dashboard-muted))]">
                    Nenhum visitante registrado neste período.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isIdentified = r.account_name !== 'Não identificado';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[hsl(var(--dashboard-surface)/40)] transition-colors cursor-pointer"
                      onClick={() => onSelectProspect(r.id)}
                    >
                      <td className="py-3 px-4 font-medium">
                        <div>
                          <div className={`font-medium ${isIdentified ? 'text-[hsl(var(--dashboard-ink))]' : 'text-[hsl(var(--dashboard-muted))]'}`}>
                            {r.account_name}
                          </div>
                          <div className="text-[10px] text-[hsl(var(--dashboard-muted))] font-mono">
                            ID: {r.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`rounded-md text-[11px] ${
                            r.evidence_status === 'lead_confirmed'
                              ? 'border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-ink))] bg-[hsl(var(--dashboard-surface))]'
                              : r.evidence_status === 'landing_verified'
                              ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                              : 'border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))] bg-transparent'
                          }`}
                        >
                          {r.evidence_status === 'lead_confirmed'
                            ? 'Lead Confirmado'
                            : r.evidence_status === 'landing_verified'
                            ? 'Chegada Verificada'
                            : 'Apenas Clique'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-[hsl(var(--dashboard-muted))]">
                        {new Date(r.clicked_at).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 text-[hsl(var(--dashboard-muted))]">{r.source_label}</td>
                      <td className="py-3 px-4 text-[hsl(var(--dashboard-muted))]">{r.country}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProspect(r.id);
                          }}
                          aria-label={`Ver detalhes da jornada de ${r.account_name}`}
                          className="h-7 px-2.5 rounded-lg text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-surface))]"
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
