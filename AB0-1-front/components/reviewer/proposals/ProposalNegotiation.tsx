'use client';

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  History,
  Info,
  MessageSquarePlus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import { canDecide, formatDate, formatMoney } from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VersionContent } from './ProposalSummary';

export function ProposalNegotiation({
  proposal,
  onUpdated,
  onChoose,
}: {
  proposal: MarketplaceProposal;
  onUpdated: (proposal: MarketplaceProposal) => void;
  onChoose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const versions = [...(proposal.versions || [])]
    .filter((version) => version.status === 'published')
    .sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span>Histórico de negociação e revisões</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Acompanhe todas as versões publicadas pela empresa para este projeto. Quando você escolhe a proposta, a versão mais recente é utilizada.
        </p>
      </div>

      {/* Request Adjustment Form */}
      {canDecide(proposal) && (
        <form
          className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || !reason.trim()) return;
            setBusy(true);
            setError('');
            try {
              onUpdated(
                (await marketplaceProposalsApi.requestChange(proposal.id, reason.trim())).proposal
              );
              setReason('');
              setSent(true);
            } catch {
              setError('Não foi possível enviar o pedido de alteração. Tente novamente.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Solicitar alteração na proposta
            </h4>
          </div>

          <label htmlFor="negotiation-reason" className="block text-xs font-semibold text-foreground">
            Descreva o que gostaria de ajustar no projeto ou valores
            <Textarea
              id="negotiation-reason"
              rows={3}
              maxLength={1000}
              required
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setSent(false);
              }}
              placeholder="Ex.: Gostaria de solicitar um ajuste no prazo de instalação para 20 dias e verificar se podemos parcelar em 18x sem juros."
              disabled={busy}
              className="mt-1.5 rounded-xl border-border text-xs"
            />
            <span className="block text-right text-[10px] text-muted-foreground mt-1">
              {reason.length}/1000
            </span>
          </label>

          {error && (
            <p role="alert" className="text-xs font-semibold text-destructive bg-destructive/10 p-3 rounded-xl">
              {error}
            </p>
          )}

          {sent && (
            <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Pedido de alteração enviado para a empresa! Você será notificado quando houver resposta.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={busy || !reason.trim()}
              className="w-full sm:w-auto font-semibold rounded-xl text-xs border-border"
            >
              {busy ? 'Enviando…' : 'Enviar solicitação de ajuste'}
            </Button>
            <Button
              type="button"
              onClick={onChoose}
              disabled={busy}
              className="w-full sm:w-auto font-bold rounded-xl text-xs bg-primary shadow-2xs gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Escolher versão atual ({proposal.version ? `v${proposal.version.number}` : ''})</span>
            </Button>
          </div>
        </form>
      )}

      {/* Version History List */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground px-1">
          Versões publicadas ({versions.length})
        </h4>

        <div className="space-y-3">
          {versions.map((version, index) => {
            const isCurrent = version.number === proposal.version?.number;
            const previousVersion = versions[index + 1];

            // Version diff metrics calculation
            const currentTotal = version.total_cents;
            const prevTotal = previousVersion?.total_cents;
            const diffCents = currentTotal != null && prevTotal != null ? currentTotal - prevTotal : null;

            return (
              <details
                key={version.id || version.number}
                className="group rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all overflow-hidden"
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs focus-visible:outline-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs',
                        isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      v{version.number}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">
                          {version.title || `Versão ${version.number}`}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Atual
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Publicada em {formatDate(version.published_at, true)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="block font-bold text-sm tabular-nums text-primary">
                        {formatMoney(version.total_cents, version.currency)}
                      </span>
                      {diffCents != null && diffCents !== 0 && (
                        <span
                          className={cn(
                            'block text-[10px] font-bold tabular-nums',
                            diffCents < 0 ? 'text-emerald-600' : 'text-rose-600'
                          )}
                        >
                          {diffCents < 0 ? '↓ ' : '↑ '}
                          {formatMoney(Math.abs(diffCents), version.currency)} vs v{previousVersion.number}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </div>
                </summary>

                <div className="mt-4 border-t border-border/60 pt-4">
                  <VersionContent version={version} />
                </div>
              </details>
            );
          })}
        </div>

        {!versions.length && (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
            Nenhuma versão publicada disponível no momento.
          </p>
        )}
      </div>
    </div>
  );
}
